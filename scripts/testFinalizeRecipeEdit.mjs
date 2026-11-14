import { randomUUID } from "node:crypto"
import { createRequire } from "node:module"
import { resolve } from "node:path"

import {
  initializeApp as initializeClientApp,
  deleteApp,
} from "firebase/app"

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

const PROJECT_ID = "flavorfolio-eaecb"
const BUCKET = "flavorfolio-eaecb.appspot.com"
const EDIT_LIMIT = 4

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

const clientApp = initializeClientApp({
  apiKey: "demo-key",
  appId: "demo-app-finalize-edit-tests",
  projectId: PROJECT_ID,
  storageBucket: BUCKET,
})

const auth = getAuth(clientApp)

connectAuthEmulator(
  auth,
  "http://127.0.0.1:9099",
  { disableWarnings: true }
)

const functions = getFunctions(clientApp, "europe-west1")
connectFunctionsEmulator(functions, "127.0.0.1", 5001)

const storage = getStorage(clientApp)
connectStorageEmulator(storage, "127.0.0.1", 9199)

const beginRecipeEdit = httpsCallable(functions, "beginRecipeEdit")
const finalizeRecipeEdit = httpsCallable(functions, "finalizeRecipeEdit")

const suffix = randomUUID().slice(0, 8)
const password = "TestPassword123!"

const results = {
  passed: 0,
  failed: 0,
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function test(name, operation) {
  try {
    await operation()
    results.passed++
    console.log(`PASS: ${name}`)
  } catch (error) {
    results.failed++
    console.error(`FAIL: ${name}`)
    console.error(error)
  }
}

async function expectFunctionError(expectedCode, operation) {
  try {
    await operation()
  } catch (error) {
    assert(
      error?.code === `functions/${expectedCode}`,
      `Expected functions/${expectedCode}, got ${error?.code}: ${error?.message}`
    )
    return
  }

  throw new Error(
    `Expected functions/${expectedCode}, but operation succeeded.`
  )
}

async function createUser(name) {
  const email = `finalize-${name}-${suffix}@flavorfolio.test`

  const user = await adminAuth.createUser({
    email,
    password,
  })

  await db.collection("users").doc(user.uid).set({
    username: name,
    role: "member",
    admin: false,
    profileImage: "",
    restrictions: {
      canPostRecipes: true,
    },
  })

  return { uid: user.uid, email }
}

async function login(user) {
  await signOut(auth)
  await signInWithEmailAndPassword(auth, user.email, password)
}

async function createRecipe(userId, status = "published") {
  const recipeId = randomUUID()

  await db.collection("recipes").doc(recipeId).set({
    userId,
    user: "TestUser",
    author: {
      username: "TestUser",
      profileImage: "",
    },
    title: "Original Recipe Title",
    description:
      "Original recipe description containing enough characters.",
    cuisine: "romanian",
    durationMinutes: 30,
    servings: 2,
    difficulty: "easy",
    meal: "lunch",
    visibility: "public",
    image: "https://example.invalid/original-image.png",
    imageFileName: "recipe_images/original-image.png",
    ingredients: [
      { ingredient: "Potatoes", quantity: "500", unit: "g" },
    ],
    cookingSteps: [
      {
        title: "Prepare",
        description: "Prepare the potatoes.",
        image: null,
        imageFileName: null,
        error: false,
      },
    ],
    status,
    moderation: {
      submittedAt: null,
      reviewedAt: null,
      reviewedBy: null,
      revisionFeedback: "Please improve the recipe.",
      denialReason: "",
    },
    stats: {
      averageRating: 0,
      ratingsCount: 0,
      ratingsSum: 0,
      commentsCount: 0,
      savesCount: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return recipeId
}

function recipePayload(imagePath = "recipe_images/original-image.png") {
  return {
    title: "Updated Recipe Title",
    description:
      "Updated description that contains enough characters to pass validation.",
    cuisine: "romanian",
    durationMinutes: 45,
    servings: 4,
    difficulty: "medium",
    meal: "dinner",
    visibility: "public",
    imagePath,
    ingredients: [
      { ingredient: "Potatoes", quantity: "750", unit: "g" },
      { ingredient: "Salt", quantity: "5", unit: "g" },
    ],
    steps: [
      {
        title: "Prepare ingredients",
        description: "Wash and peel the potatoes.",
        imagePath: null,
      },
    ],
  }
}

async function begin(recipeId) {
  const response = await beginRecipeEdit({
    recipeId,
    requestId: randomUUID(),
  })

  return response.data
}

async function finalize(reservation, recipeId, recipe) {
  const response = await finalizeRecipeEdit({
    recipeId,
    requestId: reservation.requestId,
    day: reservation.day,
    recipe,
  })

  return response.data
}

async function readRecipe(recipeId) {
  return db.collection("recipes").doc(recipeId).get()
}

async function readUsage(userId, day) {
  const snapshot = await db
    .collection("rateLimits")
    .doc(userId)
    .collection("days")
    .doc(day)
    .get()

  return snapshot.data() || {}
}

async function verifyCompleted(userId, reservation, recipeId) {
  const usage = await readUsage(userId, reservation.day)
  const sessionSnapshot = await db
    .collection("recipeEditSessions")
    .doc(reservation.requestId)
    .get()

  assert(
    sessionSnapshot.data()?.status === "completed",
    "Edit session was not completed."
  )

  assert(
    usage.completed?.[reservation.requestId]?.action === "editRecipe",
    "Completed rate-limit record is missing."
  )

  const recipeSnapshot = await readRecipe(recipeId)
  assert(recipeSnapshot.exists, "Recipe was not found after editing.")
}

async function verifyNotCompleted(userId, reservation, recipeId) {
  const usage = await readUsage(userId, reservation.day)

  assert(
    !usage.completed?.[reservation.requestId],
    "Rejected edit was unexpectedly completed."
  )

  const snapshot = await readRecipe(recipeId)
  assert(snapshot.exists, "Recipe was unexpectedly removed.")
}

const pngBytes = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=",
    "base64"
  )
)

async function main() {
  console.log("\n=== FINALIZE RECIPE EDIT TESTS ===\n")

  const user = await createUser("owner")
  await login(user)

  // 1. Published -> Draft.
  await test("1. Published recipe becomes draft", async () => {
    const id = await createRecipe(user.uid, "published")
    const reservation = await begin(id)

    const result = await finalize(
      reservation,
      id,
      recipePayload()
    )

    const snapshot = await readRecipe(id)
    const data = snapshot.data()

    assert(result.recipeId === id, "Unexpected recipe ID.")
    assert(result.alreadyCompleted === false, "Unexpected retry result.")
    assert(data.status === "draft", "Recipe is not draft.")
    assert(data.title === "Updated Recipe Title", "Title was not updated.")
    assert(data.ingredients.length === 2, "Ingredients were not updated.")

    await verifyCompleted(user.uid, reservation, id)
  })

  // 2. Draft remains draft.
  await test("2. Draft remains draft", async () => {
    const id = await createRecipe(user.uid, "draft")
    const reservation = await begin(id)

    await finalize(reservation, id, recipePayload())

    const snapshot = await readRecipe(id)
    assert(snapshot.data()?.status === "draft", "Status changed unexpectedly.")
    await verifyCompleted(user.uid, reservation, id)
  })

  // 3. Needs revision keeps feedback.
  await test("3. Needs revision preserves feedback", async () => {
    const id = await createRecipe(user.uid, "needs_revision")
    const reservation = await begin(id)

    await finalize(reservation, id, recipePayload())

    const data = (await readRecipe(id)).data()

    assert(data.status === "needs_revision", "Revision status changed.")
    assert(
      data.moderation?.revisionFeedback === "Please improve the recipe.",
      "Revision feedback was lost."
    )

    await verifyCompleted(user.uid, reservation, id)
  })

  // 4. Existing image remains unchanged.
  await test("4. Existing main image is preserved", async () => {
    const separateUser = await createUser("existing-image")
    await login(separateUser)

    const id = await createRecipe(separateUser.uid)
    const reservation = await begin(id)

    await finalize(reservation, id, recipePayload())

    const data = (await readRecipe(id)).data()

    assert(
      data.imageFileName === "recipe_images/original-image.png",
      "Existing image path was changed."
    )

    assert(
      data.image === "https://example.invalid/original-image.png",
      "Existing image URL was changed."
    )

    await login(user)
  })

  // The first user has now used all 4 daily edit operations.
  // The next attempt must be rejected.
  await test("5. Fifth operation is blocked", async () => {
    // Complete the fourth operation for the main user.
    const fourthRecipeId = await createRecipe(user.uid)
    const fourthReservation = await begin(fourthRecipeId)

    await finalize(
        fourthReservation,
        fourthRecipeId,
        recipePayload()
    )

    const usage = await readUsage(user.uid, fourthReservation.day)

    assert(
        usage.counts?.editRecipe === EDIT_LIMIT,
        `Expected ${EDIT_LIMIT} completed edits.`
    )

    // The fifth operation must be blocked.
    const fifthRecipeId = await createRecipe(user.uid)

    await expectFunctionError(
        "resource-exhausted",
        () =>
        beginRecipeEdit({
            recipeId: fifthRecipeId,
            requestId: randomUUID(),
        })
    )
    })

  // 6. Retry a completed operation, using a fresh user.
  await test("6. Finalize retry does not increase counter", async () => {
    const retryUser = await createUser("retry")
    await login(retryUser)

    const id = await createRecipe(retryUser.uid)
    const reservation = await begin(id)

    const payload = recipePayload()

    const first = await finalize(reservation, id, payload)
    const before = (await readRecipe(id)).updateTime.toMillis()
    const usageBefore = await readUsage(retryUser.uid, reservation.day)

    const second = await finalize(reservation, id, payload)
    const after = (await readRecipe(id)).updateTime.toMillis()
    const usageAfter = await readUsage(retryUser.uid, reservation.day)

    assert(first.alreadyCompleted === false, "First finalize failed.")
    assert(second.alreadyCompleted === true, "Retry was not detected.")
    assert(before === after, "Retry modified the recipe.")
    assert(
      usageBefore.counts?.editRecipe === 1 &&
      usageAfter.counts?.editRecipe === 1,
      "Retry incremented the counter."
    )

    await login(user)
  })

  // 7. Image path from a different edit session.
  await test("7. Foreign edit image path is rejected", async () => {
    const foreignUser = await createUser("foreign-image")
    await login(foreignUser)

    const id = await createRecipe(foreignUser.uid)
    const reservation = await begin(id)

    const invalidPath =
      `recipe_edit_uploads/${foreignUser.uid}/${randomUUID()}/main/test.png`

    await expectFunctionError(
      "invalid-argument",
      () => finalize(reservation, id, recipePayload(invalidPath))
    )

    await verifyNotCompleted(foreignUser.uid, reservation, id)
    await login(user)
  })

  // 8. Correct session path, but no file exists.
  await test("8. Missing uploaded image is rejected", async () => {
    const missingUser = await createUser("missing-image")
    await login(missingUser)

    const id = await createRecipe(missingUser.uid)
    const reservation = await begin(id)

    const path = `${reservation.uploadPrefix}main/missing.png`

    await expectFunctionError(
      "failed-precondition",
      () => finalize(reservation, id, recipePayload(path))
    )

    await verifyNotCompleted(missingUser.uid, reservation, id)
    await login(user)
  })

  // 9. The recipe changes after the edit session begins.
  await test("9. Stale recipe version is rejected", async () => {
    const staleUser = await createUser("stale")
    await login(staleUser)

    const id = await createRecipe(staleUser.uid)
    const reservation = await begin(id)

    await db.collection("recipes").doc(id).update({
      title: "Concurrent update",
    })

    await expectFunctionError(
      "failed-precondition",
      () => finalize(reservation, id, recipePayload())
    )

    const snapshot = await readRecipe(id)
    assert(
      snapshot.data()?.title === "Concurrent update",
      "Concurrent update was overwritten."
    )

    const usage = await readUsage(staleUser.uid, reservation.day)
    assert(
      (usage.counts?.editRecipe ?? 0) === 0,
      "Failed edit consumed daily allowance."
    )

    await login(user)
  })

  // 10. Expire a reservation.
  await test("10. Expired edit reservation is rejected", async () => {
    const expiredUser = await createUser("expired")
    await login(expiredUser)

    const id = await createRecipe(expiredUser.uid)
    const reservation = await begin(id)

    const expiredAt = Date.now() - 1000

    await db
      .collection("rateLimits")
      .doc(expiredUser.uid)
      .collection("days")
      .doc(reservation.day)
      .update({
        [`reservations.${reservation.requestId}.expiresAt`]: expiredAt,
      })

    await db
      .collection("recipeEditSessions")
      .doc(reservation.requestId)
      .update({
        expiresAt: expiredAt,
      })

    await expectFunctionError(
      "failed-precondition",
      () => finalize(reservation, id, recipePayload())
    )

    const usage = await readUsage(expiredUser.uid, reservation.day)
    assert(
      (usage.counts?.editRecipe ?? 0) === 0,
      "Expired edit consumed the counter."
    )

    await login(user)
  })

  // 11. Successful upload using the new edit session.
  await test("11. New main image can be uploaded and saved", async () => {
    const imageUser = await createUser("new-image")
    await login(imageUser)

    const id = await createRecipe(imageUser.uid)
    const reservation = await begin(id)
    const path = `${reservation.uploadPrefix}main/${randomUUID()}.png`

    await uploadBytes(
      ref(storage, path),
      pngBytes,
      { contentType: "image/png" }
    )

    await finalize(reservation, id, recipePayload(path))

    const data = (await readRecipe(id)).data()

    assert(data.imageFileName === path, "New image path was not saved.")
    assert(
      data.image === `gs://${BUCKET}/${path}`,
      "Unexpected Storage image reference."
    )

    await verifyCompleted(imageUser.uid, reservation, id)
    await login(user)
  })

  // 12. Unauthenticated finalize.
  await test("12. Unauthenticated finalize is rejected", async () => {
    await signOut(auth)

    await expectFunctionError(
      "unauthenticated",
      () =>
        finalizeRecipeEdit({
          recipeId: randomUUID(),
          requestId: randomUUID(),
          day: new Date().toISOString().slice(0, 10),
          recipe: recipePayload(),
        })
    )
  })

  console.log("\n=== RESULTS ===")
  console.log("Passed:", results.passed)
  console.log("Failed:", results.failed)

  if (results.failed > 0) {
    process.exitCode = 1
    console.error("FINALIZE RECIPE EDIT TESTS FAILED.")
  } else {
    console.log("ALL FINALIZE RECIPE EDIT TESTS PASSED.")
  }
}

try {
  await main()
} catch (error) {
  console.error("\nTEST RUNNER FAILED:", error)
  process.exitCode = 1
} finally {
  await signOut(auth).catch(() => {})
  await db.terminate()
  await adminApp.delete()
  await deleteApp(clientApp)
}