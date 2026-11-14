import { httpsCallable } from "firebase/functions"
import { auth, storage, functions } from "../../../firebase-config"
import { getMetadata, ref, StorageReference, uploadBytes } from "firebase/storage"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

type Visibility = "public" | "private"

export interface RecipeEditIngredient {
  ingredient: string
  quantity: string
  unit: string
}

export interface RecipeEditStep {
    title?: string
    description: string
    image: File | null
    existingImageFileName?: string | null
}

export interface RecipeEditPayload {
    recipeId: string
    requestId: string
    title: string
    description: string
    cuisine: string
    duration: string | number
    servings: string | number
    difficulty: string
    meal: string
    visibility: Visibility

    imageFile: File | null
    existingImageFileName?: string | null

    ingredients: RecipeEditIngredient[]
    steps: RecipeEditStep[]
}

interface BeginEditResponse {
  requestId: string
  recipeId: string
  action: "editRecipe"
  day: string
  limit: number
  used: number
  remaining: number
  expiresAt: number
  uploadPrefix: string
}

export type RecipeEditReservation = BeginEditResponse

export interface SaveRecipeEditOptions {
  reservation?: RecipeEditReservation

  onReservation?: (
    reservation: RecipeEditReservation
  ) => void

  prepared?: PreparedRecipeEdit

  onPrepared?: (
    prepared: PreparedRecipeEdit
  ) => void
}

interface FinalizeEditResponse {
  recipeId: string
  alreadyCompleted: boolean
}

export interface FinalizeRecipeData {
  title: string
  description: string
  cuisine: string
  durationMinutes: number
  servings: number
  difficulty: string
  meal: string
  visibility: Visibility
  imagePath: string
  ingredients: RecipeEditIngredient[]
  steps: {
    title: string
    description: string
    imagePath: string | null
  }[]
}

export interface PreparedRecipeEdit {
  recipeId: string
  requestId: string
  day: string
  recipe: FinalizeRecipeData
}

const beginRecipeEdit = httpsCallable<
  { recipeId: string; requestId: string },
  BeginEditResponse
>(functions, "beginRecipeEdit")

const finalizeRecipeEdit = httpsCallable<
  {
    recipeId: string
    requestId: string
    day: string
    recipe: FinalizeRecipeData
  },
  FinalizeEditResponse
>(functions, "finalizeRecipeEdit")

async function completePreparedEdit(
  prepared: PreparedRecipeEdit
): Promise<FinalizeEditResponse> {
  const response = await finalizeRecipeEdit(prepared)

  return response.data
}

function normalizeExistingPath(
  value: string | null | undefined,
  legacyFolder: "recipe_images" | "cooking_steps_images"
): string | null {
  if (typeof value !== "string") return null

  const path = value.trim()

  if (!path) return null

  // New recipes already use full Storage paths.
  if (path.includes("/")) return path

  // Legacy recipes may store only a filename.
  return `${legacyFolder}/${path}`
}

function validateImageFile(file: File) {
  const supportedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ]

  if (!supportedTypes.includes(file.type)) {
    throw new Error(
      "Only JPEG, PNG and WebP images are supported."
    )
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      "Recipe images must be between 1 byte and 10 MB."
    )
  }
}

function getExtension(file: File): string {
  switch (file.type) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    default:
      throw new Error("Unsupported image type.")
  }
}

async function uploadEditImage(
  file: File,
  path: string
): Promise<string> {
  validateImageFile(file)

  const storageRef: StorageReference = ref(storage, path)

  try {
    const metadata = await getMetadata(storageRef)

    if (
      Number(metadata.size) !== file.size ||
      metadata.contentType !== file.type
    ) {
      throw new Error(
        "An existing upload does not match this edit. " +
        "Start a new edit operation."
      )
    }

    // Already uploaded during the same operation.
    return storageRef.fullPath
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code

    // Only a missing object allows a new upload.
    if (code !== "storage/object-not-found") {
      throw error
    }
  }

  await uploadBytes(storageRef, file, {
    contentType: file.type,
  })

  return storageRef.fullPath
}

function validateRequestId(requestId: string) {
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(requestId)) {
    throw new Error("Invalid edit request ID.")
  }
}

function validateRecipeEditInput(payload: RecipeEditPayload) {
  validateRequestId(payload.requestId)

  if (!payload.recipeId.trim()) {
    throw new Error("Recipe ID is required.")
  }

  if (
    !Array.isArray(payload.steps) || !Array.isArray(payload.ingredients)
  ) {
    throw new Error("Invalid recipe ingredients or steps.")
  }

  if (!payload.imageFile && !payload.existingImageFileName) {
    throw new Error(
      "The main image has no Storage path. " +
      "Please select an image before saving."
    )
  }

  if (payload.imageFile) {
    validateImageFile(payload.imageFile)
  }

  for (const step of payload.steps) {
    if (step.image) {
      validateImageFile(step.image)
    }
  }
}

export async function saveRecipeEdit(
  payload: RecipeEditPayload,
  options: SaveRecipeEditOptions = {}
): Promise<FinalizeEditResponse> {
  validateRecipeEditInput(payload)

  const userId = auth.currentUser?.uid

  if (!userId) {
    throw new Error("You must sign in to edit a recipe.")
  }

  const { recipeId, requestId } = payload

  if (options.prepared) {
    const prepared = options.prepared

    if (
      prepared.recipeId !== recipeId ||
      prepared.requestId !== requestId ||
      (
        options.reservation &&
        options.reservation.day !== prepared.day
      )
    ) {
      throw new Error(
        "Prepared edit does not match the current operation."
      )
    }

    return completePreparedEdit(prepared)
  }

  // 1. Reserve an edit operation.
  let reservation = options.reservation

  if (!reservation) {
    const response = await beginRecipeEdit({
        recipeId,
        requestId,
    })

    reservation = response.data
    options.onReservation?.(reservation)
  }

  if (
    reservation.requestId !== requestId ||
    reservation.recipeId !== recipeId
  ) {
    throw new Error("Invalid edit reservation response.")
  }

  if (
    !reservation.uploadPrefix.startsWith(
      `recipe_edit_uploads/${userId}/${requestId}/`
    )
  ) {
    throw new Error("Invalid edit upload session.")
  }

  // 2. Keep the existing main image unless a new image was selected.
  let mainImagePath = normalizeExistingPath(
    payload.existingImageFileName,
    "recipe_images"
  )

  if (payload.imageFile) {
    const path =
      `${reservation.uploadPrefix}main/` +
      `${requestId}.${getExtension(payload.imageFile)}`

    mainImagePath = await uploadEditImage(
      payload.imageFile,
      path
    )
  }

  if (!mainImagePath) {
    throw new Error("Main image path is missing.")
  }

  // 3. Upload new step images, preserving unchanged ones.
  const steps = await Promise.all(
    payload.steps.map(async (step, index) => {
      let imagePath = normalizeExistingPath(
        step.existingImageFileName,
        "cooking_steps_images"
      )

      if (step.image) {
        const path =
          `${reservation.uploadPrefix}steps/${index}/` +
          `${requestId}.${getExtension(step.image)}`

        imagePath = await uploadEditImage(
          step.image,
          path
        )
      }

      return {
        title: step.title?.trim() || "",
        description: step.description.trim(),
        imagePath,
      }
    })
  )

  // 4. Build the exact payload expected by finalizeRecipeEdit.
  const recipe: FinalizeRecipeData = {
    title: payload.title.trim(),
    description: payload.description.trim(),
    cuisine: payload.cuisine.trim().toLowerCase(),
    durationMinutes: Number(payload.duration),
    servings: Number(payload.servings),
    difficulty: payload.difficulty.toLowerCase(),
    meal: payload.meal.toLowerCase(),
    visibility: payload.visibility,
    imagePath: mainImagePath,

    ingredients: payload.ingredients.map((item) => ({
      ingredient: item.ingredient.trim(),
      quantity: item.quantity.trim(),
      unit: item.unit.trim(),
    })),

    steps,
  }

  // 5. Finalize atomically on the backend.
  const prepared: PreparedRecipeEdit = {
    recipeId,
    requestId,
    day: reservation.day,
    recipe,
  }

  // Save the exact payload before the network request.
  // If the response is lost, the same payload is reused.
  options.onPrepared?.(prepared)

  return completePreparedEdit(prepared)
}