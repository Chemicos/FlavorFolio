import { collection, getAggregateFromServer, getCountFromServer, getDocs, limit, orderBy, query, sum, where } from "@firebase/firestore";
import { AdminDashboardMealItem, AdminDashboardModerationActivity, AdminDashboardStats, AdminDashboardTopRecipe, RecipeStatus } from "../types/adminDashboard.types";
import { db } from "../../../firebase-config";

// const RECIPE_STATUSES: RecipeStatus[] = [
//     "published",
//     "pending",
//     "needs_revision"
// ]

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

async function getCollectionCount(path: string) {
  const snapshot = await getCountFromServer(
    collection(db, path)
  )

  return snapshot.data().count
}

async function getRecipeCountByStatus(
  status: RecipeStatus
) {
  const recipesQuery = query(
    collection(db, "recipes"),
    where("status", "==", status)
  )

  const snapshot =
    await getCountFromServer(recipesQuery)

  return snapshot.data().count
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const recipesRef = collection(db, "recipes")

  const [
    totalUsers,
    totalRecipes,
    publishedRecipes,
    pendingRecipes,
    needsRevisionRecipes,
    recipeStatsSnapshot,
  ] = await Promise.all([
    getCollectionCount("users"),
    getCollectionCount("recipes"),

    getRecipeCountByStatus("published"),
    getRecipeCountByStatus("pending"),
    getRecipeCountByStatus("needs_revision"),

    getAggregateFromServer(recipesRef, {
      totalSaves: sum("stats.savesCount"),
      totalComments: sum("stats.commentsCount"),
      totalRatingsSum: sum("stats.ratingsSum"),
      totalRatingsCount: sum("stats.ratingsCount"),
    }),
  ])

  const aggregatedStats =
    recipeStatsSnapshot.data()

  const totalSaves =
    Number(aggregatedStats.totalSaves || 0)

  const totalComments =
    Number(aggregatedStats.totalComments || 0)

  const totalRatingsSum =
    Number(aggregatedStats.totalRatingsSum || 0)

  const totalRatingsCount =
    Number(aggregatedStats.totalRatingsCount || 0)

  const averageRating =
    totalRatingsCount > 0
      ? totalRatingsSum / totalRatingsCount
      : 0

  const topRecipesQuery = query(
    recipesRef,
    orderBy("stats.savesCount", "desc"),
    limit(5)
  )

  const moderationActivityQuery = query(
    collection(db, "adminModerationActivity"),
    orderBy("createdAt", "desc"),
    limit(5)
  )

  const [
    topRecipesSnapshot,
    timelineSnapshot,
    moderationActivitySnapshot,
  ] = await Promise.all([
    getDocs(topRecipesQuery),
    getDocs(recipesRef),
    getDocs(moderationActivityQuery),
  ])

  const topSavedRecipes: AdminDashboardTopRecipe[] =
    topRecipesSnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      const stats = data.stats || {}

      return {
        recipeId:
          data.recipeId || docSnap.id,

        title:
          data.title || "Untitled recipe",

        image:
          data.image || "",

        authorUsername:
          data.author?.username ||
          data.user ||
          "Unknown",

        savesCount:
          Number(stats.savesCount || 0),
      }
    })

  const recipeTimelineSource =
    timelineSnapshot.docs
      .map((docSnap) => {
        const data = docSnap.data()

        return {
          createdAtMs: getDateMs(
            data.createdAt || data.updatedAt
          ),
        }
      })
      .filter(
        (item) => item.createdAtMs > 0
      )

  const recentModerationActivity: AdminDashboardModerationActivity[] =
    moderationActivitySnapshot.docs.map(
      (docSnap) => {
        const data = docSnap.data()

        return {
          id: docSnap.id,

          type:
            data.type || "approved",

          recipeId:
            data.recipeId || "",

          recipeTitle:
            data.recipeTitle ||
            "Untitled recipe",

          adminUserId:
            data.adminUserId || "",

          adminUsername:
            data.adminUsername ||
            "Admin",

          createdAtMs:
            getDateMs(data.createdAt),
        }
      }
    )

  return {
    totalUsers,
    totalRecipes,

    publishedRecipes,
    pendingRecipes,
    needsRevisionRecipes,

    totalSaves,
    totalComments,
    averageRating,

    statusDistribution: [
      {
        status: "published",
        label: "Published",
        value: publishedRecipes,
      },
      {
        status: "pending",
        label: "Pending Review",
        value: pendingRecipes,
      },
      {
        status: "needs_revision",
        label: "Needs Revision",
        value: needsRevisionRecipes,
      },
    ],

    topSavedRecipes,

    recipeTimelineSource,

    recentModerationActivity,
  }
}