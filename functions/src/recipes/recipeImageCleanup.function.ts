import { createHash } from "node:crypto"

import { getFirestore } from "firebase-admin/firestore"
import { logger } from "firebase-functions"
import { onDocumentUpdated } from "firebase-functions/v2/firestore"
import { onSchedule } from "firebase-functions/v2/scheduler"

import {
    collectRecipeImagePaths,
  findRemovedRecipeImages,
} from "./recipeImagePaths.service"

const REGION = "europe-west1"
const CLEANUP_DELAY_MS = 24 * 60 * 60 * 1000

export const queueReplacedRecipeImages = onDocumentUpdated(
  {
    document: "recipes/{recipeId}",
    region: REGION,
  },
  async (event) => {
    if (!event.data) return

    const previous = event.data.before.data()
    const next = event.data.after.data()

    if (!previous || !next) return

    const recipeId = event.params.recipeId

    // Do not queue images when ownership changes unexpectedly.
    if (
      !previous.userId ||
      previous.userId !== next.userId
    ) {
      logger.warn("Recipe ownership mismatch", { recipeId })
      return
    }

    const removedPaths = findRemovedRecipeImages(
      previous,
      next
    )

    if (!removedPaths.length) return

    const db = getFirestore()
    const batch = db.batch()

    const now = Date.now()

    for (const imagePath of removedPaths) {
      // Deterministic ID protects against duplicate trigger delivery.
      const jobId = createHash("sha256")
        .update(
          `${event.id}:${recipeId}:${imagePath}`
        )
        .digest("hex")

      const jobRef = db
        .collection("recipeImageCleanupJobs")
        .doc(jobId)

      batch.set(jobRef, {
        recipeId,
        userId: next.userId,
        imagePath,

        status: "pending",
        createdAt: now,
        eligibleAt: now + CLEANUP_DELAY_MS,

        attempts: 0,
        lastError: null,
        deletedAt: null,
      })
    }

    await batch.commit()

    logger.info("Recipe image cleanup jobs created", {
      recipeId,
      count: removedPaths.length,
    })
  }
)

type CleanupJob = {
  recipeId: string
  userId: string
  imagePath: string
  status: string
  eligibleAt: number
  attempts: number
}

const MAX_JOBS_PER_RUN = 20

function isSupportedImagePath(path: string): boolean {
  return (
    /^recipe_images\/[^/]+$/.test(path) ||
    /^cooking_steps_images\/[^/]+$/.test(path) ||
    /^recipe_uploads\/[^/]+\/[^/]+\/main\/[^/]+$/.test(path) ||
    /^recipe_uploads\/[^/]+\/[^/]+\/steps\/\d+\/[^/]+$/.test(path)
  )
}

export async function runRecipeImageCleanupCheck() {
  const db = getFirestore()
  const now = Date.now()

  const jobsSnapshot = await db
    .collection("recipeImageCleanupJobs")
    .where("status", "==", "pending")
    .limit(MAX_JOBS_PER_RUN)
    .get()

  const results = {
    inspected: 0,
    eligible: 0,
    protected: 0,
    deferred: 0,
    invalid: 0,
  }

  for (const jobDoc of jobsSnapshot.docs) {
    results.inspected++

    const job = jobDoc.data() as CleanupJob

    if (
      !job.recipeId ||
      !job.userId ||
      !isSupportedImagePath(job.imagePath)
    ) {
      await jobDoc.ref.update({
        status: "invalid",
        lastError: "Invalid cleanup job data.",
        checkedAt: now,
      })

      results.invalid++
      continue
    }

    // Preserve the 24-hour safety period.
    if (
      !Number.isFinite(job.eligibleAt) ||
      job.eligibleAt > now
    ) {
      results.deferred++
      continue
    }

    const recipeSnap = await db
      .collection("recipes")
      .doc(job.recipeId)
      .get()

    if (!recipeSnap.exists) {
      // Deletion of an entire recipe is handled separately.
      await jobDoc.ref.update({
        status: "protected",
        lastError: "Recipe no longer exists.",
        checkedAt: now,
      })

      results.protected++
      continue
    }

    const recipe = recipeSnap.data()!

    if (recipe.userId !== job.userId) {
      await jobDoc.ref.update({
        status: "protected",
        lastError: "Recipe owner mismatch.",
        checkedAt: now,
      })

      results.protected++
      continue
    }

    const referencedPaths = collectRecipeImagePaths(recipe)

    if (referencedPaths.has(job.imagePath)) {
      await jobDoc.ref.update({
        status: "protected",
        lastError: "Image is still referenced by the recipe.",
        checkedAt: now,
      })

      results.protected++
      continue
    }

    // The image is no longer referenced by this recipe.
    // Do not delete until Security Rules and cross-recipe
    // reference protection are implemented.
    await jobDoc.ref.update({
      status: "verified",
      checkedAt: now,
      lastError: null,
    })

    results.eligible++
  }

  logger.info("Recipe image cleanup verification finished", results)

  return results
}

export const processRecipeImageCleanupJobs = onSchedule(
  {
    schedule: "every day 04:00",
    timeZone: "Etc/UTC",
    region: REGION,
    maxInstances: 1,
    timeoutSeconds: 540,
    memory: "512MiB",
    retryCount: 0,
  },
  async () => {
    await runRecipeImageCleanupCheck()
  }
)