
import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"

import {
  assertSucceeds,
  assertFails,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing"

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore"

const PROJECT_ID = "flavorfolio-eaecb"

const results = {
  passed: 0,
  failed: 0,
}

const testEnvironment = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: {
    host: "127.0.0.1",
    port: 8080,
    rules: readFileSync("firestore.rules", "utf8"),
  },
})

const suffix = randomUUID().slice(0, 8)
const userId = `rules-user-${suffix}`
const otherUserId = `rules-other-${suffix}`
const requestId = randomUUID()

const userContext = testEnvironment.authenticatedContext(userId)
const otherContext = testEnvironment.authenticatedContext(otherUserId)
const guestContext = testEnvironment.unauthenticatedContext()

const userDb = userContext.firestore()
const otherDb = otherContext.firestore()
const adminUserId = `rules-admin-${suffix}`
const adminDb = testEnvironment.authenticatedContext(adminUserId).firestore()
const guestDb = guestContext.firestore()

const recipeId = `rules-recipe-${suffix}`
const day = new Date().toISOString().slice(0, 10)

async function expectDenied(name, operation) {
  try {
    await assertFails(operation())

    results.passed++
    console.log(`PASS: ${name}`)
  } catch (error) {
    results.failed++
    console.error(`FAIL: ${name}`, error)
  }
}

async function expectAllowed(name, operation) {
  try {
    await assertSucceeds(operation())
    results.passed++
    console.log(`PASS: ${name}`)
  } catch (error) {
    results.failed++
    console.error(`FAIL: ${name}`, error)
  }
}

async function seedTestData() {
  await testEnvironment.withSecurityRulesDisabled(
    async (context) => {
      const adminDb = context.firestore()

      await setDoc(
        doc(adminDb, "recipes", `rules-draft-${suffix}`),
        {
          userId,
          title: "Draft Recipe",
          status: "draft",
          visibility: "private",
        }
      )

      await setDoc(
        doc(adminDb, "users", userId, "savedRecipes", recipeId),
        {
          recipeId,
          userId,
          savedAt: serverTimestamp(),
        }
      )

      await setDoc(
        doc(adminDb, "recipes", recipeId, "ratings", otherUserId),
        {
          userId: otherUserId,
          value: 4,
          createdAt: serverTimestamp(),
        }
      )

      await setDoc(
        doc(
          adminDb,
          "users",
          adminUserId,
          "notifications",
          `recipe_resubmitted_${recipeId}`
        ),
        {
          type: "recipe_resubmitted",
          recipientUserId: adminUserId,
          actorUserId: userId,
          recipeId,
          recipeTitle: "Protected Recipe",
          message: "Recipe resubmitted for review.",
          read: false,
          createdAt: serverTimestamp(),
        }
      )

      await setDoc(doc(adminDb, "users", userId), {
        username: "RulesTestUser",
        admin: false,
        restrictions: {
          canPostRecipes: true,
        },
      })

      await setDoc(doc(adminDb, "users", otherUserId), {
        username: "OtherRulesTestUser",
        admin: false,
      })

      await setDoc(doc(adminDb, "users", `rules-admin-${suffix}`), {
        username: "RulesTestAdmin",
        admin: true,
        role: "admin",
      })

      await setDoc(doc(adminDb, "recipes", recipeId), {
        userId,
        title: "Protected Recipe",
        status: "pending",
        visibility: "public",
        stats: {
          likesCount: 0,
          commentsCount: 0,
          savesCount: 0,
          ratingsCount: 0,
          averageRating: 0,
        },
      })

      await setDoc(
        doc(adminDb, "rateLimits", userId, "days", day),
        {
          counts: { createRecipe: 1 },
          reservations: {},
          completed: {},
        }
      )

      await setDoc(
        doc(adminDb, "recipeUploadSessions", requestId),
        {
          userId,
          requestId,
          status: "active",
          expiresAt: Date.now() + 900000,
        }
      )

      await setDoc(
        doc(adminDb, "recipeImageCleanupJobs", requestId),
        {
          recipeId,
          userId,
          status: "pending",
          imagePath: "recipe_images/test.jpg",
        }
      )
    }
  )
}

try {
  console.log("\n=== FIRESTORE ANTI-BYPASS TESTS ===\n")

  await seedTestData()

  await expectDenied(
    "1. Direct recipe creation by authenticated user",
    () =>
      setDoc(doc(userDb, "recipes", randomUUID()), {
        userId,
        title: "Bypass attempt",
        status: "pending",
      })
  )

  await expectDenied(
    "2. Direct recipe creation by unauthenticated user",
    () =>
      setDoc(doc(guestDb, "recipes", randomUUID()), {
        title: "Unauthenticated attempt",
        status: "pending",
      })
  )

  await expectDenied(
    "3. Modify daily rate-limit counter",
    () =>
      updateDoc(
        doc(userDb, "rateLimits", userId, "days", day),
        { "counts.createRecipe": 0 }
      )
  )

  await expectDenied(
    "4. Read own rate-limit document",
    () =>
      getDoc(doc(userDb, "rateLimits", userId, "days", day))
  )

  await expectDenied(
    "5. Read another user's rate-limit document",
    () =>
      getDoc(doc(otherDb, "rateLimits", userId, "days", day))
  )

  await expectDenied(
    "6. Modify upload session",
    () =>
      updateDoc(
        doc(userDb, "recipeUploadSessions", requestId),
        { status: "completed" }
      )
  )

  await expectDenied(
    "7. Create fake upload session",
    () =>
      setDoc(
        doc(userDb, "recipeUploadSessions", randomUUID()),
        {
          userId,
          status: "active",
          expiresAt: Date.now() + 900000,
        }
      )
  )

  await expectDenied(
    "8. Read upload session",
    () =>
      getDoc(doc(userDb, "recipeUploadSessions", requestId))
  )

  await expectDenied(
    "9. Create cleanup job",
    () =>
      setDoc(
        doc(userDb, "recipeImageCleanupJobs", randomUUID()),
        {
          recipeId,
          userId,
          status: "pending",
          imagePath: "recipe_images/test.jpg",
        }
      )
  )

  await expectDenied(
    "10. Modify cleanup job",
    () =>
      updateDoc(
        doc(userDb, "recipeImageCleanupJobs", requestId),
        { status: "completed" }
      )
  )

  await expectDenied(
    "11. Read cleanup job",
    () =>
      getDoc(doc(userDb, "recipeImageCleanupJobs", requestId))
  )

  await expectDenied(
      "12. Unauthorized recipe stats modification",
      () =>
          updateDoc(doc(otherDb, "recipes", recipeId), {
          "stats.savesCount": 999999,
      })
  )

  await expectDenied(
    "13. Recipe owner cannot manipulate stats",
    () =>
      updateDoc(doc(userDb, "recipes", recipeId), {
        "stats.savesCount": 999999,
      })
  )

  await expectDenied(
    "14. Recipe owner cannot update description directly",
    () =>
      updateDoc(doc(userDb, "recipes", recipeId), {
        description: "Bypass attempt",
      })
  )

  await expectAllowed(
    "15. Admin can moderate recipe",
    () =>
      updateDoc(doc(adminDb, "recipes", recipeId), {
        status: "published",
      })
  )

  await expectDenied(
    "16. Cannot create recipe edit session",
    () =>
      setDoc(
        doc(userDb, "recipeEditSessions", randomUUID()),
        {
          userId,
          recipeId,
          action: "editRecipe",
          status: "active",
        }
      )
  )

  await expectDenied(
    "17. Cannot read recipe edit session",
    () =>
      getDoc(
        doc(userDb, "recipeEditSessions", requestId)
      )
  )

  await expectAllowed(
    "18. Owner can change visibility to private",
    () =>
      updateDoc(doc(userDb, "recipes", recipeId), {
        visibility: "private",
        updatedAt: serverTimestamp(),
      })
  )

  await expectAllowed(
    "19. Owner can change visibility back to public",
    () =>
      updateDoc(doc(userDb, "recipes", recipeId), {
        visibility: "public",
        updatedAt: serverTimestamp(),
      })
  )

  await expectDenied(
    "20. Another user cannot change visibility",
    () =>
      updateDoc(doc(otherDb, "recipes", recipeId), {
        visibility: "private",
        updatedAt: serverTimestamp(),
      })
  )

  await expectDenied(
    "21. Owner cannot modify title directly",
    () =>
      updateDoc(doc(userDb, "recipes", recipeId), {
        title: "Bypassed daily limit",
      })
  )

  await expectDenied(
    "22. Owner cannot modify ingredients directly",
    () =>
      updateDoc(doc(userDb, "recipes", recipeId), {
        ingredients: [
          {
            ingredient: "Salt",
            quantity: "999",
            unit: "g",
          },
        ],
      })
  )

  await expectDenied(
    "23. Owner cannot replace image directly",
    () =>
      updateDoc(doc(userDb, "recipes", recipeId), {
        image: "gs://fake-bucket/bypass.png",
        imageFileName: "bypass.png",
      })
  )

  await expectDenied(
    "24. Owner cannot submit recipe directly",
    () =>
      updateDoc(doc(userDb, "recipes", recipeId), {
        status: "pending",
        updatedAt: serverTimestamp(),
      })
  )

  await expectDenied(
    "25. Owner cannot modify moderation fields",
    () =>
      updateDoc(doc(userDb, "recipes", recipeId), {
        "moderation.reviewedBy": userId,
        "moderation.reviewedAt": serverTimestamp(),
      })
  )

  await expectDenied(
    "26. Visibility cannot be combined with title edit",
    () =>
      updateDoc(doc(userDb, "recipes", recipeId), {
        visibility: "private",
        title: "Hidden bypass",
        updatedAt: serverTimestamp(),
      })
  )

  await expectDenied(
    "27. Owner cannot modify author identity directly",
    () =>
      updateDoc(doc(userDb, "recipes", recipeId), {
        user: "Fake Administrator",
        "author.username": "Fake Administrator",
        updatedAt: serverTimestamp(),
      })
  )

  await expectDenied(
    "28. Owner cannot change updatedAt alone",
    () =>
      updateDoc(doc(userDb, "recipes", recipeId), {
        updatedAt: serverTimestamp(),
      })
  )

  await expectDenied(
    "29. Draft cannot be submitted directly",
    () =>
      updateDoc(
        doc(userDb, "recipes", `rules-draft-${suffix}`),
        {
          status: "pending",
          updatedAt: serverTimestamp(),
        }
      )
  )

  await expectDenied(
    "30. User cannot forge recipe pending notification",
    () =>
      setDoc(
        doc(
          userDb,
          "users",
          adminUserId,
          "notifications",
          `fake_pending_${suffix}`
        ),
        {
          type: "recipe_pending",
          recipientUserId: adminUserId,
          actorUserId: userId,
          recipeId,
          message: "Fake recipe awaiting review",
          read: false,
          createdAt: serverTimestamp(),
        }
      )
  )

  await expectDenied(
    "31. User cannot forge recipe resubmission",
    () =>
      setDoc(
        doc(
          userDb,
          "users",
          adminUserId,
          "notifications",
          `fake_resubmitted_${suffix}`
        ),
        {
          type: "recipe_resubmitted",
          recipientUserId: adminUserId,
          actorUserId: userId,
          recipeId,
          message: "Fake resubmission",
          read: false,
          createdAt: serverTimestamp(),
        }
      )
  )

  await expectDenied(
    "32. User cannot forge recipe approval",
    () =>
      setDoc(
        doc(
          userDb,
          "users",
          otherUserId,
          "notifications",
          `fake_approval_${suffix}`
        ),
        {
          type: "recipe_approved",
          recipientUserId: otherUserId,
          actorUserId: userId,
          recipeId,
          message: "Your recipe was approved",
          read: false,
          createdAt: serverTimestamp(),
        }
      )
  )

  await expectDenied(
    "33. User cannot forge account restriction",
    () =>
      setDoc(
        doc(
          userDb,
          "users",
          otherUserId,
          "notifications",
          `fake_restriction_${suffix}`
        ),
        {
          type: "account_restriction",
          recipientUserId: otherUserId,
          actorUserId: userId,
          message: "Your account has been restricted",
          read: false,
          createdAt: serverTimestamp(),
        }
      )
  )

  await expectAllowed(
    "34. User can create legitimate follow notification",
    () =>
      setDoc(
        doc(
          userDb,
          "users",
          otherUserId,
          "notifications",
          `follow_${userId}`
        ),
        {
          type: "user_followed",
          recipientUserId: otherUserId,
          actorUserId: userId,
          actorUsername: "RulesTestUser",
          actorProfileImage: "",
          title: "New follower",
          message: "RulesTestUser started following you.",
          read: false,
          createdAt: serverTimestamp(),
        }
      )
  )

  await expectDenied(
    "35. User cannot refresh moderation notification",
    () =>
      updateDoc(
        doc(
          userDb,
          "users",
          adminUserId,
          "notifications",
          `recipe_resubmitted_${recipeId}`
        ),
        {
          message: "Forged notification update",
          createdAt: serverTimestamp(),
        }
      )
  )

  await expectAllowed(
    "36. Recipient can mark notification as read",
    () =>
      updateDoc(
        doc(
          otherDb,
          "users",
          otherUserId,
          "notifications",
          `follow_${userId}`
        ),
        {
          read: true,
          readAt: serverTimestamp(),
        }
      )
  )

  await expectDenied(
    "37. User cannot save recipe directly",
    () =>
      setDoc(
        doc(userDb, "users", userId, "savedRecipes", `new-${recipeId}`),
        {
          recipeId: `new-${recipeId}`,
          userId,
          savedAt: serverTimestamp(),
        }
      )
  )

  await expectDenied(
    "38. User cannot delete saved recipe directly",
    () =>
      deleteDoc(
        doc(userDb, "users", userId, "savedRecipes", recipeId)
      )
  )

  await expectDenied(
    "39. Cannot create rating directly",
    () =>
      setDoc(
        doc(userDb, "recipes", recipeId, "ratings", userId),
        {
          userId,
          value: 5,
          createdAt: serverTimestamp(),
        }
      )
  )

  await expectDenied(
    "40. Cannot update rating directly",
    () =>
      updateDoc(
        doc(userDb, "recipes", recipeId, "ratings", otherUserId),
        { value: 1 }
      )
  )

  await expectDenied(
    "41. Cannot delete rating directly",
    () =>
      deleteDoc(
        doc(userDb, "recipes", recipeId, "ratings", otherUserId)
      )
  )

  await expectDenied(
    "42. User cannot create comment directly",
    () =>
      setDoc(
        doc(
          userDb,
          "recipes",
          recipeId,
          "comments",
          `rules-comment-${suffix}`
        ),
        {
          userId,
          username: "RulesTestUser",
          comment: "Attempt to bypass Cloud Functions",
          parentCommentId: null,
          repliesCount: 0,
          likesCount: 0,
          dislikesCount: 0,
          edited: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      )
  )

  await expectDenied(
    "43. User cannot create reply directly",
    () =>
      setDoc(
        doc(
          userDb,
          "recipes",
          recipeId,
          "comments",
          `rules-reply-${suffix}`
        ),
        {
          userId,
          username: "RulesTestUser",
          comment: "Attempt to create reply directly",
          parentCommentId: `rules-parent-${suffix}`,
          replyToCommentId: `rules-parent-${suffix}`,
          repliesCount: 0,
          likesCount: 0,
          dislikesCount: 0,
          edited: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      )
  )

  console.log("\n=== RESULTS ===")
  console.log("Passed:", results.passed)
  console.log("Failed:", results.failed)

  if (results.failed > 0) {
    process.exitCode = 1
    console.error("FIRESTORE ANTI-BYPASS TESTS FAILED.")
  } else {
    console.log("ALL FIRESTORE ANTI-BYPASS TESTS PASSED.")
  }
} finally {
  await testEnvironment.cleanup()
}
