import { addDoc, collection, serverTimestamp } from "@firebase/firestore"
import { PostRecipeIngredient, PostRecipeStep } from "../types/postRecipe.types"
import { CurrentUserCardData } from "../types/recipeCard.types"
import { db, storage } from "../../../firebase-config"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"

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