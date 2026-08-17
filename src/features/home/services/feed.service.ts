import { collection, documentId, getDocs, limit, onSnapshot, orderBy, query, QueryDocumentSnapshot, where } from "@firebase/firestore"
import { Recipe } from "../types"
import { db } from "../../../firebase-config"

const FIRESTORE_IN_LIMIT = 30
const FOLLOWING_RECIPES_LIMIT_PER_GROUP = 40
const RECOMMENDATION_CANDIDATES_LIMIT = 100

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function mapRecipeDoc(
  docSnap: QueryDocumentSnapshot
): Recipe {
  const data = docSnap.data()

  return {
    ...(data as Recipe),
    id: docSnap.id,
    recipeId: data.recipeId || docSnap.id,
  }
}

function sortRecipesByCreatedAt(
  recipes: Recipe[]
): Recipe[] {
  return [...recipes].sort((firstRecipe, secondRecipe) => {
    const firstCreatedAt =
      firstRecipe.createdAt?.seconds ?? 0

    const secondCreatedAt =
      secondRecipe.createdAt?.seconds ?? 0

    return secondCreatedAt - firstCreatedAt
  })
}

export function subscribeToFollowingUserIds({
  currentUserId,
  onChange,
  onError,
}: {
  currentUserId: string
  onChange: (userIds: string[]) => void
  onError: (error: Error) => void
}) {
  const followingRef = collection( db, "users", currentUserId, "following" )

  return onSnapshot(
    followingRef,
    (snapshot) => {
      const userIds = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data()

          return String(data.userId || docSnap.id)
        })
        .filter(Boolean)

      onChange([...new Set(userIds)])
    },
    onError
  )
}

export function subscribeToFollowingRecipes({
  followingUserIds,
  onChange,
  onError,
}: {
  followingUserIds: string[]
  onChange: (recipes: Recipe[]) => void
  onError: (error: Error) => void
}) {
  if (!followingUserIds.length) {
    onChange([])
    return () => undefined
  }

  const userIdGroups = chunkArray(
    followingUserIds,
    FIRESTORE_IN_LIMIT
  )

  const recipesByGroup = new Map<number, Recipe[]>()

  const emitMergedRecipes = () => {
    const recipesById = new Map<string, Recipe>()

    recipesByGroup.forEach((groupRecipes) => {
      groupRecipes.forEach((recipe) => {
        const recipeId = recipe.recipeId || recipe.id

        if (recipeId) {
          recipesById.set(recipeId, recipe)
        }
      })
    })

    onChange(
      sortRecipesByCreatedAt(
        Array.from(recipesById.values())
      )
    )
  }

  const unsubscribers = userIdGroups.map(
    (userIdGroup, groupIndex) => {
      const followingRecipesQuery = query(
        collection(db, "recipes"),
        where("userId", "in", userIdGroup),
        where("status", "==", "published"),
        where("visibility", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(FOLLOWING_RECIPES_LIMIT_PER_GROUP)
      )

      return onSnapshot(
        followingRecipesQuery,
        (snapshot) => {
          recipesByGroup.set(
            groupIndex,
            snapshot.docs.map(mapRecipeDoc)
          )

          emitMergedRecipes()
        },
        onError
      )
    }
  )

  return () => {
    unsubscribers.forEach((unsubscribe) =>
      unsubscribe()
    )
  }
}

export async function fetchRecommendationCandidates(): Promise<
  Recipe[]
> {
  const candidatesQuery = query(
    collection(db, "recipes"),
    where("status", "==", "published"),
    where("visibility", "==", "public"),
    orderBy("createdAt", "desc"),
    limit(RECOMMENDATION_CANDIDATES_LIMIT)
  )

  const snapshot = await getDocs(candidatesQuery)

  return snapshot.docs.map(mapRecipeDoc)
}

export async function fetchRecipesByIds(
  recipeIds: string[]
): Promise<Recipe[]> {
  const uniqueRecipeIds = [...new Set(recipeIds)].filter(Boolean)

  if (!uniqueRecipeIds.length) return []

  const recipeIdGroups = chunkArray(
    uniqueRecipeIds,
    FIRESTORE_IN_LIMIT
  )

  const snapshots = await Promise.all(
    recipeIdGroups.map((recipeIdGroup) =>
      getDocs(
        query(
          collection(db, "recipes"),
          where(documentId(), "in", recipeIdGroup)
        )
      )
    )
  )

  return snapshots.flatMap((snapshot) =>
    snapshot.docs.map(mapRecipeDoc)
  )
}