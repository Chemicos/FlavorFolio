import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  writeBatch,
} from "@firebase/firestore"
import { db, storage } from "../../../firebase-config"
import type { AdminRecipeDetails, AdminRecipeListItem, AdminRecipeStatus } from "../types/adminRecipes.types"
import { deleteObject, ref } from "firebase/storage"

function getDateMs(value: any) {
  if (!value) return 0
  if (typeof value?.toDate === "function") return value.toDate().getTime()
  if (typeof value?.seconds === "number") return value.seconds * 1000
  return 0
}

function normalizeStatus(value: unknown): AdminRecipeStatus {
  if (value === "pending") return "pending"
  if (value === "needs_revision") return "needs_revision"
  return "published"
}

function mapAdminRecipeListItem(
  documentId: string,
  data: any
): AdminRecipeListItem {
  const stats = data.stats || {}

  return {
    recipeId: data.recipeId || documentId,
    title: data.title || "Untitled recipe",
    image: data.image || "",

    authorUsername:
      data.author?.username ||
      data.user ||
      "Unknown",

    authorProfileImage:
      data.author?.profileImage ||
      data.authorProfileImage ||
      "",

    userId: data.userId || "",

    status: normalizeStatus(data.status),

    visibility:
      data.visibility === "private"
        ? "private"
        : "public",

    meal: data.meal || "-",
    cuisine: data.cuisine || "-",
    difficulty: data.difficulty || "-",
    savesCount: Number(stats.savesCount || 0),
    commentsCount: Number(stats.commentsCount || 0),
    averageRating: Number(stats.averageRating || 0),

    updatedAtMs:
      getDateMs(
        data.updatedAt ||
        data.createdAt
      ),
  }
}

function mapAdminRecipeDetails(
  documentId: string,
  data: any
): AdminRecipeDetails {
  return {
    ...mapAdminRecipeListItem(
      documentId,
      data
    ),

    description: data.description || "",
    durationMinutes: Number(data.durationMinutes || 0),
    servings: Number(data.servings || 0),

    ingredients:
      Array.isArray(data.ingredients)
        ? data.ingredients.map(
            (ingredient: any) => ({
              ingredient:
                ingredient?.ingredient || "",
              quantity:
                ingredient?.quantity || "",
              unit:
                ingredient?.unit || "",
            })
          )
        : [],

    cookingSteps:
      Array.isArray(data.cookingSteps)
        ? data.cookingSteps.map(
            (step: any) => ({
              title: step?.title || "",

              description: step?.description || "",

              image: step?.image || "",

              imageUrl:
                step?.imageUrl ||
                step?.image ||
                "",
            })
          )
        : [],
  }
}

// export async function fetchAdminRecipes(): Promise<AdminRecipeRow[]> {
//   const recipesQuery = query(
//     collection(db, "recipes"),
//     orderBy("updatedAt", "desc"),
//     limit(100)
//   )

//   const snapshot = await getDocs(recipesQuery)

//   return snapshot.docs.map((docSnap) => {
//     const data = docSnap.data()
//     const stats = data.stats || {}

//     return {
//       recipeId: data.recipeId || docSnap.id,
//       title: data.title || "Untitled recipe",
//       image: data.image || "",
//       authorUsername: data.author?.username || data.user || "Unknown",
//       authorProfileImage: data.author?.profileImage || data.authorProfileImage || "",
//       userId: data.userId || "",
//       status: normalizeStatus(data.status),
//       visibility: data.visibility || "public",
//       meal: data.meal || "-",
//       cuisine: data.cuisine || "-",
//       difficulty: data.difficulty || "-",
//       durationMinutes: Number(data.durationMinutes || 0),
//       savesCount: Number(stats.savesCount || 0),
//       commentsCount: Number(stats.commentsCount || 0),
//       averageRating: Number(stats.averageRating || 0),
//       updatedAtMs: getDateMs(data.updatedAt || data.createdAt),
//       description: data.description || "",
//       servings: Number(data.servings || 0),
//       ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
//       cookingSteps: Array.isArray(data.cookingSteps)
//         ? data.cookingSteps.map((step: any) => ({
//             title: step.title || "",
//             description: step.description || "",
//             image: step.image || "",
//             imageUrl: step.imageUrl || step.image || "",
//             }))
//         : [],
//     }
//   })
// }

export async function fetchAdminRecipes(): Promise<AdminRecipeListItem[]> {
  const recipesQuery = query(
    collection(db, "recipes"),
    orderBy("updatedAt", "desc"),
    limit(100)
  )

  const snapshot = await getDocs(recipesQuery)

  return snapshot.docs.map(
    (docSnap) =>
      mapAdminRecipeListItem(
        docSnap.id,
        docSnap.data()
      )
  )
}

export async function fetchAdminRecipeDetails(recipeId: string): Promise<AdminRecipeDetails | null> {
  const recipeRef = doc(db, "recipes", recipeId)

  const snapshot = await getDoc(recipeRef)

  if (!snapshot.exists()) {
    return null
  }

  return mapAdminRecipeDetails(
    snapshot.id,
    snapshot.data()
  )
}

async function deleteStorageFile(path: string) {
  try {
    await deleteObject(ref(storage, path))
  } catch (error: any) {
    if (error?.code === "storage/object-not-found") return
    console.error(`Failed to delete storage file: ${path}`, error)
  }
}

export async function deleteAdminRecipes(recipeIds: string[]) {
  const deleteTasks: Promise<void>[] = []

  for (const recipeId of recipeIds) {
    const recipeRef = doc(db, "recipes", recipeId)
    const recipeSnap = await getDoc(recipeRef)

    if (!recipeSnap.exists()) continue

    const data = recipeSnap.data()

    if (data.imageFileName) {
      deleteTasks.push(deleteStorageFile(`recipe_images/${data.imageFileName}`))
    }

    const steps = Array.isArray(data.cookingSteps) ? data.cookingSteps : []

    steps.forEach((step) => {
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