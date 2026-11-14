import { FieldValue, getFirestore } from "firebase-admin/firestore"
import { getDownloadURL, getStorage } from "firebase-admin/storage"
import { HttpsError, onCall } from "firebase-functions/v2/https"
import { finalizeDailyAction, RateLimitError, reserveDailyAction } from "../services/rateLimiter.service"
import { logger } from "firebase-functions"
import { buildRecipeKeywords } from "../utils/searchKeywords"
import { addRecipePendingNotificationToTransaction, getAdminUserIds } from "../notifications/recipeNotifications.service"
import { completeRecipeUploadSession, createRecipeUploadSession } from "./recipeUploadSession.service"

const REGION = "europe-west1"
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

type IngredientInput = {
  ingredient: string
  quantity: string
  unit: string
}

type StepInput = {
  title: string
  description: string
  imagePath?: string | null
}

type RecipeInput = {
  title: string
  description: string
  cuisine: string
  durationMinutes: number
  servings: number
  difficulty: string
  meal: string
  visibility: "public" | "private"
  imagePath: string
  ingredients: IngredientInput[]
  steps: StepInput[]
}

function requireObject(
  value: unknown
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpsError("invalid-argument", "Invalid request body.")
  }

  return value as Record<string, unknown>
}

function requireString(
  value: unknown,
  name: string,
  min: number,
  max: number
): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${name} is required.`)
  }

  const text = value.trim()

  if (text.length < min || text.length > max) {
    throw new HttpsError(
      "invalid-argument",
      `${name} must contain between ${min} and ${max} characters.`
    )
  }

  return text
}

function requireNumber(
  value: unknown,
  name: string,
  min: number,
  max: number
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new HttpsError("invalid-argument", `Invalid ${name}.`)
  }

  return value
}

function requireOption<T extends string>(
  value: unknown,
  options: readonly T[],
  name: string
): T {
  if (typeof value !== "string" || !options.includes(value as T)) {
    throw new HttpsError("invalid-argument", `Invalid ${name}.`)
  }

  return value as T
}

function validateRecipe(value: unknown): RecipeInput {
  const data = requireObject(value)

  if (!Array.isArray(data.ingredients) ||
      data.ingredients.length < 1 ||
      data.ingredients.length > 40) {
    throw new HttpsError("invalid-argument", "Invalid ingredients.")
  }

  if (!Array.isArray(data.steps) ||
      data.steps.length < 1 ||
      data.steps.length > 30) {
    throw new HttpsError("invalid-argument", "Invalid cooking steps.")
  }

  return {
    title: requireString(data.title, "Title", 5, 100),
    description: requireString(data.description, "Description", 30, 5000),
    cuisine: requireString(data.cuisine, "Cuisine", 2, 60).toLowerCase(),
    durationMinutes: requireNumber(data.durationMinutes, "duration", 1, 1440),
    servings: requireNumber(data.servings, "servings", 1, 100),
    difficulty: requireOption(
      data.difficulty,
      ["easy", "medium", "hard"] as const,
      "difficulty"
    ),
    meal: requireOption(
      data.meal,
      ["breakfast", "lunch", "dinner", "dessert", "snack"] as const,
      "meal"
    ),
    visibility: requireOption(
      data.visibility,
      ["public", "private"] as const,
      "visibility"
    ),
    imagePath: requireString(data.imagePath, "Main image", 1, 500),
    ingredients: data.ingredients.map((raw) => {
      const item = requireObject(raw)

      return {
        ingredient: requireString(item.ingredient, "Ingredient", 1, 150),
        quantity: requireString(item.quantity, "Quantity", 1, 50),
        unit: requireString(item.unit, "Unit", 1, 30),
      }
    }),
    steps: data.steps.map((raw) => {
      const step = requireObject(raw)

      return {
        title: typeof step.title === "string"
          ? step.title.trim().slice(0, 150)
          : "",
        description: requireString(step.description, "Step description", 1, 2000),
        imagePath: step.imagePath == null
          ? null
          : requireString(step.imagePath, "Step image", 1, 500),
      }
    }),
  }
}

async function checkPostingPermission(userId: string) {
  const snapshot = await getFirestore()
    .collection("users")
    .doc(userId)
    .get()

  if (!snapshot.exists) {
    throw new HttpsError("permission-denied", "User profile not found.")
  }

  const data = snapshot.data()!

  if (data.restrictions?.canPostRecipes === false) {
    throw new HttpsError(
      "permission-denied",
      "You are not allowed to post recipes."
    )
  }

  return data
}

async function verifyImage(
  userId: string,
  requestId: string,
  path: string,
  location: "main" | `steps/${number}`
) {
  const expectedPrefix =
    `recipe_uploads/${userId}/${requestId}/${location}/`

  if (
    !path.startsWith(expectedPrefix) ||
    !/^[a-zA-Z0-9._-]+$/.test(
      path.slice(expectedPrefix.length)
    )
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid recipe image location."
    )
  }

  const bucketName = "flavorfolio-eaecb.appspot.com"
  const file = getStorage().bucket(bucketName).file(path)

  logger.info("[verifyImage] Checking file", {
    bucket: bucketName,
    path,
  })

  logger.info("[verifyImage] Checking existence")

  const [exists] = await file.exists()

  logger.info("[verifyImage] Exists:", exists)

  if (!exists) {
    throw new HttpsError(
      "failed-precondition",
      "An uploaded recipe image is missing."
    )
  }

  logger.info("[verifyImage] Reading metadata")

  const [metadata] = await file.getMetadata()

  logger.info("[verifyImage] Metadata received", {
    contentType: metadata.contentType,
    size: metadata.size,
  })

  if (
    !["image/jpeg", "image/png", "image/webp"].includes(
      metadata.contentType || ""
    ) ||
    Number(metadata.size || 0) > MAX_IMAGE_BYTES ||
    Number(metadata.size || 0) <= 0
  ) {
    throw new HttpsError(
      "invalid-argument",
      "An image has an invalid type or size."
    )
  }

  const isStorageEmulator = Boolean(
    process.env.FIREBASE_STORAGE_EMULATOR_HOST
  )

  let imageUrl: string

  if (isStorageEmulator) {
    imageUrl = `gs://${file.bucket.name}/${file.name}`

    logger.info("[verifyImage] Using emulator storage reference", {
      imageUrl,
    })
  } else {
    imageUrl = await getDownloadURL(file)

    logger.info("[verifyImage] Download URL generated")
  }

  return {
    url: imageUrl,
    path,
  }
}

function handleError(error: unknown): never {
  if (error instanceof HttpsError) throw error

  if (error instanceof RateLimitError) {
    switch (error.code) {
      case "limit-exceeded":
        throw new HttpsError("resource-exhausted", error.message)
      case "reservation-expired":
      case "reservation-not-found":
        throw new HttpsError("failed-precondition", error.message)
      default:
        throw new HttpsError("invalid-argument", error.message)
    }
  }

  logger.error("Recipe creation failed:", error)
  throw new HttpsError("internal", "Unable to process recipe creation.")
}

export const beginRecipeCreation = onCall(
  {
    region: REGION,
    // Activate after App Check is configured and tested.
    enforceAppCheck: false,
  },
  async (request) => {
    try {
      const userId = request.auth?.uid

      if (!userId) {
        throw new HttpsError("unauthenticated", "Sign in to create a recipe.")
      }

      const data = requireObject(request.data)
      const requestId = requireString(data.requestId, "Request ID", 8, 128)

      await checkPostingPermission(userId)

      const reservation = await reserveDailyAction({
        userId,
        action: "createRecipe",
        requestId,

        performWrites: (transaction, reservation) => {
          createRecipeUploadSession(transaction, {
            userId,
            requestId,
            day: reservation.day,
            expiresAt: reservation.expiresAt,
          })
        },
      })

      return {
        ...reservation,
        uploadPrefix: `recipe_uploads/${userId}/${requestId}/`,
      }
    } catch (error) {
      return handleError(error)
    }
  }
)

export const finalizeRecipeCreation = onCall(
  {
    region: REGION,
    enforceAppCheck: false,
  },
  async (request) => {
    try {
      const userId = request.auth?.uid

      if (!userId) {
        throw new HttpsError("unauthenticated", "Sign in to create a recipe.")
      }

      const data = requireObject(request.data)
      const requestId = requireString(data.requestId, "Request ID", 8, 128)
      const day = requireString(data.day, "Reservation day", 10, 10)

      const recipe = validateRecipe(data.recipe)

      const user = await checkPostingPermission(userId)

      const mainImage = await verifyImage(
        userId,
        requestId,
        recipe.imagePath,
        "main"
      )

      const steps = await Promise.all(
        recipe.steps.map(async (step, index) => {
          const image = step.imagePath
            ? await verifyImage(
                userId,
                requestId,
                step.imagePath,
                `steps/${index}`
              )
            : null

          return {
            title: step.title,
            description: step.description,
            image: image?.url ?? null,
            imageFileName: image?.path ?? null,
            error: false,
          }
        })
      )

      const db = getFirestore()
      const recipeRef = db.collection("recipes").doc(requestId)

      const recipeData = {
        title: recipe.title,
        description: recipe.description,
        cuisine: recipe.cuisine,
        durationMinutes: recipe.durationMinutes,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        meal: recipe.meal,
        visibility: recipe.visibility,

        image: mainImage.url,
        imageFileName: mainImage.path,

        ingredients: recipe.ingredients,
        cookingSteps: steps,

        userId,
        user: user.username || "",
        author: {
          username: user.username || "",
          profileImage: user.profileImage || "",
          followersCount: 0,
        },

        status: "pending",

        stats: {
          averageRating: 0,
          ratingsCount: 0,
          ratingsSum: 0,
          commentsCount: 0,
          savesCount: 0,
        },

        moderation: {
          submittedAt: FieldValue.serverTimestamp(),
          reviewedAt: null,
          reviewedBy: null,
          revisionFeedback: "",
          denialReason: "",
        },

        searchKeywords: buildRecipeKeywords({
          title: recipe.title,
          description: recipe.description,
          cuisine: recipe.cuisine,
          meal: recipe.meal,
          difficulty: recipe.difficulty,
          authorUsername: user.username || "",
          ingredients: recipe.ingredients,
        }),

        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }

      const adminUserIds = await getAdminUserIds()

      await finalizeDailyAction({
        userId,
        action: "createRecipe",
        requestId,
        day,

        performWrites: (transaction) => {
          // 1. Create recipe
          transaction.create(recipeRef, recipeData)

          // 2. Notify thy watchers
          adminUserIds.forEach((adminUserId) => {
            addRecipePendingNotificationToTransaction(
              transaction,
              {
                recipientUserId: adminUserId,
                actorUserId: userId,
                actorUsername: user.username || "",
                actorProfileImage: user.profileImage || "",
                recipeId: recipeRef.id,
                recipeTitle: recipe.title,
              }
            )
          })

          completeRecipeUploadSession(
            transaction,
            requestId
          )
        },
      })

      return {
        recipeId: recipeRef.id,
        status: "pending",
      }
    } catch (error) {
      return handleError(error)
    }
  }
)