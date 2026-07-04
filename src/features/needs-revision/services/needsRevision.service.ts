import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from "@firebase/firestore"
import { NeedsRevisionRecipe } from "../types/needsRevision.types"
import { db, storage } from "../../../firebase-config"
import { PostRecipeIngredient, PostRecipeStep } from "../../home/types/postRecipe.types"
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage"

export interface UpdateNeedsRevisionRecipePayload {
  title: string
  description: string
  cuisine: string
  duration: string
  servings: string
  difficulty: string
  meal: string
  visibility: "public" | "private"
  imageFile: File | null
  existingImageUrl: string
  existingImageFileName?: string
  ingredients: PostRecipeIngredient[]
  steps: PostRecipeStep[]
}

function getRecipeResubmittedNotificationId(recipeId: string) {
  return `recipe_resubmitted_${recipeId}`
}

async function deleteStorageFile(path: string) {
  try {
    await deleteObject(ref(storage, path))
  } catch (error: any) {
    if (error?.code === "storage/object-not-found") return
    console.error(`Failed to delete storage file: ${path}`, error)
  }
}

async function uploadRecipeImage(file: File) {
  const imageFileName = `${Date.now()}_${file.name}`
  const imageRef = ref(storage, `recipe_images/${imageFileName}`)

  await uploadBytes(imageRef, file)

  return {
    imageUrl: await getDownloadURL(imageRef),
    imageFileName,
  }
}

async function uploadStepImage(file: File, index: number) {
  const imageFileName = `${Date.now()}_step_${index + 1}_${file.name}`
  const imageRef = ref(storage, `cooking_steps_images/${imageFileName}`)

  await uploadBytes(imageRef, file)

  return {
    imageUrl: await getDownloadURL(imageRef),
    imageFileName,
  }
}

export async function deleteNeedsRevisionRecipes(recipeIds: string[]) {
  const deleteTasks: Promise<void>[] = []

  for (const recipeId of recipeIds) {
    const recipeRef = doc(db, "recipes", recipeId)
    const recipeSnap = await getDoc(recipeRef)

    if (!recipeSnap.exists()) continue

    const recipeData = recipeSnap.data()

    if (recipeData.imageFileName) {
      deleteTasks.push(deleteStorageFile(`recipe_images/${recipeData.imageFileName}`))
    }

    const cookingSteps = Array.isArray(recipeData.cookingSteps)
      ? recipeData.cookingSteps
      : []

    cookingSteps.forEach((step) => {
      if (step?.imageFileName) {
        deleteTasks.push(deleteStorageFile(`cooking_steps_images/${step.imageFileName}`))
      }
    })
  }

  await Promise.all(deleteTasks)

  const batch = writeBatch(db)

  recipeIds.forEach((recipeId) => {
    batch.delete(doc(db, "recipes", recipeId))
  })

  await batch.commit()
}

function isBlobUrl(value?: string | null) {
  return typeof value === "string" && value.startsWith("blob:")
}

export async function updateNeedsRevisionRecipe({
  recipeId,
  payload,
}: {
  recipeId: string
  payload: UpdateNeedsRevisionRecipePayload
}) {
  const recipeRef = doc(db, "recipes", recipeId)
  const recipeSnap = await getDoc(recipeRef)

  if (!recipeSnap.exists()) {
    throw new Error("Recipe not found.")
  }

  const recipeData = recipeSnap.data()

  let imageUrl = !isBlobUrl(payload.existingImageUrl)
    ? payload.existingImageUrl
    : recipeData.image || ""

  let imageFileName = payload.existingImageFileName || recipeData.imageFileName || ""

  if (payload.imageFile) {
    if (recipeData.imageFileName) {
      await deleteStorageFile(`recipe_images/${recipeData.imageFileName}`)
    }

    const uploadedImage = await uploadRecipeImage(payload.imageFile)
    imageUrl = uploadedImage.imageUrl
    imageFileName = uploadedImage.imageFileName
  }

  const cookingSteps = await Promise.all(
    payload.steps.map(async (step, index) => {
      let stepImageUrl =
        !isBlobUrl(step.existingImageUrl)
          ? step.existingImageUrl || null
          : null

      let stepImageFileName = step.existingImageFileName || null

      if (step.image) {
        if (step.existingImageFileName) {
          await deleteStorageFile(`cooking_steps_images/${step.existingImageFileName}`)
        }

        const uploadedStepImage = await uploadStepImage(step.image, index)
        stepImageUrl = uploadedStepImage.imageUrl
        stepImageFileName = uploadedStepImage.imageFileName
      }

      return {
        title: step.title?.trim() || "",
        description: step.description.trim(),
        image: stepImageUrl,
        imageFileName: stepImageFileName,
        error: false,
      }
    })
  )

  const nextRecipeData = {
    title: payload.title.trim(),
    description: payload.description.trim(),
    cuisine: payload.cuisine.trim().toLowerCase(),
    durationMinutes: Number(payload.duration),
    servings: Number(payload.servings),
    difficulty: payload.difficulty,
    meal: payload.meal,
    visibility: payload.visibility,
    image: imageUrl,
    imageFileName,
    ingredients: payload.ingredients.map((ingredient) => ({
      ingredient: ingredient.ingredient.trim(),
      quantity: ingredient.quantity.trim(),
      unit: ingredient.unit,
    })),
    cookingSteps,
    status: "needs_revision",
  }

  await updateDoc(recipeRef, {
    ...nextRecipeData,
    updatedAt: serverTimestamp(),
  })

  return nextRecipeData
}

export async function submitNeedsRevisionRecipe(recipeId: string) {
  const recipeRef = doc(db, "recipes", recipeId)
  const recipeSnap = await getDoc(recipeRef)

  if (!recipeSnap.exists()) {
    throw new Error("Recipe not found.")
  }

  const recipeData = recipeSnap.data()

  const recipeTitle = recipeData.title || "Untitled recipe"
  const recipeOwnerId = recipeData.userId || ""
  const recipeOwnerUsername =
    recipeData.author?.username || recipeData.user || "Creator"
  const recipeOwnerProfileImage =
    recipeData.author?.profileImage || ""

  const batch = writeBatch(db)

  batch.update(recipeRef, {
    status: "pending",
    updatedAt: serverTimestamp(),
    "moderation.submittedAt": serverTimestamp(),
    "moderation.reviewedAt": null,
    "moderation.reviewedBy": null,
  })

  const adminNotificationRef = doc(
    db,
    "adminNotifications",
    getRecipeResubmittedNotificationId(recipeId)
  )

  batch.set(
    adminNotificationRef,
    {
      type: "recipe_resubmitted",
      recipeId,
      recipeTitle,
      actorUserId: recipeOwnerId,
      actorUsername: recipeOwnerUsername,
      actorProfileImage: recipeOwnerProfileImage,
      message: `${recipeOwnerUsername} resubmitted "${recipeTitle}" for review.`,
      read: false,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )

  const activityRef = doc(collection(db, "adminModerationActivity"))

  batch.set(activityRef, {
    type: "resubmitted",
    recipeId,
    recipeTitle,
    recipeOwnerId,
    recipeOwnerUsername,
    adminUserId: "",
    adminUsername: recipeOwnerUsername,
    createdAt: serverTimestamp(),
  })

  await batch.commit()
}

export async function fetchNeedsRevisionRecipes(
  userId: string
): Promise<NeedsRevisionRecipe[]> {
  if (!userId) {
    throw new Error("User id is required.")
  }

  const recipesQuery = query(
    collection(db, "recipes"),
    where("userId", "==", userId),
    where("status", "==", "needs_revision"),
    orderBy("updatedAt", "desc"),
    limit(50)
  )

  const snapshot = await getDocs(recipesQuery)

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as NeedsRevisionRecipe

    return {
      ...data,
      id: docSnap.id,
      recipeId: data.recipeId || docSnap.id,
    }
  })
}