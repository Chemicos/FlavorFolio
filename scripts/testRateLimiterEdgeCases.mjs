
import { randomUUID } from "node:crypto"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { initializeApp } from "firebase/app"
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
} from "firebase/auth"
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions"
import {
  getStorage,
  connectStorageEmulator,
  ref,
  uploadBytes,
} from "firebase/storage"

const PROJECT_ID = "flavorfolio-eaecb"
const BUCKET = "flavorfolio-eaecb.appspot.com"
const HOST = "127.0.0.1"

const PORTS = {
  auth: 9099,
  functions: 5001,
  firestore: 8080,
  storage: 9199,
}

// Only allow emulator connections.
process.env.GCLOUD_PROJECT = PROJECT_ID
process.env.FIRESTORE_EMULATOR_HOST =
  `${HOST}:${PORTS.firestore}`
process.env.FIREBASE_STORAGE_EMULATOR_HOST =
  `${HOST}:${PORTS.storage}`
process.env.FIREBASE_AUTH_EMULATOR_HOST =
  `${HOST}:${PORTS.auth}`

// Load Admin SDK from the existing Functions installation.
const functionsRequire = createRequire(
  pathToFileURL(resolve("functions/lib/index.js"))
)

const { initializeApp: initializeAdminApp } =
  functionsRequire("firebase-admin/app")

const {
  getFirestore,
  FieldPath,
} = functionsRequire("firebase-admin/firestore")

initializeAdminApp({ projectId: PROJECT_ID })

const adminDb = getFirestore()

const { cancelDailyAction } = functionsRequire(
  "./services/rateLimiter.service.js"
)

// Firebase Client SDK
const app = initializeApp({
  apiKey: "demo-key",
  appId: "demo-rate-limit-test",
  projectId: PROJECT_ID,
  storageBucket: BUCKET,
})

const auth = getAuth(app)

connectAuthEmulator(
  auth,
  `http://${HOST}:${PORTS.auth}`,
  { disableWarnings: true }
)

const functions = getFunctions(app, "europe-west1")
connectFunctionsEmulator(functions, HOST, PORTS.functions)

const storage = getStorage(app)
connectStorageEmulator(storage, HOST, PORTS.storage)

const beginRecipeCreation = httpsCallable(
  functions,
  "beginRecipeCreation"
)

const finalizeRecipeCreation = httpsCallable(
  functions,
  "finalizeRecipeCreation"
)

const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII="

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function getDayRef(uid, day) {
  return adminDb
    .collection("rateLimits")
    .doc(uid)
    .collection("days")
    .doc(day)
}

async function checkEmulators() {
  for (const [name, port] of Object.entries(PORTS)) {
    const response = await fetch(`http://${HOST}:${port}/`, {
      signal: AbortSignal.timeout(3000),
    }).catch(() => null)

    if (!response) {
      throw new Error(
        `${name} Emulator is not running on port ${port}.`
      )
    }
  }

  console.log("All four emulators are reachable.")
}

async function createTestUser() {
  const id = randomUUID().replaceAll("-", "")
  const email = `rate-test-${id}@example.test`
  const password = `Test-${randomUUID()}!`

  const credentials = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  )

  const uid = credentials.user.uid

  await adminDb.collection("users").doc(uid).set({
    username: `RateTester-${id.slice(0, 6)}`,
    profileImage: "",
    restrictions: {
      canPostRecipes: true,
    },
  })

  return uid
}

async function reserve(requestId = randomUUID()) {
  const response = await beginRecipeCreation({ requestId })
  return response.data
}

function createRecipe(imagePath) {
  return {
    title: "Rate Limiter Edge Case Test",
    description:
      "A local emulator recipe used to test concurrent finalization and daily request limits.",
    cuisine: "romanian",
    durationMinutes: 30,
    servings: 2,
    difficulty: "easy",
    meal: "lunch",
    visibility: "public",
    imagePath,
    ingredients: [
      {
        ingredient: "Potatoes",
        quantity: "500",
        unit: "g",
      },
    ],
    steps: [
      {
        title: "Cook",
        description: "Cook the ingredients until ready.",
        imagePath: null,
      },
    ],
  }
}

async function uploadTestImage(reservation) {
  const imagePath =
    `${reservation.uploadPrefix}main/test-image.png`

  await uploadBytes(
    ref(storage, imagePath),
    Uint8Array.from(Buffer.from(pngBase64, "base64")),
    { contentType: "image/png" }
  )

  return imagePath
}

function getUsage(document) {
  const data = document.data() ?? {}

  return {
    completed: data.counts?.createRecipe ?? 0,
    active: Object.values(data.reservations ?? {}).filter(
      (item) =>
        item.action === "createRecipe" &&
        item.expiresAt > Date.now()
    ).length,
  }
}

// TEST 1: Four concurrent requests, three slots.
async function testConcurrency() {
  console.log("\nTEST 1: Concurrent reservations")

  const uid = await createTestUser()

  const results = await Promise.allSettled(
    Array.from({ length: 4 }, () => reserve())
  )

  const accepted = results.filter(
    (result) => result.status === "fulfilled"
  )

  const rejected = results.filter(
    (result) => result.status === "rejected"
  )

  console.log("Accepted:", accepted.length)
  console.log("Rejected:", rejected.length)

  assert(accepted.length === 3, "Expected 3 accepted requests.")
  assert(rejected.length === 1, "Expected 1 rejected request.")
  assert(
    rejected[0].reason?.code === "functions/resource-exhausted",
    "Expected resource-exhausted error."
  )

  const day = accepted[0].value.day
  const snapshot = await getDayRef(uid, day).get()
  const usage = getUsage(snapshot)

  assert(usage.active === 3, "Expected 3 active reservations.")
  assert(usage.completed === 0, "Expected 0 completed recipes.")

  console.log("PASS: Concurrent limit respected.")
}

// TEST 2: Same requestId should not consume another slot.
async function testIdempotentReservation() {
  console.log("\nTEST 2: Reservation idempotency")

  const uid = await createTestUser()
  const requestId = randomUUID()

  const first = await reserve(requestId)
  const second = await reserve(requestId)

  assert(
    first.requestId === second.requestId,
    "Request IDs do not match."
  )

  assert(
    first.expiresAt === second.expiresAt,
    "Retry unexpectedly changed expiration."
  )

  const usage = getUsage(
    await getDayRef(uid, first.day).get()
  )

  assert(usage.active === 1, "Expected only one reservation.")
  assert(first.used === second.used, "Retry consumed another slot.")

  console.log("PASS: Retry did not consume another slot.")
}

// TEST 3: Expired reservation must not finalize.
async function testExpiration() {
  console.log("\nTEST 3: Expired reservation")

  const uid = await createTestUser()
  const reservation = await reserve()

  const imagePath = await uploadTestImage(reservation)

  const dayRef = getDayRef(uid, reservation.day)

  // Test-only modification to the isolated Firestore Emulator.
  await dayRef.update(
    new FieldPath(
      "reservations",
      reservation.requestId,
      "expiresAt"
    ),
    Date.now() - 1000
  )

  try {
    await finalizeRecipeCreation({
      requestId: reservation.requestId,
      day: reservation.day,
      recipe: createRecipe(imagePath),
    })

    throw new Error("Expired reservation was accepted.")
  } catch (error) {
    assert(
      error.code === "functions/failed-precondition",
      `Unexpected error: ${error.code || error.message}`
    )
  }

  const recipeDoc = await adminDb
    .collection("recipes")
    .doc(reservation.requestId)
    .get()

  assert(!recipeDoc.exists, "Expired reservation created a recipe.")

  const usage = getUsage(await dayRef.get())

  assert(usage.completed === 0, "Expired request consumed quota.")

  console.log("PASS: Expired reservation rejected.")
}

// TEST 4: Cancel a reservation and reserve again.
async function testCancellation() {
  console.log("\nTEST 4: Cancellation")

  const uid = await createTestUser()
  const reservation = await reserve()

  await cancelDailyAction({
    userId: uid,
    action: "createRecipe",
    requestId: reservation.requestId,
    day: reservation.day,
  })

  const dayRef = getDayRef(uid, reservation.day)
  const afterCancel = getUsage(await dayRef.get())

  assert(afterCancel.active === 0, "Reservation not removed.")
  assert(afterCancel.completed === 0, "Cancellation consumed quota.")

  const next = await reserve()

  assert(next.used === 1, "Expected first slot to be available.")

  console.log("PASS: Cancellation released the slot.")
}

// TEST 5: Finalize the same reservation concurrently.
async function testConcurrentFinalization() {
  console.log("\nTEST 5: Concurrent finalization")

  const uid = await createTestUser()
  const reservation = await reserve()
  const imagePath = await uploadTestImage(reservation)

  const payload = {
    requestId: reservation.requestId,
    day: reservation.day,
    recipe: createRecipe(imagePath),
  }

  const results = await Promise.allSettled([
    finalizeRecipeCreation(payload),
    finalizeRecipeCreation(payload),
  ])

  const successful = results.filter(
    (result) => result.status === "fulfilled"
  )

  assert(
    successful.length === 2,
    "Both idempotent finalization requests should succeed."
  )

  for (const result of successful) {
    assert(
      result.value.data.recipeId === reservation.requestId,
      "Unexpected recipe ID."
    )
  }

  const recipeDoc = await adminDb
    .collection("recipes")
    .doc(reservation.requestId)
    .get()

  assert(recipeDoc.exists, "Recipe was not created.")
  assert(
    recipeDoc.data()?.status === "pending",
    "Unexpected recipe status."
  )

  const dayDoc = await getDayRef(uid, reservation.day).get()
  const dayData = dayDoc.data() ?? {}

  assert(
    dayData.counts?.createRecipe === 1,
    "Quota was incremented more than once."
  )

  assert(
    !dayData.reservations?.[reservation.requestId],
    "Completed reservation still exists."
  )

  assert(
    dayData.completed?.[reservation.requestId]?.action ===
      "createRecipe",
    "Completion record is missing."
  )

  console.log("PASS: One recipe and one quota increment.")
}

async function main() {
  await checkEmulators()

  await testConcurrency()
  await testIdempotentReservation()
  await testExpiration()
  await testCancellation()
  await testConcurrentFinalization()

  console.log("\nALL RATE LIMITER EDGE CASE TESTS PASSED.")
}

let exitCode = 0

try {
  await main()
} catch (error) {
  exitCode = 1
  console.error("\nTEST FAILED:", error)
} finally {
  await auth.signOut().catch(() => {})
  await adminDb.terminate().catch(() => {})
}

process.exit(exitCode)
