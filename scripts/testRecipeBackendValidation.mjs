import { randomUUID } from "node:crypto"
import { createRequire } from "node:module"
import { resolve } from "node:path"

import { initializeApp as initializeClientApp, deleteApp } from "firebase/app"
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut,
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

// Safety: the Admin SDK must only access local emulators.
const PROJECT_ID = "flavorfolio-eaecb"
const BUCKET = "flavorfolio-eaecb.appspot.com"

process.env.GCLOUD_PROJECT = PROJECT_ID
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199"

const requireFunctions = createRequire(
  resolve("functions/package.json")
)

const { initializeApp: initializeAdminApp } =
  requireFunctions("firebase-admin/app")

const { getAuth: getAdminAuth } =
  requireFunctions("firebase-admin/auth")

const { getFirestore } =
  requireFunctions("firebase-admin/firestore")

const adminApp = initializeAdminApp({
  projectId: PROJECT_ID,
  storageBucket: BUCKET,
})

const adminAuth = getAdminAuth(adminApp)
const db = getFirestore(adminApp)

const app = initializeClientApp({
  apiKey: "demo-key",
  appId: "demo-app-backend-validation",
  projectId: PROJECT_ID,
  storageBucket: BUCKET,
})

const auth = getAuth(app)

connectAuthEmulator(
  auth,
  "http://127.0.0.1:9099",
  { disableWarnings: true }
)

const functions = getFunctions(app, "europe-west1")
connectFunctionsEmulator(functions, "127.0.0.1", 5001)

const storage = getStorage(app)
connectStorageEmulator(storage, "127.0.0.1", 9199)

const beginRecipeCreation = httpsCallable(
  functions,
  "beginRecipeCreation"
)

const finalizeRecipeCreation = httpsCallable(
  functions,
  "finalizeRecipeCreation"
)

const password = "TestPassword123!"
const suffix = randomUUID().slice(0, 8)

const results = {
  passed: 0,
  failed: 0,
}

const pngBytes = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=",
    "base64"
  )
)

async function expectError(name, code, operation) {
  try {
    await operation()

    results.failed++
    console.error(`FAIL: ${name} - unexpectedly succeeded`)
  } catch (error) {
    if (error?.code === `functions/${code}`) {
      results.passed++
      console.log(`PASS: ${name} (${code})`)
    } else {
      results.failed++
      console.error(`FAIL: ${name}`)
      console.error("Expected:", `functions/${code}`)
      console.error("Received:", error?.code, error?.message)
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function createTestUser(name, createProfile = true, restricted = false) {
  const email = `${name}-${suffix}@flavorfolio.test`

  const user = await adminAuth.createUser({
    email,
    password,
  })

  if (createProfile) {
    await db.collection("users").doc(user.uid).set({
      username: name,
      admin: false,
      profileImage: "",
      restrictions: {
        canPostRecipes: !restricted,
      },
    })
  }

  return {
    uid: user.uid,
    email,
  }
}

async function login(user) {
  await signOut(auth)
  await signInWithEmailAndPassword(auth, user.email, password)
}

function validRecipe(imagePath) {
  return {
    title: "Valid Test Recipe",
    description:
      "This is a valid recipe description for testing backend validation.",
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
        title: "Prepare",
        description: "Wash the ingredients.",
        imagePath: null,
      },
    ],
  }
}

function imagePathFor(userId, requestId) {
  return `recipe_uploads/${userId}/${requestId}/main/test.png`
}

async function reserve() {
  const requestId = randomUUID()
  const response = await beginRecipeCreation({ requestId })

  return response.data
}

async function main() {
  console.log("\n=== RECIPE BACKEND VALIDATION TESTS ===\n")

  // TEST 1 and 2: unauthenticated calls.
  await expectError(
    "1. Begin without authentication",
    "unauthenticated",
    () => beginRecipeCreation({ requestId: randomUUID() })
  )

  await expectError(
    "2. Finalize without authentication",
    "unauthenticated",
    () =>
      finalizeRecipeCreation({
        requestId: randomUUID(),
        day: new Date().toISOString().slice(0, 10),
        recipe: validRecipe("missing-image.png"),
      })
  )

  // TEST 3: authenticated user without Firestore profile.
  const missingProfileUser = await createTestUser(
    "missing-profile",
    false
  )

  await login(missingProfileUser)

  await expectError(
    "3. User profile not found",
    "permission-denied",
    () => beginRecipeCreation({ requestId: randomUUID() })
  )

  // TEST 4: user restricted from creating recipes.
  const restrictedUser = await createTestUser(
    "restricted",
    true,
    true
  )

  await login(restrictedUser)

  await expectError(
    "4. Restricted user cannot create recipes",
    "permission-denied",
    () => beginRecipeCreation({ requestId: randomUUID() })
  )

  // All remaining tests use a fresh, permitted user.
  const allowedUser = await createTestUser("allowed")
  await login(allowedUser)

  const reservation = await reserve()
  const ownImagePath = imagePathFor(
    allowedUser.uid,
    reservation.requestId
  )

  const finalize = (recipe) =>
    finalizeRecipeCreation({
      requestId: reservation.requestId,
      day: reservation.day,
      recipe,
    })

  // TEST 5: Invalid title.
  await expectError(
    "5. Title too short",
    "invalid-argument",
    () =>
      finalize({
        ...validRecipe(ownImagePath),
        title: "Hi",
      })
  )

  // TEST 6: Empty ingredient list.
  await expectError(
    "6. Empty ingredients",
    "invalid-argument",
    () =>
      finalize({
        ...validRecipe(ownImagePath),
        ingredients: [],
      })
  )

  // TEST 7: Too many cooking steps.
  await expectError(
    "7. More than 30 cooking steps",
    "invalid-argument",
    () =>
      finalize({
        ...validRecipe(ownImagePath),
        steps: Array.from({ length: 31 }, (_, index) => ({
          title: `Step ${index + 1}`,
          description: "Prepare ingredients.",
          imagePath: null,
        })),
      })
  )

  // TEST 8: Image path from a different user.
  const foreignImagePath = imagePathFor(
    restrictedUser.uid,
    reservation.requestId
  )

  await expectError(
    "8. Foreign user image path",
    "invalid-argument",
    () => finalize(validRecipe(foreignImagePath))
  )

  // TEST 9: Correct path, but image not uploaded.
  await expectError(
    "9. Missing uploaded image",
    "failed-precondition",
    () => finalize(validRecipe(ownImagePath))
  )

  // TEST 10: Upload a valid image, then expire the reservation.
  await uploadBytes(
    ref(storage, ownImagePath),
    pngBytes,
    { contentType: "image/png" }
  )

  const dayRef = db
    .collection("rateLimits")
    .doc(allowedUser.uid)
    .collection("days")
    .doc(reservation.day)

  const expiredAt = Date.now() - 1000

  await dayRef.update({
    [`reservations.${reservation.requestId}.expiresAt`]: expiredAt,
  })

  await db
    .collection("recipeUploadSessions")
    .doc(reservation.requestId)
    .update({
      expiresAt: expiredAt,
    })

  await expectError(
    "10. Expired reservation cannot finalize",
    "failed-precondition",
    () => finalize(validRecipe(ownImagePath))
  )

  // Verify that none of the invalid calls created a recipe.
  const recipeSnapshot = await db.collection("recipes").doc(reservation.requestId).get()

  assert(
    !recipeSnapshot.exists,
    "Invalid requests unexpectedly created a recipe."
  )

  const usageSnapshot = await dayRef.get()
  const usage = usageSnapshot.data() || {}

  assert(
    (usage.counts?.createRecipe ?? 0) === 0,
    "Invalid requests consumed the daily creation counter."
  )

  console.log("PASS: No recipe created by invalid calls.")
  console.log("PASS: Completed daily usage remains zero.")

  console.log("\n=== TEST RESULTS ===")
  console.log(`Passed: ${results.passed}`)
  console.log(`Failed: ${results.failed}`)

  if (results.failed > 0) {
    process.exitCode = 1
    console.error("BACKEND VALIDATION TESTS FAILED.")
  } else {
    console.log("ALL BACKEND VALIDATION TESTS PASSED.")
  }
}

try {
  await main()
} catch (error) {
  console.error("TEST RUNNER FAILED:", error)
  process.exitCode = 1
} finally {
  await signOut(auth).catch(() => {})
  await db.terminate()
  await adminApp.delete()
  await deleteApp(app)
}
