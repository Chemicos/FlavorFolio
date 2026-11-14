
import { randomUUID } from "node:crypto"
import { createRequire } from "node:module"
import { resolve } from "node:path"

const PROJECT_ID = "flavorfolio-eaecb"
const BUCKET = "flavorfolio-eaecb.appspot.com"

// Explicitly connect Admin SDK to local emulators.
process.env.GCLOUD_PROJECT = PROJECT_ID
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199"

// Resolve packages from functions/node_modules.
const requireFunctions = createRequire(
  resolve("functions/package.json")
)

const { initializeApp } = requireFunctions("firebase-admin/app")
const { getFirestore } = requireFunctions("firebase-admin/firestore")
const { getStorage } = requireFunctions("firebase-admin/storage")

initializeApp({
  projectId: PROJECT_ID,
  storageBucket: BUCKET,
})

const db = getFirestore()
const bucket = getStorage().bucket()

const { runAbandonedRecipeCleanup } = requireFunctions(
  "./lib/recipes/cleanupAbandonedRecipeUploads.function.js"
)

const userId = `test-user-${randomUUID().slice(0, 8)}`
const expiredAt = Date.now() - 26 * 60 * 60 * 1000

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function createSession(status) {
  const requestId = randomUUID()

  const uploadPrefix =
    `recipe_uploads/${userId}/${requestId}/`

  const imagePath =
    `${uploadPrefix}main/test-image.png`

  await db
    .collection("recipeUploadSessions")
    .doc(requestId)
    .set({
      userId,
      requestId,
      day: "2026-10-18",
      uploadPrefix,
      status,
      createdAt: expiredAt - 1000,
      expiresAt: expiredAt,
      completedAt:
        status === "completed" ? Date.now() : null,
      cancelledAt: null,
    })

  await bucket.file(imagePath).save(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=",
      "base64"
    ),
    { contentType: "image/png" }
  )

  if (status === "completed") {
    await db.collection("recipes").doc(requestId).set({
      userId,
      status: "pending",
      imageFileName: imagePath,
    })
  }

  return { requestId, imagePath }
}

async function createSafetyTestSession({
  status,
  expired = true,
  createRecipe = false,
  cleaningLeaseExpired = false,
}) {
  const requestId = randomUUID()

  const now = Date.now()

  const expiresAt = expired
    ? now - 26 * 60 * 60 * 1000
    : now + 15 * 60 * 1000

  const uploadPrefix =
    `recipe_uploads/${userId}/${requestId}/`

  const imagePath =
    `${uploadPrefix}main/test-image.png`

  const session = {
    userId,
    requestId,
    day: new Date(expiresAt).toISOString().slice(0, 10),
    uploadPrefix,
    status,
    createdAt: expiresAt - 15 * 60 * 1000,
    expiresAt,
    completedAt: null,
    cancelledAt: null,
  }

  if (status === "cleaning") {
    Object.assign(session, {
      cleaningStartedAt: cleaningLeaseExpired
        ? now - 2 * 60 * 60 * 1000
        : now,
      cleaningToken: randomUUID(),
    })
  }

  await db
    .collection("recipeUploadSessions")
    .doc(requestId)
    .set(session)

  await bucket.file(imagePath).save(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=",
      "base64"
    ),
    { contentType: "image/png" }
  )

  if (createRecipe) {
    await db.collection("recipes").doc(requestId).set({
      userId,
      status: "pending",
      imageFileName: imagePath,
    })
  }

  return { requestId, imagePath }
}

// TEST 3: An active, unexpired session must be preserved.
async function testUnexpiredSession() {
  console.log("\nTEST 3: Unexpired active session")

  const session = await createSafetyTestSession({
    status: "active",
    expired: false,
  })

  await runAbandonedRecipeCleanup()

  const [exists] = await bucket
    .file(session.imagePath)
    .exists()

  const snapshot = await db
    .collection("recipeUploadSessions")
    .doc(session.requestId)
    .get()

  assert(exists, "Unexpired image was deleted.")
  assert(
    snapshot.data()?.status === "active",
    "Unexpired session status changed."
  )

  console.log("PASS: Unexpired image preserved.")
}

// TEST 4: Recover a cleaning session after lease expiration.
async function testInterruptedCleanup() {
  console.log("\nTEST 4: Interrupted cleanup recovery")

  const session = await createSafetyTestSession({
    status: "cleaning",
    expired: true,
    cleaningLeaseExpired: true,
  })

  await runAbandonedRecipeCleanup()

  const [exists] = await bucket
    .file(session.imagePath)
    .exists()

  const snapshot = await db
    .collection("recipeUploadSessions")
    .doc(session.requestId)
    .get()

  assert(!exists, "Interrupted cleanup did not delete image.")
  assert(
    snapshot.data()?.status === "cleaned",
    "Interrupted session was not marked cleaned."
  )
  assert(
    snapshot.data()?.cleaningToken === null,
    "Cleaning token was not released."
  )

  console.log("PASS: Interrupted cleanup recovered.")
}

// TEST 5: Existing recipe must protect its image,
// even if the session incorrectly says "active".
async function testExistingRecipeProtection() {
  console.log("\nTEST 5: Existing recipe protection")

  const session = await createSafetyTestSession({
    status: "active",
    expired: true,
    createRecipe: true,
  })

  await runAbandonedRecipeCleanup()

  const [exists] = await bucket
    .file(session.imagePath)
    .exists()

  const sessionSnapshot = await db
    .collection("recipeUploadSessions")
    .doc(session.requestId)
    .get()

  const recipeSnapshot = await db
    .collection("recipes")
    .doc(session.requestId)
    .get()

  assert(exists, "An existing recipe lost its image.")
  assert(recipeSnapshot.exists, "Recipe document is missing.")
  assert(
    sessionSnapshot.data()?.status === "active",
    "Protected session status changed."
  )

  console.log("PASS: Existing recipe image preserved.")
}

async function main() {
  console.log("TEST 1: Abandoned and completed uploads")

  const abandoned = await createSession("active")
  const completed = await createSession("completed")

  await runAbandonedRecipeCleanup()

  const [abandonedExists] = await bucket
    .file(abandoned.imagePath)
    .exists()

  const [completedExists] = await bucket
    .file(completed.imagePath)
    .exists()

  const abandonedSnapshot = await db
    .collection("recipeUploadSessions")
    .doc(abandoned.requestId)
    .get()

  const completedSnapshot = await db
    .collection("recipeUploadSessions")
    .doc(completed.requestId)
    .get()

  assert(!abandonedExists, "Abandoned image was not deleted.")
  assert(
    abandonedSnapshot.data()?.status === "cleaned",
    "Abandoned session was not cleaned."
  )

  console.log("PASS: Abandoned image deleted.")

  console.log("\nTEST 2: Completed session protection")

  assert(completedExists, "Completed image was deleted.")
  assert(
    completedSnapshot.data()?.status === "completed",
    "Completed session status changed."
  )

  console.log("PASS: Completed image preserved.")

  await testUnexpiredSession()
  await testInterruptedCleanup()
  await testExistingRecipeProtection()

  console.log("\nALL 5 CLEANUP SAFETY TESTS PASSED.")
}

try {
  await main()
} catch (error) {
  console.error("TEST FAILED:", error)
  process.exitCode = 1
} finally {
  await db.terminate()
}
