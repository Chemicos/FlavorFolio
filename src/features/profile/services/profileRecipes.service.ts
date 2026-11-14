import { deleteObject, ref } from "firebase/storage"
import { ProfileRecipeGridItem, ProfileRecipeStatus } from "../components/ProfileRecipeGrid"
import { db, functions, storage } from "../../../firebase-config"
import { collection, deleteDoc, doc, documentId, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "@firebase/firestore"
import { Recipe } from "../../home/types"
import { resolveStorageImage } from "../../../utils/resolveStorageItems"
import { resolveRecipeImages } from "../../home/utils/resolveRecipeImages"
import { httpsCallable } from "firebase/functions"

export interface ProfileRecipeDocument {
  id?: string
  recipeId?: string
  title: string
  image: string
  imageFileName?: string
  meal: string
  difficulty: string
  durationMinutes: number
  cuisine?: string
  status: ProfileRecipeStatus
  userId: string
  createdAt?: unknown
  updatedAt?: unknown
  cookingSteps?: Array<{
    image?: string | null
    imageFileName?: string | null
  }>
  stats?: {
    averageRating?: number
    commentsCount?: number
    savesCount?: number
  }
}

async function deleteStorageFile(path: string) {
  try {
    await deleteObject(ref(storage, path))
  } catch (error: any) {
    if (error?.code === "storage/object-not-found") return
    console.error(`Failed to delete storage file: ${path}`, error)
  }
}

function getDateMs(value: any) {
  if (!value) return 0

  if (typeof value?.toDate === "function") {
    return value.toDate().getTime()
  }

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000
  }

  return 0
}

export async function fetchProfileRecipeById(recipeId: string): Promise<Recipe> {
  if (!recipeId) {
    throw new Error("Recipe id is required.")
  }

  const recipeRef = doc(db, "recipes", recipeId)
  const recipeSnap = await getDoc(recipeRef)

  if (!recipeSnap.exists()) {
    throw new Error("Recipe not found.")
  }

  return resolveRecipeImages({
    ...recipeSnap.data(),
    recipeId: recipeSnap.id,
    id: recipeSnap.id,
  } as Recipe)
}

function mapProfileRecipe(docId: string, data: ProfileRecipeDocument): ProfileRecipeGridItem {
  return {
    id: data.recipeId || docId,
    userId: data.userId || "",
    title: data.title || "Untitled recipe",
    image: data.image || "",
    meal: data.meal || "Meal",
    difficulty: data.difficulty || "Easy",
    durationMinutes: Number(data.durationMinutes || 0),
    category: data.meal || data.cuisine || "all",
    status: data.status,
    rating: Number(data.stats?.averageRating || 0),
    commentsCount: Number(data.stats?.commentsCount || 0),
    savesCount: Number(data.stats?.savesCount || 0),
    createdAt: String(getDateMs(data.createdAt || data.updatedAt)),
  }
}

async function mapResolvedProfileRecipe(
  docId: string,
  data: ProfileRecipeDocument
): Promise<ProfileRecipeGridItem> {
  const recipe = mapProfileRecipe(docId, data)

  return {
    ...recipe,
    image: await resolveStorageImage(recipe.image),
  }
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

export async function fetchMySavedProfileRecipes(
  userId: string
): Promise<ProfileRecipeGridItem[]> {
  if (!userId) {
    throw new Error("User id is required.")
  }

  const savedRecipesRef = collection(db, "users", userId, "savedRecipes")
  const savedRecipesSnapshot = await getDocs(savedRecipesRef)

  const savedRecipeIds = savedRecipesSnapshot.docs.map((docSnap) => docSnap.id)

  if (savedRecipeIds.length === 0) return []

  const chunks = chunkArray(savedRecipeIds, 10)
  const recipes: ProfileRecipeGridItem[] = []

  for (const chunk of chunks) {
    const recipesQuery = query(
      collection(db, "recipes"),
      where(documentId(), "in", chunk)
    )

    const snapshot = await getDocs(recipesQuery)

    const resolvedRecipes = await Promise.all(
      snapshot.docs.map((docSnap) =>
        mapResolvedProfileRecipe(
          docSnap.id,
          docSnap.data() as ProfileRecipeDocument
        )
      )
    )

    recipes.push(...resolvedRecipes)
  }

  return recipes
}

export async function fetchMyProfileRecipes(userId: string): Promise<ProfileRecipeGridItem[]> {
  if (!userId) {
    throw new Error("User id is required.")
  }

  const recipesQuery = query(
    collection(db, "recipes"),
    where("userId", "==", userId),
    where("status", "in", ["published", "pending", "needs_revision"]),
    orderBy("updatedAt", "desc"),
    limit(80)
  )

  const snapshot = await getDocs(recipesQuery)

  return Promise.all(
    snapshot.docs.map((docSnap) =>
      mapResolvedProfileRecipe(
        docSnap.id,
        docSnap.data() as ProfileRecipeDocument
      )
    )
  )
}

export async function deleteProfileRecipe(recipeId: string) {
  if (!recipeId) {
    throw new Error("Recipe id is required.")
  }

  const recipeRef = doc(db, "recipes", recipeId)
  const recipeSnap = await getDoc(recipeRef)

  if (!recipeSnap.exists()) return

  const recipeData = recipeSnap.data() as ProfileRecipeDocument
  const deleteTasks: Promise<void>[] = []

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

  await Promise.all(deleteTasks)
  await deleteDoc(recipeRef)
}

// export async function resubmitProfileRecipe(recipeId: string) {
//   if (!recipeId) {
//     throw new Error("Recipe id is required.")
//   }

//   await updateDoc(doc(db, "recipes", recipeId), {
//     status: "pending",
//     updatedAt: serverTimestamp(),
//     "moderation.submittedAt": serverTimestamp(),
//     "moderation.reviewedAt": null,
//     "moderation.reviewedBy": null,
//   })
// }

const submitRecipeRevisionCallable = httpsCallable<
  { recipeId: string; requestId: string },
  {
    recipeId: string
    status: "pending"
    alreadyCompleted: boolean
  }
>(functions, "submitRecipeRevision")

export async function resubmitProfileRecipe(
  recipeId: string,
  requestId: string = crypto.randomUUID()
): Promise<void> {
  await submitRecipeRevisionCallable({
    recipeId,
    requestId,
  })
}

export async function setProfileRecipeVisibility({
  recipeId,
  visibility,
}: {
  recipeId: string
  visibility: "public" | "private"
}) {
  if (!recipeId) {
    throw new Error("Recipe id is required.")
  }

  await updateDoc(doc(db, "recipes", recipeId), {
    visibility,
    updatedAt: serverTimestamp(),
  })
}

// export function subscribeToMyProfileRecipes(
//   userId: string,
//   onChange: (recipes: ProfileRecipeGridItem[]) => void,
//   onError: (error: Error) => void
// ) {
//   const recipesQuery = query(
//     collection(db, "recipes"),
//     where("userId", "==", userId),
//     where("status", "in", ["published", "pending", "needs_revision", "draft"]),
//     orderBy("updatedAt", "desc"),
//     limit(80)
//   )

//   return onSnapshot(
//     recipesQuery,
//     (snapshot) => {
//       onChange(
//         snapshot.docs.map((docSnap) =>
//           mapProfileRecipe(docSnap.id, docSnap.data() as ProfileRecipeDocument)
//         )
//       )
//     },
//     onError
//   )
// }

export function subscribeToMyProfileRecipes(
  userId: string,
  onChange: (recipes: ProfileRecipeGridItem[]) => void,
  onError: (error: Error) => void
) {
  const recipesQuery = query(
    collection(db, "recipes"),
    where("userId", "==", userId),
    where("status", "in", [
      "published",
      "pending",
      "needs_revision",
      "draft",
    ]),
    orderBy("updatedAt", "desc"),
    limit(80)
  )

  let isActive = true
  let snapshotVersion = 0

  const unsubscribe = onSnapshot(
    recipesQuery,
    (snapshot) => {
      const currentVersion = ++snapshotVersion

      Promise.all(
        snapshot.docs.map((docSnap) =>
          mapResolvedProfileRecipe(
            docSnap.id,
            docSnap.data() as ProfileRecipeDocument
          )
        )
      )
        .then((resolvedRecipes) => {
          if (
            !isActive ||
            currentVersion !== snapshotVersion
          ) {
            return
          }

          onChange(resolvedRecipes)
        })
        .catch((error: unknown) => {
          if (
            !isActive ||
            currentVersion !== snapshotVersion
          ) {
            return
          }

          onError(
            error instanceof Error
              ? error
              : new Error("Failed to resolve profile images.")
          )
        })
    },
    onError
  )

  return () => {
    isActive = false
    snapshotVersion++
    unsubscribe()
  }
}

// export function subscribeToMySavedProfileRecipes(
//   userId: string,
//   onChange: (recipes: ProfileRecipeGridItem[]) => void,
//   onError: (error: Error) => void
// ) {
//   const savedRecipesRef = collection(db, "users", userId, "savedRecipes")

//   return onSnapshot(
//     savedRecipesRef,
//     async () => {
//       try {
//         const savedRecipes = await fetchMySavedProfileRecipes(userId)
//         onChange(savedRecipes)
//       } catch (error) {
//         onError(error as Error)
//       }
//     },
//     onError
//   )
// }

export function subscribeToMySavedProfileRecipes(
  userId: string,
  onChange: (recipes: ProfileRecipeGridItem[]) => void,
  onError: (error: Error) => void
) {
  const savedRecipesRef = collection(
    db,
    "users",
    userId,
    "savedRecipes"
  )

  let isActive = true
  let snapshotVersion = 0

  const unsubscribe = onSnapshot(
    savedRecipesRef,
    () => {
      const currentVersion = ++snapshotVersion

      fetchMySavedProfileRecipes(userId)
        .then((recipes) => {
          if (
            !isActive ||
            currentVersion !== snapshotVersion
          ) return

          onChange(recipes)
        })
        .catch((error: unknown) => {
          if (
            !isActive ||
            currentVersion !== snapshotVersion
          ) return

          onError(
            error instanceof Error
              ? error
              : new Error("Failed to load saved recipes.")
          )
        })
    },
    onError
  )

  return () => {
    isActive = false
    snapshotVersion++
    unsubscribe()
  }
}

// export function subscribeToProfileRecipeById(
//   recipeId: string,
//   onChange: (recipe: Recipe | null) => void,
//   onError: (error: Error) => void
// ) {
//   const recipeRef = doc(db, "recipes", recipeId)

//   return onSnapshot(
//     recipeRef,
//     (snapshot) => {
//       if (!snapshot.exists()) {
//         onChange(null)
//         return
//       }

//       onChange({
//         recipeId: snapshot.id,
//         id: snapshot.id,
//         ...snapshot.data(),
//       } as Recipe)
//     },
//     onError
//   )
// }

export function subscribeToProfileRecipeById(
  recipeId: string,
  onChange: (recipe: Recipe | null) => void,
  onError: (error: Error) => void
) {
  const recipeRef = doc(db, "recipes", recipeId)

  let isActive = true
  let snapshotVersion = 0

  const unsubscribe = onSnapshot(
    recipeRef,
    (snapshot) => {
      const currentVersion = ++snapshotVersion

      if (!snapshot.exists()) {
        onChange(null)
        return
      }

      const recipe = {
        ...snapshot.data(),
        recipeId: snapshot.id,
        id: snapshot.id,
      } as Recipe

      resolveRecipeImages(recipe)
        .then((resolvedRecipe) => {
          if (
            !isActive ||
            currentVersion !== snapshotVersion
          ) {
            return
          }

          onChange(resolvedRecipe)
        })
        .catch((error: unknown) => {
          if (
            !isActive ||
            currentVersion !== snapshotVersion
          ) {
            return
          }

          onError(
            error instanceof Error
              ? error
              : new Error("Failed to resolve recipe images.")
          )
        })
    },
    onError
  )

  return () => {
    isActive = false
    snapshotVersion++
    unsubscribe()
  }
}