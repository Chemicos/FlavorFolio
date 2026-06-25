import { deleteObject, ref } from "firebase/storage"
import { ProfileRecipeGridItem, ProfileRecipeStatus } from "../components/ProfileRecipeGrid"
import { db, storage } from "../../../firebase-config"
import { collection, deleteDoc, doc, documentId, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "@firebase/firestore"
import { Recipe } from "../../home/types"

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

  return {
    recipeId: recipeSnap.id,
    id: recipeSnap.id,
    ...recipeSnap.data(),
  } as Recipe
}

function mapProfileRecipe(docId: string, data: ProfileRecipeDocument): ProfileRecipeGridItem {
  return {
    id: data.recipeId || docId,
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

    snapshot.docs.forEach((docSnap) => {
      recipes.push(
        mapProfileRecipe(docSnap.id, docSnap.data() as ProfileRecipeDocument)
      )
    })
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

  return snapshot.docs.map((docSnap) =>
    mapProfileRecipe(docSnap.id, docSnap.data() as ProfileRecipeDocument)
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

export async function resubmitProfileRecipe(recipeId: string) {
  if (!recipeId) {
    throw new Error("Recipe id is required.")
  }

  await updateDoc(doc(db, "recipes", recipeId), {
    status: "pending",
    updatedAt: serverTimestamp(),
    "moderation.submittedAt": serverTimestamp(),
    "moderation.reviewedAt": null,
    "moderation.reviewedBy": null,
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