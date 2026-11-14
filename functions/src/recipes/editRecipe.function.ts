import { HttpsError, onCall } from "firebase-functions/v2/https"
import { finalizeDailyAction, RateLimitError, reserveDailyAction } from "../services/rateLimiter.service"
import { logger } from "firebase-functions"
import { FieldValue, getFirestore } from "firebase-admin/firestore"
import { createRecipeEditSession, getRecipeEditSessionRef, RecipeEditSession } from "./recipeEditSession.service"
import { getDownloadURL, getStorage } from "firebase-admin/storage"
import { buildRecipeKeywords } from "../utils/searchKeywords"

const REGION = "europe-west1"

const EDITABLE_STATUSES = [
  "published",
  "draft",
  "needs_revision",
]

function requireObject(
  value: unknown
): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid request body."
    )
  }

  return value as Record<string, unknown>
}

function requireId(
  value: unknown,
  name: string
): string {
  if (
    typeof value !== "string" ||
    !/^[a-zA-Z0-9_-]{8,128}$/.test(value)
  ) {
    throw new HttpsError(
      "invalid-argument",
      `Invalid ${name}.`
    )
  }

  return value
}

function handleError(error: unknown): never {
  if (error instanceof HttpsError) {
    throw error
  }

  if (error instanceof RateLimitError) {
    switch (error.code) {
      case "limit-exceeded":
        throw new HttpsError(
          "resource-exhausted",
          error.message
        )

      case "reservation-expired":
      case "reservation-not-found":
        throw new HttpsError(
          "failed-precondition",
          error.message
        )

      default:
        throw new HttpsError(
          "invalid-argument",
          error.message
        )
    }
  }

  logger.error("Recipe edit reservation failed:", error)

  throw new HttpsError(
    "internal",
    "Unable to begin recipe editing."
  )
}

export const beginRecipeEdit = onCall(
  {
    region: REGION,
    enforceAppCheck: false,
  },
  async (request) => {
    try {
      const userId = request.auth?.uid

      if (!userId) {
        throw new HttpsError(
          "unauthenticated",
          "Sign in to edit a recipe."
        )
      }

      const data = requireObject(request.data)

      const recipeId = requireId(
        data.recipeId,
        "Recipe ID"
      )

      const requestId = requireId(
        data.requestId,
        "Request ID"
      )

      const db = getFirestore()

      const [userSnapshot, recipeSnapshot] =
        await Promise.all([
          db.collection("users").doc(userId).get(),
          db.collection("recipes").doc(recipeId).get(),
        ])

      if (!userSnapshot.exists) {
        throw new HttpsError(
          "permission-denied",
          "User profile not found."
        )
      }

      const userData = userSnapshot.data()!

      if (
        userData.restrictions?.canPostRecipes === false
      ) {
        throw new HttpsError(
          "permission-denied",
          "You are not allowed to edit recipes."
        )
      }

      if (!recipeSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "Recipe not found."
        )
      }

      const recipeData = recipeSnapshot.data()!

      const recipeVersion = recipeSnapshot.updateTime?.toMillis()

      if (recipeVersion === undefined) {
        throw new HttpsError(
          "failed-precondition",
          "Recipe version could not be determined."
        )
      }

      if (recipeData.userId !== userId) {
        throw new HttpsError(
          "permission-denied",
          "You cannot edit another user's recipe."
        )
      }

      if (
        !EDITABLE_STATUSES.includes(recipeData.status)
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This recipe cannot be edited in its current state."
        )
      }

      const sessionRef =
        getRecipeEditSessionRef(requestId)

      // Prevent reusing an existing request ID for another user, recipe or operation.
      const existingSession = await sessionRef.get()

      if (existingSession.exists) {
        const session =
          existingSession.data() as RecipeEditSession

        if (
          session.userId !== userId ||
          session.recipeId !== recipeId ||
          session.action !== "editRecipe"
        ) {
          throw new HttpsError(
            "invalid-argument",
            "Request ID belongs to another edit session."
          )
        }

        if (session.status !== "active") {
          throw new HttpsError(
            "failed-precondition",
            "This edit session is no longer active."
          )
        }
      }

      const reservation = await reserveDailyAction({
        userId,
        action: "editRecipe",
        requestId,

        performWrites: (transaction, result) => {
          createRecipeEditSession(transaction, {
            userId,
            recipeId,
            requestId,
            day: result.day,
            expiresAt: result.expiresAt,
            recipeVersion,
          })
        },
      })

      // Also validate after reservation: concurrent requests can use the same request ID.
      const sessionSnapshot = await sessionRef.get()

      if (!sessionSnapshot.exists) {
        throw new HttpsError(
          "failed-precondition",
          "Edit session was not created."
        )
      }

      const session =
        sessionSnapshot.data() as RecipeEditSession

      if (
        session.userId !== userId ||
        session.recipeId !== recipeId ||
        session.requestId !== requestId ||
        session.day !== reservation.day ||
        session.action !== "editRecipe" ||
        session.status !== "active" ||
        session.expiresAt !== reservation.expiresAt
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Edit reservation does not match its session."
        )
      }

      return {
        ...reservation,
        recipeId,
        uploadPrefix: session.uploadPrefix,
      }
    } catch (error) {
      return handleError(error)
    }
  }
)

type EditImageInput = string | null

type EditRecipeInput = {
  title: string
  description: string
  cuisine: string
  durationMinutes: number
  servings: number
  difficulty: "easy" | "medium" | "hard"
  meal: "breakfast" | "lunch" | "dinner" | "dessert" | "snack"
  visibility: "public" | "private"
  imagePath: string
  ingredients: {
    ingredient: string
    quantity: string
    unit: string
  }[]
  steps: {
    title: string
    description: string
    imagePath: EditImageInput
  }[]
}

const EDIT_IMAGE_MAX_BYTES = 10 * 1024 * 1024
const EDIT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

function editRequiredText(
  value: unknown,
  name: string,
  min: number,
  max: number
): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `Invalid ${name}.`)
  }

  const normalized = value.trim()

  if (normalized.length < min || normalized.length > max) {
    throw new HttpsError("invalid-argument", `Invalid ${name}.`)
  }

  return normalized
}

function editRequiredNumber(
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

function editRequiredOption<T extends string>(
  value: unknown,
  name: string,
  options: readonly T[]
): T {
  if (typeof value !== "string" || !options.includes(value as T)) {
    throw new HttpsError("invalid-argument", `Invalid ${name}.`)
  }

  return value as T
}

function validateEditRecipe(value: unknown): EditRecipeInput {
  const data = requireObject(value)

  if (
    !Array.isArray(data.ingredients) ||
    data.ingredients.length < 1 ||
    data.ingredients.length > 40
  ) {
    throw new HttpsError("invalid-argument", "Invalid ingredients.")
  }

  if (
    !Array.isArray(data.steps) ||
    data.steps.length < 1 ||
    data.steps.length > 30
  ) {
    throw new HttpsError("invalid-argument", "Invalid cooking steps.")
  }

  return {
    title: editRequiredText(data.title, "title", 5, 100),
    description: editRequiredText(data.description, "description", 30, 5000),
    cuisine: editRequiredText(data.cuisine, "cuisine", 2, 60).toLowerCase(),
    durationMinutes: editRequiredNumber(data.durationMinutes, "duration", 1, 1440),
    servings: editRequiredNumber(data.servings, "servings", 1, 100),

    difficulty: editRequiredOption(
      data.difficulty,
      "difficulty",
      ["easy", "medium", "hard"] as const
    ),

    meal: editRequiredOption(
      data.meal,
      "meal",
      ["breakfast", "lunch", "dinner", "dessert", "snack"] as const
    ),

    visibility: editRequiredOption(
      data.visibility,
      "visibility",
      ["public", "private"] as const
    ),

    imagePath: editRequiredText(data.imagePath, "main image path", 1, 500),

    ingredients: data.ingredients.map((raw) => {
      const ingredient = requireObject(raw)

      return {
        ingredient: editRequiredText(ingredient.ingredient, "ingredient", 1, 150),
        quantity: editRequiredText(ingredient.quantity, "quantity", 1, 50),
        unit: editRequiredText(ingredient.unit, "unit", 1, 30),
      }
    }),

    steps: data.steps.map((raw) => {
      const step = requireObject(raw)

      return {
        title:
          typeof step.title === "string"
            ? step.title.trim().slice(0, 150)
            : "",

        description: editRequiredText(
          step.description,
          "step description",
          1,
          2000
        ),

        imagePath:
          step.imagePath == null
            ? null
            : editRequiredText(step.imagePath, "step image path", 1, 500),
      }
    }),
  }
}

// New backend recipes save full Storage paths.
// Older recipes may contain only the filename.
function storedImagePath(
  value: unknown,
  legacyFolder: "recipe_images" | "cooking_steps_images"
): string | null {
  if (typeof value !== "string" || !value.trim()) return null

  const path = value.trim()

  if (path.includes("/")) {
    return path
  }

  return `${legacyFolder}/${path}`
}

function validEditFileName(name: string): boolean {
  return (
    /^[a-zA-Z0-9._-]{1,150}$/.test(name) &&
    name !== "." &&
    name !== ".."
  )
}

function isNewEditImagePath(
  path: string,
  userId: string,
  requestId: string,
  location: "main" | `steps/${number}`
): boolean {
  const prefix =
    `recipe_edit_uploads/${userId}/${requestId}/${location}/`

  if (!path.startsWith(prefix)) return false

  return validEditFileName(path.slice(prefix.length))
}

type ResolvedEditImage = {
  path: string
  url: string
}

async function verifyNewEditImage(
  path: string
): Promise<ResolvedEditImage> {
  const bucketName = "flavorfolio-eaecb.appspot.com"
  const file = getStorage().bucket(bucketName).file(path)

  const [exists] = await file.exists()

  if (!exists) {
    throw new HttpsError(
      "failed-precondition",
      "An uploaded edit image is missing."
    )
  }

  const [metadata] = await file.getMetadata()
  const size = Number(metadata.size || 0)

  if (
    !EDIT_IMAGE_TYPES.includes(metadata.contentType || "") ||
    !Number.isFinite(size) ||
    size <= 0 ||
    size > EDIT_IMAGE_MAX_BYTES
  ) {
    throw new HttpsError(
      "invalid-argument",
      "An edit image has an invalid type or size."
    )
  }

  const url = process.env.FIREBASE_STORAGE_EMULATOR_HOST
    ? `gs://${bucketName}/${path}`
    : await getDownloadURL(file)

  return { path, url }
}

export const finalizeRecipeEdit = onCall(
  {
    region: REGION,
    enforceAppCheck: false,
  },
  async (request) => {
    try {
      const userId = request.auth?.uid

      if (!userId) {
        throw new HttpsError(
          "unauthenticated",
          "Sign in to edit a recipe."
        )
      }

      const data = requireObject(request.data)
      const recipeId = requireId(data.recipeId, "Recipe ID")
      const requestId = requireId(data.requestId, "Request ID")
      const day = editRequiredText(data.day, "reservation day", 10, 10)
      const recipe = validateEditRecipe(data.recipe)

      const db = getFirestore()
      const recipeRef = db.collection("recipes").doc(recipeId)
      const sessionRef = getRecipeEditSessionRef(requestId)

      // Preflight: reject invalid sessions before accessing Storage.
      const sessionSnapshot = await sessionRef.get()

      if (!sessionSnapshot.exists) {
        throw new HttpsError(
          "failed-precondition",
          "Recipe edit session not found."
        )
      }

      const session = sessionSnapshot.data() as RecipeEditSession

      if (
        session.userId !== userId ||
        session.recipeId !== recipeId ||
        session.requestId !== requestId ||
        session.action !== "editRecipe" ||
        session.day !== day
      ) {
        throw new HttpsError(
          "permission-denied",
          "Edit session does not belong to this operation."
        )
      }

      // A successful retry must not apply writes again,
      // even if the recipe was changed after the first save.
      if (session.status === "completed") {
        const daySnapshot = await db
          .collection("rateLimits")
          .doc(userId)
          .collection("days")
          .doc(day)
          .get()

        const completed =
          daySnapshot.data()?.completed?.[requestId]

        if (completed?.action !== "editRecipe") {
          throw new HttpsError(
            "failed-precondition",
            "Completed edit has no matching rate-limit record."
          )
        }

        return {
          recipeId,
          alreadyCompleted: true,
        }
      }

      if (
        session.status !== "active" ||
        session.expiresAt <= Date.now()
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Edit session is not active."
        )
      }

      const initialRecipeSnapshot = await recipeRef.get()

      if (!initialRecipeSnapshot.exists) {
        throw new HttpsError("not-found", "Recipe not found.")
      }

      const original = initialRecipeSnapshot.data()!

      if (original.userId !== userId) {
        throw new HttpsError(
          "permission-denied",
          "You cannot edit another user's recipe."
        )
      }

      if (!EDITABLE_STATUSES.includes(original.status)) {
        throw new HttpsError(
          "failed-precondition",
          "This recipe cannot be edited in its current state."
        )
      }

      if (
        initialRecipeSnapshot.updateTime?.toMillis() !==
        session.recipeVersion
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Recipe changed since editing began. Reload it."
        )
      }

      // Resolve the existing main image.
      const originalMainPath = storedImagePath(
        original.imageFileName,
        "recipe_images"
      )

      if (!originalMainPath) {
        throw new HttpsError(
          "failed-precondition",
          "Existing main image has no Storage path."
        )
      }

      // Resolve existing step images by their canonical paths.
      // This also supports reordering steps.
      const originalStepImages = new Map<string, string>()

      for (const step of original.cookingSteps || []) {
        const path = storedImagePath(
          step.imageFileName,
          "cooking_steps_images"
        )

        if (path) {
          originalStepImages.set(path, step.image || "")
        }
      }

      let mainImage: ResolvedEditImage

      if (recipe.imagePath === originalMainPath) {
        mainImage = {
          path: originalMainPath,
          url: original.image || "",
        }
      } else if (
        isNewEditImagePath(
          recipe.imagePath,
          userId,
          requestId,
          "main"
        )
      ) {
        mainImage = await verifyNewEditImage(recipe.imagePath)
      } else {
        throw new HttpsError(
          "invalid-argument",
          "Main image does not belong to this recipe or edit session."
        )
      }

      const resolvedSteps = await Promise.all(
        recipe.steps.map(async (step, index) => {
          let image: ResolvedEditImage | null = null

          if (step.imagePath) {
            if (originalStepImages.has(step.imagePath)) {
              image = {
                path: step.imagePath,
                url: originalStepImages.get(step.imagePath) || "",
              }
            } else if (
              isNewEditImagePath(
                step.imagePath,
                userId,
                requestId,
                `steps/${index}`
              )
            ) {
              image = await verifyNewEditImage(step.imagePath)
            } else {
              throw new HttpsError(
                "invalid-argument",
                "Step image does not belong to this recipe or edit session."
              )
            }
          }

          return {
            title: step.title,
            description: step.description,
            image: image?.url ?? null,
            imageFileName: image?.path ?? null,
            error: false,
          }
        })
      )

      // The transaction callback builds the update after reading
      // the current recipe, user and session.
      let nextRecipeData:
        Record<string, unknown> | null = null

      const applied = await finalizeDailyAction({
        userId,
        action: "editRecipe",
        requestId,
        day,

        validateBeforeWrites: async (transaction) => {
          const [currentRecipe, currentSession, currentUser] =
            await Promise.all([
              transaction.get(recipeRef),
              transaction.get(sessionRef),
              transaction.get(db.collection("users").doc(userId)),
            ])

          if (!currentUser.exists) {
            throw new HttpsError(
              "permission-denied",
              "User profile not found."
            )
          }

          const userData = currentUser.data()!

          if (userData.restrictions?.canPostRecipes === false) {
            throw new HttpsError(
              "permission-denied",
              "You are not allowed to edit recipes."
            )
          }

          if (!currentRecipe.exists || !currentSession.exists) {
            throw new HttpsError(
              "failed-precondition",
              "Recipe or edit session no longer exists."
            )
          }

          const current = currentRecipe.data()!
          const activeSession =
            currentSession.data() as RecipeEditSession

          if (
            activeSession.userId !== userId ||
            activeSession.recipeId !== recipeId ||
            activeSession.requestId !== requestId ||
            activeSession.day !== day ||
            activeSession.action !== "editRecipe" ||
            activeSession.status !== "active" ||
            activeSession.expiresAt <= Date.now()
          ) {
            throw new HttpsError(
              "failed-precondition",
              "Edit session is no longer valid."
            )
          }

          if (current.userId !== userId) {
            throw new HttpsError(
              "permission-denied",
              "You cannot edit another user's recipe."
            )
          }

          if (!EDITABLE_STATUSES.includes(current.status)) {
            throw new HttpsError(
              "failed-precondition",
              "Recipe cannot be edited in its current state."
            )
          }

          if (
            currentRecipe.updateTime?.toMillis() !==
            activeSession.recipeVersion
          ) {
            throw new HttpsError(
              "failed-precondition",
              "Recipe changed since editing began. Reload it."
            )
          }

          // published/draft => draft
          // needs_revision => needs_revision
          const nextStatus =
            current.status === "needs_revision"
              ? "needs_revision"
              : "draft"

          nextRecipeData = {
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
            cookingSteps: resolvedSteps,

            searchKeywords: buildRecipeKeywords({
              title: recipe.title,
              description: recipe.description,
              cuisine: recipe.cuisine,
              meal: recipe.meal,
              difficulty: recipe.difficulty,
              authorUsername:
                current.author?.username ||
                current.user ||
                userData.username ||
                "",
              ingredients: recipe.ingredients,
            }),

            status: nextStatus,
            updatedAt: FieldValue.serverTimestamp(),

            // Preserve feedback on recipes that still need revision.
            ...(nextStatus === "draft"
              ? {
                  moderation: {
                    submittedAt: null,
                    reviewedAt: null,
                    reviewedBy: null,
                    revisionFeedback: "",
                    denialReason: "",
                  },
                }
              : {}),
          }
        },

        performWrites: (transaction) => {
          if (!nextRecipeData) {
            throw new Error(
              "Validated recipe update is unavailable."
            )
          }

          transaction.update(recipeRef, nextRecipeData)

          transaction.update(sessionRef, {
            status: "completed",
            completedAt: Date.now(),
          })
        },
      })

      return {
        recipeId,
        alreadyCompleted: !applied,
      }
    } catch (error) {
      return handleError(error)
    }
  }
)