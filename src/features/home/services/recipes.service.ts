import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from "@firebase/firestore"
import { PostRecipeIngredient, PostRecipeStep } from "../types/postRecipe.types"
import { CurrentUserCardData } from "../types/recipeCard.types"
import { db, storage, functions, auth } from "../../../firebase-config"
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { buildRecipeKeywords } from "../../../utils/searchKeywords"
import { Recipe } from "../types"
import { addRecipePendingNotificationToBatch } from "../../notifications/services/notifications.service"
import { resolveRecipeStoragePath } from "../utils/recipeStoragePaths"
import { getFunctions, httpsCallable } from "firebase/functions"
import { saveRecipeEdit, SaveRecipeEditOptions } from "./recipeEditCallable.service"
import { resolveRecipeImages } from "../utils/resolveRecipeImages"


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

// const functions = getFunctions(undefined, "europe-west1")

interface RecipeCreationReservation {
  requestId: string
  day: string
  uploadPrefix: string
  expiresAt: number
  remaining: number
}

interface RecipeCreationResult {
  recipeId: string
  status: "pending"
}

const beginRecipeCreation = httpsCallable<{ requestId: string }, RecipeCreationReservation>(functions, "beginRecipeCreation")

const finalizeRecipeCreation = httpsCallable<
  {
    requestId: string
    day: string
    recipe: Record<string, unknown>
  },
  RecipeCreationResult
>(functions, "finalizeRecipeCreation")

function safeImageFileName(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()

  const extensions: Record<string, string> = {
    jpg: "jpg",
    jpeg: "jpg",
    png: "png",
    webp: "webp",
  }

  if (!extension || !extensions[extension]) {
    throw new Error("Only JPEG, PNG and WebP images are supported.")
  }

  return `${crypto.randomUUID()}.${extensions[extension]}`
}

async function uploadReservedRecipeImage(
  file: File,
  path: string
) {
  const storageRef = ref(storage, path)

  await uploadBytes(storageRef, file, {
    contentType: file.type,
  })

  return path
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

export async function getAdminUserIds(): Promise<string[]> {
  const snapshot = await getDocs(
    query(
      collection(db, "users"),
      where("admin", "==", true)
    )
  )

  return snapshot.docs.map((doc) => doc.id)
}

// export async function createPendingRecipe({
//     title,
//     description,
//     cuisine,
//     duration,
//     servings,
//     difficulty,
//     meal,
//     visibility,
//     imageFile,
//     ingredients,
//     steps,
//     currentUser,
// }: CreateRecipePayload) {
//     const { imageUrl, imageFileName } = await uploadRecipeImage(imageFile)

//     const cookingSteps = await Promise.all(
//         steps.map(async (step, index) => {
//         let stepImageUrl: string | null = null
//         let stepImageFileName: string | null = null

//         if (step.image) {
//             const uploadedStepImage = await uploadStepImage(step.image, index)

//             stepImageUrl = uploadedStepImage.imageUrl
//             stepImageFileName = uploadedStepImage.imageFileName
//         }

//         return {
//             title: step.title?.trim() || "",
//             description: step.description.trim(),
//             image: stepImageUrl,
//             imageFileName: stepImageFileName,
//             error: false,
//         }
//         })
//     )

//     const recipeData = {
//         title: title.trim(),
//         description: description.trim(),
//         cuisine: cuisine.trim().toLowerCase(),
//         durationMinutes: Number(duration),
//         servings: Number(servings),
//         difficulty,
//         meal,

//         image: imageUrl,
//         imageFileName,

//         ingredients: ingredients.map((ingredient) => ({
//             ingredient: ingredient.ingredient.trim(),
//             quantity: ingredient.quantity.trim(),
//             unit: ingredient.unit,
//         })),

//         cookingSteps,

//         userId: currentUser.uid,
//         user: currentUser.username,
//         author: {
//             username: currentUser.username,
//             profileImage: currentUser.profileImage || "",
//             followersCount: 0,
//         },

//         status: "pending",
//         visibility,

//         stats: {
//             averageRating: 0,
//             ratingsCount: 0,
//             ratingsSum: 0,
//             commentsCount: 0,
//             savesCount: 0,
//         },

//         moderation: {
//             submittedAt: serverTimestamp(),
//             reviewedAt: null,
//             reviewedBy: null,
//             revisionFeedback: "",
//             denialReason: "",
//         },

//         searchKeywords: buildRecipeKeywords({
//           title,
//           description,
//           cuisine,
//           meal,
//           difficulty,
//           authorUsername: currentUser.username,
//           ingredients,
//         }),

//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//     }

//     const docRef = await addDoc(collection(db, "recipes"), recipeData)
//     const adminIds = await getAdminUserIds()

//     const batch = writeBatch(db)

//     adminIds.forEach((adminUserId) => {
//         addRecipePendingNotificationToBatch(batch, {
//             recipientUserId: adminUserId,
//             actorUserId: currentUser.uid,
//             actorUsername: currentUser.username,
//             actorProfileImage: currentUser.profileImage || "",
//             recipeId: docRef.id,
//             recipeTitle: title.trim(),
//         })
//     })

//     await batch.commit()

//     return docRef.id
// }


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
}: CreateRecipePayload): Promise<string> {
  const requestId = crypto.randomUUID()

  const reservationResponse = await beginRecipeCreation({
    requestId,
  })

  const reservation = reservationResponse.data

  const mainImagePath = await uploadReservedRecipeImage(
    imageFile,
    `${reservation.uploadPrefix}main/${safeImageFileName(imageFile)}`
  )

  const cookingSteps = await Promise.all(
    steps.map(async (step, index) => {
      let imagePath: string | null = null

      if (step.image) {
        imagePath = await uploadReservedRecipeImage(
          step.image,
          `${reservation.uploadPrefix}steps/${index}/${safeImageFileName(step.image)}`
        )
      }

      return {
        title: step.title?.trim() || "",
        description: step.description.trim(),
        imagePath,
      }
    })
  )

  // The function validates the payload, verifies uploaded images,
  // creates the recipe and consumes the reserved daily action.
  const result = await finalizeRecipeCreation({
    requestId: reservation.requestId,
    day: reservation.day,
    recipe: {
      title: title.trim(),
      description: description.trim(),
      cuisine: cuisine.trim(),
      durationMinutes: Number(duration),
      servings: Number(servings),
      difficulty,
      meal,
      visibility,
      imagePath: mainImagePath,
      ingredients: ingredients.map((ingredient) => ({
        ingredient: ingredient.ingredient.trim(),
        quantity: ingredient.quantity.trim(),
        unit: ingredient.unit,
      })),
      steps: cookingSteps,
    },
  })

  return result.data.recipeId
}

// export async function updateRecipe({
//   recipeId,
//   title,
//   description,
//   cuisine,
//   duration,
//   servings,
//   difficulty,
//   meal,
//   visibility,
//   imageFile,
//   existingImageUrl,
//   existingImageFileName,
//   ingredients,
//   steps,
//   currentUser,
// }: UpdateRecipePayload) {
//   const recipeRef = doc(db, "recipes", recipeId)
//   const recipeSnap = await getDoc(recipeRef)

//   if (!recipeSnap.exists()) {
//     throw new Error("Recipe not found.")
//   }

//   const recipeData = recipeSnap.data()

//   if (recipeData.userId !== currentUser.uid) {
//     throw new Error("You are not allowed to edit this recipe.")
//   }

//   let imageUrl = existingImageUrl
//   let imageFileName = existingImageFileName || recipeData.imageFileName || ""

//   if (imageFile) {
//     const uploadedImage = await uploadRecipeImage(imageFile)
//     imageUrl = uploadedImage.imageUrl
//     imageFileName = uploadedImage.imageFileName
//   }

//   const cookingSteps = await Promise.all(
//     steps.map(async (step, index) => {
//       let stepImageUrl = step.existingImageUrl || step.imagePreview || null
//       let stepImageFileName = step.existingImageFileName || null

//       if (step.image) {
//         const uploadedStepImage = await uploadStepImage(step.image, index)
//         stepImageUrl = uploadedStepImage.imageUrl
//         stepImageFileName = uploadedStepImage.imageFileName
//       }

//       return {
//         title: step.title?.trim() || "",
//         description: step.description.trim(),
//         image: stepImageUrl,
//         imageFileName: stepImageFileName,
//         error: false,
//       }
//     })
//   )

//   const nextRecipeData = {
//     title: title.trim(),
//     description: description.trim(),
//     cuisine: cuisine.trim().toLowerCase(),
//     durationMinutes: Number(duration),
//     servings: Number(servings),
//     difficulty,
//     meal,
//     visibility,

//     image: imageUrl,
//     imageFileName,

//     ingredients: ingredients.map((ingredient) => ({
//       ingredient: ingredient.ingredient.trim(),
//       quantity: ingredient.quantity.trim(),
//       unit: ingredient.unit,
//     })),

//     cookingSteps,

//     searchKeywords: buildRecipeKeywords({
//       title,
//       description,
//       cuisine,
//       meal,
//       difficulty,
//       authorUsername: currentUser.username,
//       ingredients,
//     }),

//     status: "draft",

//     moderation: {
//       submittedAt: null,
//       reviewedAt: null,
//       reviewedBy: null,
//       revisionFeedback: "",
//       denialReason: "",
//     },

//     updatedAt: serverTimestamp(),
//   }

//   const previousImagePaths = collectRecipeImagePaths({
//     imageFileName: recipeData.imageFileName,
//     cookingSteps: recipeData.cookingSteps,
//   })

//   const nextImagePaths = collectRecipeImagePaths({
//     imageFileName,
//     cookingSteps,
//   })

//   const replacedImagePaths = [...previousImagePaths].filter(
//     (path) => !nextImagePaths.has(path)
//   )

//   await updateDoc(recipeRef, nextRecipeData)

//   return {
//     ...recipeData,
//     ...nextRecipeData,
//     id: recipeId,
//     recipeId
//   }
// }

export async function updateRecipe(
  {
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
    existingImageFileName,
    ingredients,
    steps,
    currentUser,
  }: UpdateRecipePayload,
  options: SaveRecipeEditOptions & {
    requestId?: string
  } = {}
) {
  const authenticatedUserId = auth.currentUser?.uid

  if (!authenticatedUserId) {
    throw new Error("You must sign in to edit a recipe.")
  }

  if (authenticatedUserId !== currentUser.uid) {
    throw new Error("Authenticated user mismatch.")
  }

  return saveRecipeEdit(
    {
      recipeId,
      requestId: options.requestId ?? crypto.randomUUID(),

      title,
      description,
      cuisine,
      duration,
      servings,
      difficulty,
      meal,
      visibility,

      imageFile,
      existingImageFileName,

      ingredients,

      steps: steps.map((step) => ({
        title: step.title,
        description: step.description,
        image: step.image ?? null,
        existingImageFileName: step.existingImageFileName ?? null,
      })),
    },
    options
  )
}

function collectRecipeImagePaths(
  recipe: {
    imageFileName?: string | null
    cookingSteps?: Array<{
      imageFileName?: string | null
    }>
  }
): Set<string> {
  const paths = new Set<string>()

  const mainPath = resolveRecipeStoragePath(
    recipe.imageFileName,
    "main"
  )

  if (mainPath) {
    paths.add(mainPath)
  }

  for (const step of recipe.cookingSteps ?? []) {
    const stepPath = resolveRecipeStoragePath(
      step.imageFileName,
      "step"
    )

    if (stepPath) {
      paths.add(stepPath)
    }
  }

  return paths
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
    const storagePaths = new Set<string>()

    if (!recipeSnap.exists()) {
      throw new Error("Recipe not found.")
    }

    const recipeData = recipeSnap.data()

    const mainImagePath = resolveRecipeStoragePath(
      recipeData.imageFileName,
      "main"
    )

    if (recipeData.userId !== currentUser.uid) {
        throw new Error("You are not allowed to delete this recipe.")
    }

    // const deleteTasks: Promise<void>[] = []

    // if (recipeData.imageFileName) {
    //   deleteTasks.push(deleteStorageFile(`recipe_images/${recipeData.imageFileName}`))
    // }

    if (mainImagePath) {
      storagePaths.add(mainImagePath)
    }

    const cookingSteps = Array.isArray(recipeData.cookingSteps)
    ? recipeData.cookingSteps : []

    cookingSteps.forEach((step) => {
      const stepImagePath = resolveRecipeStoragePath(
        step?.imageFileName,
        "step"
      )

      if (stepImagePath) {
        storagePaths.add(stepImagePath)
      }
    })

    await Promise.all(
      [...storagePaths].map((path) =>
        deleteStorageFile(path)
      )
    )
    await deleteDoc(recipeRef)

    return recipeId
}

export async function fetchRecipeById(
  recipeId: string
): Promise<Recipe | null> {
  if (!recipeId) return null

  const recipeSnap = await getDoc(
    doc(db, "recipes", recipeId)
  )

  if (!recipeSnap.exists()) {
    return null
  }

  const data = recipeSnap.data()

  return resolveRecipeImages({
    ...(data as Recipe),
    id: recipeSnap.id,
    recipeId: data.recipeId || recipeSnap.id,
  })
}
