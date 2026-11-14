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

// All Admin SDK operations must target emulators.
const PROJECT_ID = "flavorfolio-eaecb"

process.env.GCLOUD_PROJECT = PROJECT_ID
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"

const requireFunctions = createRequire(
  resolve("functions/package.json")
)

const { initializeApp: initializeAdminApp } = requireFunctions("firebase-admin/app")

const { getAuth: getAdminAuth } = requireFunctions("firebase-admin/auth")

const { getFirestore } = requireFunctions("firebase-admin/firestore")

const adminApp = initializeAdminApp({
  projectId: PROJECT_ID,
})

const adminAuth = getAdminAuth(adminApp)
const db = getFirestore(adminApp)

const clientApp = initializeClientApp({
  apiKey: "demo-key",
  appId: "demo-app-begin-edit-tests",
  projectId: PROJECT_ID,
})

const auth = getAuth(clientApp)

connectAuthEmulator(
  auth,
  "http://127.0.0.1:9099",
  { disableWarnings: true }
)

const functions = getFunctions(
  clientApp,
  "europe-west1"
)

connectFunctionsEmulator(
  functions,
  "127.0.0.1",
  5001
)

const beginRecipeEdit = httpsCallable(
  functions,
  "beginRecipeEdit"
)

const password = "TestPassword123!"
const suffix = randomUUID().slice(0, 8)
const DAY_LIMIT = 4

const results = {
  passed: 0,
  failed: 0,
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function expectError(name, expectedCode, operation) {
  try {
    await operation()

    results.failed++
    console.error(`FAIL: ${name} - unexpectedly succeeded`)
  } catch (error) {
    if (error?.code === `functions/${expectedCode}`) {
      results.passed++
      console.log(`PASS: ${name} (${expectedCode})`)
    } else {
      results.failed++
      console.error(`FAIL: ${name}`)
      console.error(
        "Expected:",
        `functions/${expectedCode}`
      )
      console.error(
        "Received:",
        error?.code,
        error?.message
      )
    }
  }
}

async function expectSuccess(name, operation) {
  try {
    const result = await operation()

    results.passed++
    console.log(`PASS: ${name}`)

    return result
  } catch (error) {
    results.failed++
    console.error(`FAIL: ${name}`, error)
    throw error
  }
}

async function createTestUser(
  name,
  {
    profile = true,
    restricted = false,
  } = {}
) {
  const email =
    `${name}-${suffix}@flavorfolio.test`

  const user = await adminAuth.createUser({
    email,
    password,
  })

  if (profile) {
    await db.collection("users").doc(user.uid).set({
      username: name,
      admin: false,
      role: "member",
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

  await signInWithEmailAndPassword(
    auth,
    user.email,
    password
  )
}

async function createTestRecipe(
  ownerId,
  status = "published"
) {
  const recipeId = randomUUID()

  await db.collection("recipes").doc(recipeId).set({
    userId: ownerId,
    title: `Edit Test Recipe ${suffix}`,
    description: "Recipe used for edit reservation tests.",
    status,
    visibility: "public",
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return recipeId
}

async function main() {
  console.log("\n=== BEGIN RECIPE EDIT TESTS ===\n")

  // 1. Authentication.
  await expectError(
    "1. Unauthenticated user",
    "unauthenticated",
    () =>
      beginRecipeEdit({
        recipeId: randomUUID(),
        requestId: randomUUID(),
      })
  )

  // Create isolated test users.
  const missingProfileUser =
    await createTestUser("edit-no-profile", {
      profile: false,
    })

  const restrictedUser =
    await createTestUser("edit-restricted", {
      restricted: true,
    })

  const allowedUser =
    await createTestUser("edit-allowed")

  const otherUser =
    await createTestUser("edit-other")

  const ownedRecipeId =
    await createTestRecipe(allowedUser.uid)

  const secondOwnedRecipeId =
    await createTestRecipe(allowedUser.uid, "draft")

  const pendingRecipeId =
    await createTestRecipe(allowedUser.uid, "pending")

  const foreignRecipeId =
    await createTestRecipe(otherUser.uid)

  // 2. Missing user profile.
  await login(missingProfileUser)

  await expectError(
    "2. User profile missing",
    "permission-denied",
    () =>
      beginRecipeEdit({
        recipeId: ownedRecipeId,
        requestId: randomUUID(),
      })
  )

  // 3. Restricted user.
  await login(restrictedUser)

  await expectError(
    "3. User restricted from posting recipes",
    "permission-denied",
    () =>
      beginRecipeEdit({
        recipeId: ownedRecipeId,
        requestId: randomUUID(),
      })
  )

  // Remaining tests use the permitted user.
  await login(allowedUser)

  // 4. Missing recipe.
  await expectError(
    "4. Recipe does not exist",
    "not-found",
    () =>
      beginRecipeEdit({
        recipeId: randomUUID(),
        requestId: randomUUID(),
      })
  )

  // 5. Recipe belongs to another user.
  await expectError(
    "5. Cannot edit another user's recipe",
    "permission-denied",
    () =>
      beginRecipeEdit({
        recipeId: foreignRecipeId,
        requestId: randomUUID(),
      })
  )

  // 6. Pending recipes cannot be edited.
  await expectError(
    "6. Pending recipe cannot be edited",
    "failed-precondition",
    () =>
      beginRecipeEdit({
        recipeId: pendingRecipeId,
        requestId: randomUUID(),
      })
  )

  // 7. Invalid request ID.
  await expectError(
    "7. Invalid request ID",
    "invalid-argument",
    () =>
      beginRecipeEdit({
        recipeId: ownedRecipeId,
        requestId: "bad",
      })
  )

  // 8. First valid reservation.
  const firstRequestId = randomUUID()

  const firstResponse = await expectSuccess(
    "8. First edit reservation",
    () =>
      beginRecipeEdit({
        recipeId: ownedRecipeId,
        requestId: firstRequestId,
      })
  )

  const firstReservation = firstResponse.data

  assert(
    firstReservation.requestId === firstRequestId,
    "Unexpected request ID."
  )

  assert(
    firstReservation.recipeId === ownedRecipeId,
    "Unexpected recipe ID."
  )

  assert(
    firstReservation.limit === DAY_LIMIT,
    "Unexpected edit limit."
  )

  // Verify recipeVersion AFTER creating the session.
  const versionSessionSnapshot = await db
    .collection("recipeEditSessions")
    .doc(firstRequestId)
    .get()

  assert(
    versionSessionSnapshot.exists,
    "Edit session was not created."
  )

  const savedVersion =
    versionSessionSnapshot.data()?.recipeVersion

  assert(
    typeof savedVersion === "number" &&
      Number.isFinite(savedVersion),
    "Recipe version was not saved correctly."
  )

  const recipeSnapshot = await db
    .collection("recipes")
    .doc(ownedRecipeId)
    .get()

  const expectedVersion =
    recipeSnapshot.updateTime?.toMillis()

  assert(
    savedVersion === expectedVersion,
    "Saved recipeVersion does not match the recipe updateTime."
  )

  console.log(
    "PASS: Recipe version matches the original recipe."
  )

  // 9. Idempotent retry.
  const retryResponse = await expectSuccess(
    "9. Retry returns original reservation",
    () =>
      beginRecipeEdit({
        recipeId: ownedRecipeId,
        requestId: firstRequestId,
      })
  )

  assert(
    retryResponse.data.day === firstReservation.day &&
    retryResponse.data.expiresAt ===
      firstReservation.expiresAt &&
    retryResponse.data.remaining ===
      firstReservation.remaining,
    "Retry did not return the original reservation."
  )

  // 10. Same request ID, different recipe.
  await expectError(
    "10. Request ID cannot be reused for another recipe",
    "invalid-argument",
    () =>
      beginRecipeEdit({
        recipeId: secondOwnedRecipeId,
        requestId: firstRequestId,
      })
  )

  // 11. The second reservation is allowed.
  await expectSuccess(
    "11. Second edit reservation",
    () =>
      beginRecipeEdit({
        recipeId: secondOwnedRecipeId,
        requestId: randomUUID(),
      })
  )

  // 12. The third reservation is allowed.
  await expectSuccess(
    "12. Third edit reservation",
    () =>
      beginRecipeEdit({
        recipeId: ownedRecipeId,
        requestId: randomUUID(),
      })
  )

  // 13. The fourth reservation is allowed.
  await expectSuccess(
    "13. Fourth edit reservation",
    () =>
      beginRecipeEdit({
        recipeId: ownedRecipeId,
        requestId: randomUUID(),
      })
  )

  // 14. The fifth reservation must be rejected.
  await expectError(
    "14. Fifth edit reservation exceeds daily limit",
    "resource-exhausted",
    () =>
      beginRecipeEdit({
        recipeId: ownedRecipeId,
        requestId: randomUUID(),
      })
  )

  // 15. Verify the actual Firestore state.
  const dayRef = db
    .collection("rateLimits")
    .doc(allowedUser.uid)
    .collection("days")
    .doc(firstReservation.day)

  const daySnapshot = await dayRef.get()

  const rateLimitData = daySnapshot.data()

  const activeReservations = Object.entries(
    rateLimitData?.reservations || {}
  ).filter(([, reservation]) =>
    reservation.action === "editRecipe" &&
    reservation.expiresAt > Date.now()
  )

  const editCount =
    rateLimitData?.counts?.editRecipe ?? 0

  assert(
    activeReservations.length === DAY_LIMIT,
    `Expected ${DAY_LIMIT} active reservations, ` +
      `found ${activeReservations.length}.`
  )

  assert(
    editCount === 0,
    `Edit counter should be zero, found ${editCount}.`
  )

  const sessionSnapshot = await db
    .collection("recipeEditSessions")
    .doc(firstRequestId)
    .get()

  const session = sessionSnapshot.data()

  assert(
    sessionSnapshot.exists &&
    session.userId === allowedUser.uid &&
    session.recipeId === ownedRecipeId &&
    session.requestId === firstRequestId &&
    session.status === "active",
    "Edit session data is incorrect."
  )

  results.passed++
  console.log(
    "PASS: 15. Four active reservations, " +
    "zero completed edits, correct session."
  )

  console.log("\n=== RESULTS ===")
  console.log("Passed:", results.passed)
  console.log("Failed:", results.failed)

  if (results.failed > 0) {
    process.exitCode = 1
    console.error("BEGIN RECIPE EDIT TESTS FAILED.")
  } else {
    console.log("ALL BEGIN RECIPE EDIT TESTS PASSED.")
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