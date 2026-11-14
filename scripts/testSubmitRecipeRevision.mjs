
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
  getFirestore as getClientFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore"

// All Admin SDK operations MUST target emulators.
const PROJECT_ID = "flavorfolio-eaecb"
const DAILY_EDIT_LIMIT = 4

process.env.GCLOUD_PROJECT = PROJECT_ID
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"

const requireFunctions = createRequire(
  resolve("functions/package.json")
)

const { initializeApp: initializeAdminApp } =
  requireFunctions("firebase-admin/app")

const { getAuth: getAdminAuth } =
  requireFunctions("firebase-admin/auth")

const { getFirestore: getAdminFirestore } =
  requireFunctions("firebase-admin/firestore")

const adminApp = initializeAdminApp({
  projectId: PROJECT_ID,
})

const adminAuth = getAdminAuth(adminApp)
const adminDb = getAdminFirestore(adminApp)

const clientApp = initializeClientApp({
  apiKey: "demo-key",
  appId: `submit-revision-tests-${randomUUID()}`,
  projectId: PROJECT_ID,
})

const auth = getAuth(clientApp)

connectAuthEmulator(
  auth,
  "http://127.0.0.1:9099",
  { disableWarnings: true }
)

const functions = getFunctions(clientApp, "europe-west1")

connectFunctionsEmulator(
  functions,
  "127.0.0.1",
  5001
)

const clientDb = getClientFirestore(clientApp)

connectFirestoreEmulator(
  clientDb,
  "127.0.0.1",
  8080
)

const submitRecipeRevision = httpsCallable(
  functions,
  "submitRecipeRevision"
)

const suffix = randomUUID().slice(0, 8)
const password = "TestPassword123!"

const results = {
  passed: 0,
  failed: 0,
}

const warnings = []

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
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
      `Expected functions/${expectedCode}, got ` +
      `${error?.code}: ${error?.message}`
    )

    return
  }

  throw new Error(
    `Expected functions/${expectedCode}, but operation succeeded.`
  )
}

async function expectFirestoreDenied(operation) {
  try {
    await operation()
  } catch (error) {
    assert(
      error?.code === "permission-denied",
      `Expected permission-denied, got ` +
      `${error?.code}: ${error?.message}`
    )

    return
  }

  throw new Error(
    "Expected Firestore permission-denied, but operation succeeded."
  )
}

async function createUser(
  name,
  {
    admin = false,
    restricted = false,
  } = {}
) {
  const email = `${name}-${randomUUID().slice(0, 8)}-${suffix}@flavorfolio.test`

  const user = await adminAuth.createUser({
    email,
    password,
  })

  await adminDb.collection("users").doc(user.uid).set({
    username: name,
    role: admin ? "admin" : "member",
    admin,
    profileImage: "",
    restrictions: {
      canPostRecipes: !restricted,
    },
  })

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

async function createRecipe(
  userId,
  status = "draft"
) {
  const recipeId = randomUUID()

  await adminDb.collection("recipes").doc(recipeId).set({
    recipeId,
    userId,
    user: "TestCreator",

    author: {
      username: "TestCreator",
      profileImage: "",
    },

    title: `Revision Test Recipe ${suffix}`,
    description: "A recipe used for submission tests.",

    cuisine: "romanian",
    durationMinutes: 30,
    servings: 2,
    difficulty: "easy",
    meal: "lunch",
    visibility: "public",

    image: "https://example.invalid/test-image.png",
    imageFileName: "recipe_images/test-image.png",

    ingredients: [
      {
        ingredient: "Potatoes",
        quantity: "500",
        unit: "g",
      },
    ],

    cookingSteps: [
      {
        title: "Prepare",
        description: "Prepare the ingredients.",
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
      revisionFeedback:
        status === "needs_revision"
          ? "Please improve the description."
          : "",
      denialReason: "",
    },

    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return recipeId
}

async function submit(recipeId, requestId = randomUUID()) {
  const response = await submitRecipeRevision({
    recipeId,
    requestId,
  })

  return response.data
}

async function readRecipe(recipeId) {
  return adminDb
    .collection("recipes")
    .doc(recipeId)
    .get()
}

async function readSubmission(requestId) {
  return adminDb
    .collection("recipeRevisionSubmissions")
    .doc(requestId)
    .get()
}

async function readUsage(userId, day) {
  const snapshot = await adminDb
    .collection("rateLimits")
    .doc(userId)
    .collection("days")
    .doc(day)
    .get()

  return snapshot.data() || {}
}

async function readNotification(adminId, recipeId) {
  return adminDb
    .collection("users")
    .doc(adminId)
    .collection("notifications")
    .doc(`recipe_resubmitted_${recipeId}`)
    .get()
}

function activeReservations(usage) {
  return Object.entries(
    usage.reservations || {}
  ).filter(([, reservation]) =>
    reservation.action === "editRecipe" &&
    reservation.expiresAt > Date.now()
  )
}

async function verifyCompletedSubmission({
  userId,
  recipeId,
  requestId,
  expectedCount = 1,
}) {
  const submissionSnap = await readSubmission(requestId)

  assert(
    submissionSnap.exists,
    "Submission document was not created."
  )

  const submission = submissionSnap.data()

  assert(
    submission.userId === userId &&
    submission.recipeId === recipeId &&
    submission.requestId === requestId &&
    submission.action === "editRecipe" &&
    submission.status === "completed",
    "Submission data is incorrect."
  )

  const usage = await readUsage(
    userId,
    submission.day
  )

  assert(
    usage.counts?.editRecipe === expectedCount,
    `Expected ${expectedCount} completed operations, ` +
    `got ${usage.counts?.editRecipe ?? 0}.`
  )

  assert(
    usage.completed?.[requestId]?.action === "editRecipe",
    "Completed rate-limit entry is missing."
  )

  assert(
    !usage.reservations?.[requestId],
    "Completed request still has an active reservation."
  )

  const recipeSnap = await readRecipe(recipeId)

  assert(
    recipeSnap.data()?.status === "pending",
    "Recipe was not moved to pending."
  )

  return {
    submission,
    usage,
    recipeSnap,
  }
}

async function verifyNotification(
  adminId,
  recipeId,
  ownerId
) {
  const snapshot = await readNotification(
    adminId,
    recipeId
  )

  assert(
    snapshot.exists,
    `Notification missing for administrator ${adminId}.`
  )

  const data = snapshot.data()

  assert(
    data.type === "recipe_resubmitted",
    "Incorrect notification type."
  )

  assert(
    data.recipientUserId === adminId,
    "Incorrect notification recipient."
  )

  assert(
    data.actorUserId === ownerId,
    "Incorrect notification actor."
  )

  assert(
    data.recipeId === recipeId,
    "Incorrect notification recipe ID."
  )

  assert(
    data.title === "Recipe resubmitted",
    "Incorrect notification title."
  )

  assert(
    data.read === false,
    "Notification should be unread."
  )

  assert(
    data.createdAt != null,
    "Notification timestamp is missing."
  )

  return snapshot
}

async function verifyNoCompletedAction(
  userId,
  requestId
) {
  const submissionSnap = await readSubmission(requestId)

  if (!submissionSnap.exists) {
    return
  }

  const submission = submissionSnap.data()
  const usage = await readUsage(
    userId,
    submission.day
  )

  assert(
    !usage.completed?.[requestId],
    "Rejected request was marked completed."
  )

  assert(
    (usage.counts?.editRecipe ?? 0) === 0,
    "Rejected request increased daily usage."
  )
}

async function main() {
  console.log("\n=== SUBMIT RECIPE REVISION TESTS ===\n")

  // Create two administrators for notification tests.
  const adminOne = await createUser("revision-admin-one", {
    admin: true,
  })

  const adminTwo = await createUser("revision-admin-two", {
    admin: true,
  })

  const owner = await createUser("revision-owner")
  const otherUser = await createUser("revision-other")

  let firstRecipeId
  let firstRequestId
  let firstSubmission
  let firstNotificationOne
  let firstNotificationTwo

  // ====================================================
  // 1. UNAUTHENTICATED
  // ====================================================

  await test("1. Unauthenticated submission is rejected", async () => {
    await signOut(auth)

    await expectFunctionError(
      "unauthenticated",
      () => submit(randomUUID())
    )
  })

  await login(owner)

  // ====================================================
  // 2. DRAFT -> PENDING
  // ====================================================

  await test("2. Draft becomes pending and consumes one operation", async () => {
    firstRecipeId = await createRecipe(owner.uid, "draft")
    firstRequestId = randomUUID()

    const result = await submit(
      firstRecipeId,
      firstRequestId
    )

    assert(
      result.recipeId === firstRecipeId,
      "Unexpected recipe ID."
    )

    assert(
      result.status === "pending",
      "Unexpected response status."
    )

    assert(
      result.alreadyCompleted === false,
      "First submission was incorrectly treated as retry."
    )

    firstSubmission = await verifyCompletedSubmission({
      userId: owner.uid,
      recipeId: firstRecipeId,
      requestId: firstRequestId,
    })

    const recipe = firstSubmission.recipeSnap.data()

    assert(
      recipe.moderation?.submittedAt != null,
      "Moderation submittedAt was not set."
    )

    assert(
      recipe.moderation?.reviewedAt === null &&
      recipe.moderation?.reviewedBy === null,
      "Moderation review fields were not reset."
    )
  })

  // ====================================================
  // 3. NEEDS_REVISION -> PENDING
  // ====================================================

  await test("3. Needs revision becomes pending", async () => {
    const revisionUser = await createUser("revision-feedback")
    await login(revisionUser)

    const recipeId = await createRecipe(
      revisionUser.uid,
      "needs_revision"
    )

    const requestId = randomUUID()
    const result = await submit(recipeId, requestId)

    assert(
      result.status === "pending",
      "Recipe was not submitted."
    )

    await verifyCompletedSubmission({
      userId: revisionUser.uid,
      recipeId,
      requestId,
    })

    const recipe = (await readRecipe(recipeId)).data()

    assert(
      recipe.moderation?.revisionFeedback ===
        "Please improve the description.",
      "Revision feedback was unexpectedly erased."
    )

    await login(owner)
  })

  // ====================================================
  // 4. TWO ADMINISTRATOR NOTIFICATIONS
  // ====================================================

  await test("4. Both administrators receive notifications", async () => {
    assert(
      firstRecipeId && firstRequestId,
      "First successful submission is missing."
    )

    firstNotificationOne = await verifyNotification(
      adminOne.uid,
      firstRecipeId,
      owner.uid
    )

    firstNotificationTwo = await verifyNotification(
      adminTwo.uid,
      firstRecipeId,
      owner.uid
    )
  })

  // ====================================================
  // 5. IDEMPOTENT RETRY
  // ====================================================

  await test("5. Retry does not consume quota or duplicate notifications", async () => {
    const beforeRecipe = await readRecipe(firstRecipeId)
    const beforeSubmission = await readSubmission(firstRequestId)

    const beforeNotificationOne = await readNotification(
      adminOne.uid,
      firstRecipeId
    )

    const beforeNotificationTwo = await readNotification(
      adminTwo.uid,
      firstRecipeId
    )

    const beforeUsage = await readUsage(
      owner.uid,
      firstSubmission.submission.day
    )

    const result = await submit(
      firstRecipeId,
      firstRequestId
    )

    assert(
      result.alreadyCompleted === true,
      "Retry was not detected."
    )

    const afterRecipe = await readRecipe(firstRecipeId)
    const afterSubmission = await readSubmission(firstRequestId)

    const afterNotificationOne = await readNotification(
      adminOne.uid,
      firstRecipeId
    )

    const afterNotificationTwo = await readNotification(
      adminTwo.uid,
      firstRecipeId
    )

    const afterUsage = await readUsage(
      owner.uid,
      firstSubmission.submission.day
    )

    assert(
      beforeRecipe.updateTime.isEqual(afterRecipe.updateTime),
      "Retry modified the recipe."
    )

    assert(
      beforeSubmission.updateTime.isEqual(afterSubmission.updateTime),
      "Retry modified the submission."
    )

    assert(
      beforeNotificationOne.updateTime.isEqual(
        afterNotificationOne.updateTime
      ),
      "Retry rewrote the first notification."
    )

    assert(
      beforeNotificationTwo.updateTime.isEqual(
        afterNotificationTwo.updateTime
      ),
      "Retry rewrote the second notification."
    )

    assert(
      beforeUsage.counts.editRecipe ===
        afterUsage.counts.editRecipe,
      "Retry increased the counter."
    )
  })

  // ====================================================
  // 6. SAME REQUEST ID, DIFFERENT RECIPE
  // ====================================================

  await test("6. Request ID cannot be reused for another recipe", async () => {
    const anotherRecipeId = await createRecipe(owner.uid)

    await expectFunctionError(
      "invalid-argument",
      () => submit(anotherRecipeId, firstRequestId)
    )

    assert(
      (await readRecipe(anotherRecipeId)).data()?.status === "draft",
      "Second recipe was unexpectedly submitted."
    )
  })

  // ====================================================
  // 7. FOREIGN RECIPE
  // ====================================================

  await test("7. Cannot submit another user's recipe", async () => {
    const foreignRecipeId = await createRecipe(otherUser.uid)

    await expectFunctionError(
      "permission-denied",
      () => submit(foreignRecipeId)
    )

    assert(
      (await readRecipe(foreignRecipeId)).data()?.status === "draft",
      "Foreign recipe status changed."
    )
  })

  // ====================================================
  // 8. PUBLISHED STATUS
  // ====================================================

  await test("8. Published recipe cannot be resubmitted", async () => {
    const recipeId = await createRecipe(owner.uid, "published")

    await expectFunctionError(
      "failed-precondition",
      () => submit(recipeId)
    )

    assert(
      (await readRecipe(recipeId)).data()?.status === "published",
      "Published recipe status changed."
    )
  })

  // ====================================================
  // 9. PENDING STATUS
  // ====================================================

  await test("9. Pending recipe cannot be resubmitted", async () => {
    const recipeId = await createRecipe(owner.uid, "pending")

    await expectFunctionError(
      "failed-precondition",
      () => submit(recipeId)
    )
  })

  // ====================================================
  // 10. RESTRICTED USER
  // ====================================================

  await test("10. Restricted user cannot submit", async () => {
    const restricted = await createUser(
      "revision-restricted",
      { restricted: true }
    )

    await login(restricted)

    const recipeId = await createRecipe(restricted.uid)

    await expectFunctionError(
      "permission-denied",
      () => submit(recipeId)
    )

    assert(
      (await readRecipe(recipeId)).data()?.status === "draft",
      "Restricted user changed recipe status."
    )

    await login(owner)
  })

  // ====================================================
  // 11. DAILY LIMIT: 4 ALLOWED, 5TH DENIED
  // ====================================================

  await test("11. Fifth daily operation is blocked", async () => {
    const quotaUser = await createUser("revision-quota")

    await login(quotaUser)

    let lastDay

    for (let i = 1; i <= DAILY_EDIT_LIMIT; i++) {
      const recipeId = await createRecipe(quotaUser.uid)
      const requestId = randomUUID()

      const result = await submit(recipeId, requestId)

      assert(
        result.alreadyCompleted === false,
        `Operation ${i} was not completed.`
      )

      const submissionSnapshot = await readSubmission(requestId)
      lastDay = submissionSnapshot.data()?.day

      const usage = await readUsage(quotaUser.uid, lastDay)

      assert(
        usage.counts?.editRecipe === i,
        `Expected ${i} operations, ` +
        `got ${usage.counts?.editRecipe ?? 0}.`
      )
    }

    const fifthRecipeId = await createRecipe(quotaUser.uid)

    await expectFunctionError(
      "resource-exhausted",
      () => submit(fifthRecipeId)
    )

    const finalUsage = await readUsage(quotaUser.uid, lastDay)

    assert(
      finalUsage.counts?.editRecipe === DAILY_EDIT_LIMIT,
      "Fifth attempt changed the counter."
    )

    assert(
      (await readRecipe(fifthRecipeId)).data()?.status === "draft",
      "Fifth recipe was unexpectedly submitted."
    )

    await login(owner)
  })

  // ====================================================
  // 12. CONCURRENT SUBMISSIONS
  // ====================================================

  await test("12. Concurrent submissions produce one successful transition", async () => {
    const concurrentUser = await createUser(
      "revision-concurrent"
    )

    await login(concurrentUser)

    const recipeId = await createRecipe(concurrentUser.uid)

    const requestA = randomUUID()
    const requestB = randomUUID()

    const outcomes = await Promise.allSettled([
      submit(recipeId, requestA),
      submit(recipeId, requestB),
    ])

    const successes = outcomes.filter(
      (result) => result.status === "fulfilled"
    )

    const failures = outcomes.filter(
      (result) => result.status === "rejected"
    )

    assert(
      successes.length === 1,
      `Expected one success, got ${successes.length}.`
    )

    assert(
      failures.length === 1,
      `Expected one rejected submission, got ${failures.length}.`
    )

    const rejectedCode = failures[0].reason?.code

    assert(
      rejectedCode === "functions/failed-precondition",
      `Unexpected concurrent rejection: ${rejectedCode}.`
    )

    const recipe = await readRecipe(recipeId)

    assert(
      recipe.data()?.status === "pending",
      "Recipe did not become pending."
    )

    const submissionA = await readSubmission(requestA)
    const submissionB = await readSubmission(requestB)

    const documents = [submissionA, submissionB]
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => snapshot.data())

    const completed = documents.filter(
      (submission) => submission.status === "completed"
    )

    assert(
      completed.length === 1,
      `Expected one completed submission, got ${completed.length}.`
    )

    const day = completed[0].day
    const usage = await readUsage(concurrentUser.uid, day)

    assert(
      usage.counts?.editRecipe === 1,
      "Concurrent submissions consumed more than one operation."
    )

    const active = activeReservations(usage)

    if (active.length > 0) {
      const message =
        `Concurrent rejection left ${active.length} active ` +
        `reservation(s). Cleanup is still required.`

      warnings.push(message)
      console.warn(`WARNING: ${message}`)
    }

    await verifyNotification(
      adminOne.uid,
      recipeId,
      concurrentUser.uid
    )

    await verifyNotification(
      adminTwo.uid,
      recipeId,
      concurrentUser.uid
    )

    await login(owner)
  })

  // ====================================================
  // 13. CLIENT CANNOT CREATE SUBMISSION RECORD
  // ====================================================

  await test("13. Cannot directly create submission record", async () => {
    const fakeRequestId = randomUUID()

    await expectFirestoreDenied(() =>
      setDoc(
        doc(
          clientDb,
          "recipeRevisionSubmissions",
          fakeRequestId
        ),
        {
          userId: owner.uid,
          recipeId: firstRecipeId,
          requestId: fakeRequestId,
          action: "editRecipe",
          day: new Date().toISOString().slice(0, 10),
          status: "completed",
        }
      )
    )
  })

  // ====================================================
  // 14. CLIENT CANNOT MODIFY SUBMISSION RECORD
  // ====================================================

  await test("14. Cannot directly modify submission record", async () => {
    await expectFirestoreDenied(() =>
      updateDoc(
        doc(
          clientDb,
          "recipeRevisionSubmissions",
          firstRequestId
        ),
        {
          status: "reserved",
        }
      )
    )

    assert(
      (await readSubmission(firstRequestId)).data()?.status === "completed",
      "Submission was unexpectedly modified."
    )
  })

  // ====================================================
  // 15. CLIENT CANNOT READ SUBMISSION RECORD
  // ====================================================

  await test("15. Cannot directly read submission record", async () => {
    await expectFirestoreDenied(() =>
      getDoc(
        doc(
          clientDb,
          "recipeRevisionSubmissions",
          firstRequestId
        )
      )
    )
  })

  // ====================================================
  // 16. EDIT SESSION REQUEST ID CANNOT BE REUSED
  // ====================================================

  await test("16. Edit session request ID cannot be reused", async () => {
    const recipeId = await createRecipe(owner.uid)
    const requestId = randomUUID()

    // A separate edit session already owns this ID.
    // Admin SDK is used only for isolated test seeding.
    await adminDb
      .collection("recipeEditSessions")
      .doc(requestId)
      .set({
        userId: owner.uid,
        recipeId,
        requestId,
        action: "editRecipe",
        day: new Date().toISOString().slice(0, 10),
        uploadPrefix:
          `recipe_edit_uploads/${owner.uid}/${requestId}/`,
        status: "active",
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
        completedAt: null,
        cancelledAt: null,
        recipeVersion: 1,
      })

    await expectFunctionError(
      "invalid-argument",
      () => submit(recipeId, requestId)
    )

    assert(
      (await readRecipe(recipeId)).data()?.status === "draft",
      "Recipe was submitted using a reserved edit session ID."
    )
  })

  console.log("\n=== RESULTS ===")
  console.log("Passed:", results.passed)
  console.log("Failed:", results.failed)
  console.log("Warnings:", warnings.length)

  if (warnings.length > 0) {
    console.log("\n=== WARNINGS ===")

    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }
  }

  if (results.failed > 0) {
    process.exitCode = 1
    console.error("\nSUBMIT RECIPE REVISION TESTS FAILED.")
  } else {
    console.log("\nALL SUBMIT RECIPE REVISION TESTS PASSED.")
  }
}

try {
  await main()
} catch (error) {
  console.error("\nTEST RUNNER FAILED:", error)
  process.exitCode = 1
} finally {
  await signOut(auth).catch(() => {})
  await adminDb.terminate()
  await adminApp.delete()
  await deleteApp(clientApp)
}
