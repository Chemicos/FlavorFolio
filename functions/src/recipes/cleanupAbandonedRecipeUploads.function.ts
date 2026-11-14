import { randomUUID } from "node:crypto"

import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import { logger } from "firebase-functions"
import { onSchedule } from "firebase-functions/v2/scheduler"

const REGION = "europe-west1"

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000
const CLEANING_LEASE_MS = 60 * 60 * 1000
const MAX_SESSIONS_PER_RUN = 20

type SessionStatus =
  | "active"
  | "cancelled"
  | "completed"
  | "cleaning"
  | "cleaned"

type UploadSession = {
  userId: string
  requestId: string
  day: string
  uploadPrefix: string
  status: SessionStatus
  expiresAt: number
  cleaningStartedAt?: number
  cleaningToken?: string
}

function isValidSession(
  session: UploadSession,
  requestId: string
): boolean {
  if (
    !session.userId ||
    !/^[a-zA-Z0-9_-]{8,128}$/.test(requestId) ||
    !/^[a-zA-Z0-9_-]+$/.test(session.userId)
  ) {
    return false
  }

  const expectedPrefix =
    `recipe_uploads/${session.userId}/${requestId}/`

  return (
    session.requestId === requestId &&
    session.uploadPrefix === expectedPrefix &&
    Number.isFinite(session.expiresAt) &&
    session.expiresAt > 0
  )
}

function isEligible(
  session: UploadSession,
  now: number
): boolean {
  if (
    session.status === "completed" ||
    session.status === "cleaned"
  ) {
    return false
  }

  if (
    session.status !== "active" &&
    session.status !== "cancelled" &&
    session.status !== "cleaning"
  ) {
    return false
  }

  if (now < session.expiresAt + GRACE_PERIOD_MS) {
    return false
  }

  if (session.status === "cleaning") {
    const startedAt = session.cleaningStartedAt

    return (
      typeof startedAt === "number" &&
      now - startedAt >= CLEANING_LEASE_MS
    )
  }

  return true
}

/**
 * Atomically claims one abandoned upload session.
 * A completed recipe is always protected.
 */
async function claimSession(requestId: string) {
  const db = getFirestore()

  const sessionRef = db
    .collection("recipeUploadSessions")
    .doc(requestId)

  const recipeRef = db
    .collection("recipes")
    .doc(requestId)

  const now = Date.now()
  const token = randomUUID()

  return db.runTransaction(async (transaction) => {
    // All reads must happen before transaction writes.
    const [sessionSnap, recipeSnap] = await Promise.all([
      transaction.get(sessionRef),
      transaction.get(recipeRef),
    ])

    if (!sessionSnap.exists) return null

    const session = sessionSnap.data() as UploadSession

    if (!isValidSession(session, requestId)) {
      logger.warn("Invalid upload session. Skipping.", {
        requestId,
      })

      return null
    }

    if (
      recipeSnap.exists ||
      session.status === "completed" ||
      session.status === "cleaned"
    ) {
      return null
    }

    if (!isEligible(session, now)) return null

    transaction.update(sessionRef, {
      status: "cleaning",
      cleaningStartedAt: now,
      cleaningToken: token,
      lastCleanupError: null,
    })

    return {
      requestId,
      prefix: session.uploadPrefix,
      token,
    }
  })
}

/**
 * Delete only files belonging to the claimed upload prefix.
 * An interrupted cleanup can be retried safely.
 */
async function cleanupOneSession(
  requestId: string
): Promise<"cleaned" | "skipped" | "failed"> {
  const claim = await claimSession(requestId)

  if (!claim) return "skipped"

  const db = getFirestore()

  const sessionRef = db
    .collection("recipeUploadSessions")
    .doc(requestId)

  const recipeRef = db
    .collection("recipes")
    .doc(requestId)

  try {
    // Defensive recheck before the destructive operation.
    const [sessionSnap, recipeSnap] = await Promise.all([
      sessionRef.get(),
      recipeRef.get(),
    ])

    if (
      recipeSnap.exists ||
      !sessionSnap.exists ||
      sessionSnap.data()?.status !== "cleaning" ||
      sessionSnap.data()?.cleaningToken !== claim.token
    ) {
      return "skipped"
    }

    const bucket = getStorage().bucket()

    const [files] = await bucket.getFiles({
      prefix: claim.prefix,
    })

    for (const file of files) {
      if (!file.name.startsWith(claim.prefix)) {
        throw new Error("Unexpected Storage object path.")
      }

      await file.delete({ ignoreNotFound: true })
    }

    await db.runTransaction(async (transaction) => {
      const [currentSession, currentRecipe] =
        await Promise.all([
          transaction.get(sessionRef),
          transaction.get(recipeRef),
        ])

      if (
        !currentSession.exists ||
        currentRecipe.exists ||
        currentSession.data()?.status !== "cleaning" ||
        currentSession.data()?.cleaningToken !== claim.token
      ) {
        return
      }

      transaction.update(sessionRef, {
        status: "cleaned",
        cleanedAt: Date.now(),
        deletedFilesCount: files.length,
        cleaningToken: null,
      })
    })

    logger.info("Abandoned recipe upload cleaned", {
      requestId,
      deletedFilesCount: files.length,
    })

    return "cleaned"
  } catch (error) {
    logger.error("Failed to clean recipe upload", {
      requestId,
      error,
    })

    // Keep cleaning status. The lease allows a later retry.
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(sessionRef)

      if (
        snapshot.exists &&
        snapshot.data()?.status === "cleaning" &&
        snapshot.data()?.cleaningToken === claim.token
      ) {
        transaction.update(sessionRef, {
          lastCleanupError:
            error instanceof Error
              ? error.message.slice(0, 500)
              : "Unknown cleanup error",
        })
      }
    })

    return "failed"
  }
}

/**
 * Reusable runner for the scheduled function and emulator tests.
 */
export async function runAbandonedRecipeCleanup() {
  const db = getFirestore()

  const results = {
    inspected: 0,
    cleaned: 0,
    skipped: 0,
    failed: 0,
  }

  for (const status of [
    "active",
    "cancelled",
    "cleaning",
  ] as const) {
    const snapshot = await db
      .collection("recipeUploadSessions")
      .where("status", "==", status)
      .limit(MAX_SESSIONS_PER_RUN)
      .get()

    for (const document of snapshot.docs) {
      results.inspected++

      const result = await cleanupOneSession(document.id)

      results[result]++
    }
  }

  logger.info("Recipe upload cleanup finished", results)

  return results
}

/**
 * Runs daily in UTC.
 * Requires Firebase Cloud Scheduler in production.
 */
export const cleanupAbandonedRecipeUploads = onSchedule(
  {
    schedule: "every day 03:00",
    timeZone: "Etc/UTC",
    region: REGION,
    maxInstances: 1,
    timeoutSeconds: 540,
    memory: "512MiB",
    retryCount: 0,
  },
  async () => {
    await runAbandonedRecipeCleanup()
  }
)