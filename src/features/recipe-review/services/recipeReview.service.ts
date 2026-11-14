import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from "@firebase/firestore";
import { ReviewRecipe } from "../types/recipeReview.types";
import { db } from "../../../firebase-config";
import { ReviewSectionFeedback } from "../components/RecipeReviewSectionHeader";
import { getAuth } from "firebase/auth";
import { resolveStorageImage } from "../../../utils/resolveStorageItems";

export type ReviewSectionKey =
  | "image"
  | "metadata"
  | "description"
  | "ingredients"
  | "steps"

export async function approveRecipes(recipeIds: string[]) {
  const batch = writeBatch(db)
  const admin = await getCurrentAdminMeta()

  const recipeSnaps = await Promise.all(
    recipeIds.map((recipeId) => getDoc(doc(db, "recipes", recipeId)))
  )

  recipeSnaps.forEach((recipeSnap) => {
    if (!recipeSnap.exists()) return

    const recipeId = recipeSnap.id
    const recipeData = recipeSnap.data()
    const recipeTitle = recipeData.title || "your recipe"
    const recipeOwnerId = getRecipeOwnerId(recipeData)

    const recipeRef = doc(db, "recipes", recipeId)

    batch.update(recipeRef, {
      status: "published",
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const activityRef = doc(collection(db, "adminModerationActivity"))

    batch.set(activityRef, {
      type: "approved",
      recipeId,
      recipeTitle,
      recipeOwnerId,
      adminUserId: admin.adminUserId,
      adminUsername: admin.adminUsername,
      createdAt: serverTimestamp(),
    })

    if (recipeOwnerId) {
      const notificationRef = doc(db, "users", recipeOwnerId, "notifications", getModerationNotificationId(recipeId, "approved"))

      batch.set(notificationRef, {
        type: "recipe_approved",
        recipientUserId: recipeOwnerId,
        actorUserId: admin.adminUserId,
        actorUsername: admin.adminUsername,
        actorProfileImage: admin.adminProfileImage,
        recipeId,
        recipeTitle,
        message: `Your recipe "${recipeTitle}" was approved and is now published.`,
        read: false,
        readAt: null,
        createdAt: serverTimestamp(),
      }, {merge: true})
    }
  })

  await batch.commit()
}

export async function denyRecipes({
  recipeIds,
  reason,
  message,
}: {
  recipeIds: string[]
  reason: string
  message: string
}) {
  const batch = writeBatch(db)
  const admin = await getCurrentAdminMeta()

  const recipeSnaps = await Promise.all(
    recipeIds.map((recipeId) => getDoc(doc(db, "recipes", recipeId)))
  )

  recipeSnaps.forEach((recipeSnap) => {
    if (!recipeSnap.exists()) return

    const recipeId = recipeSnap.id
    const recipeData = recipeSnap.data()
    const recipeTitle = recipeData.title || "your recipe"
    const recipeOwnerId = getRecipeOwnerId(recipeData)

    const recipeRef = doc(db, "recipes", recipeId)

    batch.update(recipeRef, {
      status: "needs_revision",
      denialFeedback: {
        reason,
        message: message.trim(),
        createdAt: serverTimestamp(),
      },
      deniedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const activityRef = doc(collection(db, "adminModerationActivity"))

    batch.set(activityRef, {
      type: "needs_revision",
      recipeId,
      recipeTitle,
      recipeOwnerId,
      reason,
      message: message.trim(),
      adminUserId: admin.adminUserId,
      adminUsername: admin.adminUsername,
      createdAt: serverTimestamp(),
    })

    if (recipeOwnerId) {
      const notificationRef = doc(db, "users", recipeOwnerId, "notifications", getModerationNotificationId(recipeId, "needs_revision"))

      batch.set(notificationRef, {
        type: "needs_revision",
        recipientUserId: recipeOwnerId,
        actorUserId: admin.adminUserId,
        actorUsername: admin.adminUsername,
        actorProfileImage: admin.adminProfileImage,
        recipeId,
        recipeTitle,
        message: `Your recipe "${recipeTitle}" needs revision.`,
        read: false,
        readAt: null,
        createdAt: serverTimestamp(),
      }, {merge: true})
    }
  })

  await batch.commit()
}

export async function saveRecipeReviewFeedback({
  recipeId,
  section,
  feedback,
}: {
  recipeId: string
  section: ReviewSectionKey
  feedback: ReviewSectionFeedback
}) {
  if (!recipeId) {
    throw new Error("Recipe id is required.")
  }

  const recipeRef = doc(db, "recipes", recipeId)

  await updateDoc(recipeRef, {
    [`reviewFeedback.${section}`]: {
      message: feedback.message.trim(),
      severity: feedback.message.trim() ? feedback.severity : null,
    },
    updatedAt: serverTimestamp(),
  })
}

export async function resolveReviewRecipeImages(recipe: ReviewRecipe): Promise<ReviewRecipe> {
  const [image, cookingSteps] = await Promise.all([
    resolveStorageImage(recipe.image),

    Promise.all(
      (recipe.cookingSteps || []).map(async (step) => ({
        ...step,
        image: await resolveStorageImage(step.image),
      }))
    ),
  ])

  return {
    ...recipe,
    image,
    cookingSteps,
  }
}

export async function fetchPendingRecipes(): Promise<ReviewRecipe[]> {
    const recipesQuery = query(
      collection(db, "recipes"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(30)
    )

    const snapshot = await getDocs(recipesQuery)

  return Promise.all(
    snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as ReviewRecipe

      return resolveReviewRecipeImages({
        ...data,
        id: docSnap.id,
        recipeId: data.recipeId || docSnap.id,
      })
    })
  )
}

async function getCurrentAdminMeta() {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    return {
      adminUserId: "unknown",
      adminUsername: "Admin",
      adminProfileImage: "",
    }
  }

  const userSnap = await getDoc(doc(db, "users", user.uid))
  const userData = userSnap.exists() ? userSnap.data() : {}

  return {
    adminUserId: user.uid,
    adminUsername: userData.username || user.displayName || "Admin",
    adminProfileImage: userData.profileImage || user.photoURL || "",
  }
}

function getModerationNotificationId(recipeId: string, type: "approved" | "needs_revision") {
  return `moderation_${type}_${recipeId}`
}

function getRecipeOwnerId(data: any) {
  return data.userId || data.author?.uid || ""
}

export function subscribeToPendingRecipes({
  onChange,
  onError,
}: {
  onChange: (recipes: ReviewRecipe[]) => void
  onError: (error: Error) => void
}) {
  const recipesQuery = query(
    collection(db, "recipes"),
    where("status", "==", "pending"),
    orderBy("moderation.submittedAt", "desc"),
    limit(100)
  )

  let isActive = true
  let snapshotVersion = 0

  const unsubscribe = onSnapshot(
    recipesQuery,
    (snapshot) => {
      const currentVersion = ++snapshotVersion

      const recipes = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as ReviewRecipe

        return {
          ...data,
          id: docSnap.id,
          recipeId: data.recipeId || docSnap.id,
        }
      })

      Promise.all(
        recipes.map(resolveReviewRecipeImages)
      )
        .then((resolvedRecipes) => {
          if (!isActive || currentVersion !== snapshotVersion) {
            return
          }

          onChange(resolvedRecipes)
        })
        .catch((error) => {
          if (!isActive || currentVersion !== snapshotVersion) {
            return
          }

          onError(
            error instanceof Error
              ? error
              : new Error("Failed to resolve recipe images.")
          )
        })
    },
    (error) => {
      if (!isActive) return

      onError(error)
    }
  )

  return () => {
    isActive = false
    snapshotVersion++

    unsubscribe()
  }
}