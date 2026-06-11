import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "@firebase/firestore"
import { PostRecipeIngredient, PostRecipeStep } from "../types/postRecipe.types"
import { CurrentUserCardData } from "../types/recipeCard.types"
import { db, storage } from "../../../firebase-config"
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage"

interface CreateRecipePayload {
    title: string
    description: string
    cuisine: string
    duration: string
    servings: string
    difficulty: string
    meal: string
    visibility: "public" | "private"
    imageFile: File 
    ingredients: PostRecipeIngredient[]
    steps: PostRecipeStep[]
    currentUser: CurrentUserCardData
}

interface UpdateRecipePayload {
    recipeId: string
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
    currentUser: CurrentUserCardData
}

interface DeleteRecipePayload {
    recipeId: string
    currentUser: CurrentUserCardData
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

export async function createPendingRecipe({
    title,
    description,
    cuisine,
    duration,
    servings,
    difficulty,
    meal,
    visibility,
    imageFile,
    ingredients,
    steps,
    currentUser,
}: CreateRecipePayload) {
    const { imageUrl, imageFileName } = await uploadRecipeImage(imageFile)

    const cookingSteps = await Promise.all(
        steps.map(async (step, index) => {
        let stepImageUrl: string | null = null
        let stepImageFileName: string | null = null

        if (step.image) {
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

    const recipeData = {
        title: title.trim(),
        description: description.trim(),
        cuisine: cuisine.trim().toLowerCase(),
        durationMinutes: Number(duration),
        servings: Number(servings),
        difficulty,
        meal,

        image: imageUrl,
        imageFileName,

        ingredients: ingredients.map((ingredient) => ({
            ingredient: ingredient.ingredient.trim(),
            quantity: ingredient.quantity.trim(),
            unit: ingredient.unit,
        })),

        cookingSteps,

        userId: currentUser.uid,
        user: currentUser.username,
        author: {
            username: currentUser.username,
            profileImage: currentUser.profileImage || "",
            followersCount: 0,
        },

        status: "pending",
        visibility,

        stats: {
            averageRating: 0,
            ratingsCount: 0,
            ratingsSum: 0,
            commentsCount: 0,
            savesCount: 0,
        },

        moderation: {
            submittedAt: serverTimestamp(),
            reviewedAt: null,
            reviewedBy: null,
            revisionFeedback: "",
            denialReason: "",
        },

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "recipes"), recipeData)
    return docRef.id
}

export async function updateRecipe({
  recipeId,
  title,
  description,
  cuisine,
  duration,
  servings,
  difficulty,
  meal,
  visibility,
  imageFile,
  existingImageUrl,
  existingImageFileName,
  ingredients,
  steps,
  currentUser,
}: UpdateRecipePayload) {
  const recipeRef = doc(db, "recipes", recipeId)
  const recipeSnap = await getDoc(recipeRef)

  if (!recipeSnap.exists()) {
    throw new Error("Recipe not found.")
  }

  const recipeData = recipeSnap.data()

  if (recipeData.userId !== currentUser.uid) {
    throw new Error("You are not allowed to edit this recipe.")
  }

  let imageUrl = existingImageUrl
  let imageFileName = existingImageFileName || recipeData.imageFileName || ""

  if (imageFile) {
    const uploadedImage = await uploadRecipeImage(imageFile)
    imageUrl = uploadedImage.imageUrl
    imageFileName = uploadedImage.imageFileName
  }

  const cookingSteps = await Promise.all(
    steps.map(async (step, index) => {
      let stepImageUrl = step.existingImageUrl || step.imagePreview || null
      let stepImageFileName = step.existingImageFileName || null

      if (step.image) {
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

  await updateDoc(recipeRef, {
    title: title.trim(),
    description: description.trim(),
    cuisine: cuisine.trim().toLowerCase(),
    durationMinutes: Number(duration),
    servings: Number(servings),
    difficulty,
    meal,
    visibility,

    image: imageUrl,
    imageFileName,

    ingredients: ingredients.map((ingredient) => ({
      ingredient: ingredient.ingredient.trim(),
      quantity: ingredient.quantity.trim(),
      unit: ingredient.unit,
    })),

    cookingSteps,

    status: "pending",

    moderation: {
      submittedAt: serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      revisionFeedback: "",
      denialReason: "",
    },

    updatedAt: serverTimestamp(),
  })

  return recipeId
}

async function deleteStorageFile(path: string) {
  try {
    await deleteObject(ref(storage, path))
  } catch (error: any) {
    if (error?.code === "storage/object-not-found") return
    console.error(`Failed to delete storage file: ${path}`, error)
  }
}

export async function deleteRecipe({recipeId, currentUser}: DeleteRecipePayload) {
    const recipeRef = doc(db, "recipes", recipeId)
    const recipeSnap = await getDoc(recipeRef)

    if (!recipeSnap.exists()) {
        throw new Error("Recipe not found.")
    }

    const recipeData = recipeSnap.data()

    if (recipeData.userId !== currentUser.uid) {
        throw new Error("You are not allowed to delete this recipe.")
    }

    const deleteTasks: Promise<void>[] = []

    if (recipeData.imageFileName) {
        deleteTasks.push(deleteStorageFile(`recipe_images/${recipeData.imageFileName}`))
    }

    const cookingSteps = Array.isArray(recipeData.cookingSteps)
    ? recipeData.cookingSteps : []

    cookingSteps.forEach((step) => {
        if (step?.imageFileName) {
            deleteTasks.push(
                deleteStorageFile(`cooking_steps_images/${step.imageFileName}`)
            )
        }
    })

    await Promise.all(deleteTasks)
    await deleteDoc(recipeRef)

    return recipeId
}
