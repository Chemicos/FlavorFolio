import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from "@firebase/firestore";
import { AdminDashboardMealItem, AdminDashboardModerationActivity, AdminDashboardStats, AdminDashboardTopRecipe, RecipeStatus } from "../types/adminDashboard.types";
import { db } from "../../../firebase-config";

const RECIPE_STATUSES: RecipeStatus[] = [
    "published",
    "pending",
    "needs_revision"
]

function mapDateMs(value: any) {
  if (!value) return 0
  if (typeof value?.toDate === "function") return value.toDate().getTime()
  if (typeof value?.seconds === "number") return value.seconds * 1000
  return 0
}

async function getCollectionCount(path: string) {
    const snapshot = await getCountFromServer(collection(db, path))
    return snapshot.data().count
}

async function getRecipeCountByStatus(status: RecipeStatus) {
  const recipesQuery = query(
    collection(db, "recipes"),
    where("status", "==", status)
  )

  const snapshot = await getCountFromServer(recipesQuery)
  return snapshot.data().count
}

function normalizeMeal(value: unknown) {
  const meal = String(value || "Other").trim()
  return meal || "Other"
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [
    totalUsers,
    totalRecipes,
    publishedRecipes,
    pendingRecipes,
    needsRevisionRecipes,
    // draftRecipes,
  ] = await Promise.all([
    getCollectionCount("users"),
    getCollectionCount("recipes"),
    getRecipeCountByStatus("published"),
    getRecipeCountByStatus("pending"),
    getRecipeCountByStatus("needs_revision"),
    // getRecipeCountByStatus("draft"),
  ])

  const topRecipesQuery = query(
    collection(db, "recipes"),
    orderBy("stats.savesCount", "desc"),
    limit(5)
  )

  const recipesSnapshot = await getDocs(topRecipesQuery)

  let totalSaves = 0
  let totalComments = 0
  let totalRatingsSum = 0
  let totalRatingsCount = 0

  const mealMap = new Map<string, number>()
  const topSavedRecipes: AdminDashboardTopRecipe[] = []

  recipesSnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data()
    const stats = data.stats || {}

    topSavedRecipes.push({
      recipeId: data.recipeId || docSnap.id,
      title: data.title || "Untitled recipe",
      image: data.image || "",
      authorUsername: data.author?.username || "Unknown",
      savesCount: Number(stats.savesCount || 0),
    })
  })

  const allRecipesSnapshot = await getDocs(collection(db, "recipes"))
  const recipesForTimeline: { createdAtMs: number }[] = []

  allRecipesSnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data()
    const stats = data.stats || {}

    totalSaves += Number(stats.savesCount || 0)
    totalComments += Number(stats.commentsCount || 0)
    totalRatingsSum += Number(stats.ratingsSum || 0)
    totalRatingsCount += Number(stats.ratingsCount || 0)

    const meal = normalizeMeal(data.meal)
    mealMap.set(meal, (mealMap.get(meal) || 0) + 1)

    recipesForTimeline.push({
        createdAtMs: getDateMs(data.createdAt || data.updatedAt),
    })
  })

  const mealDistribution: AdminDashboardMealItem[] = Array.from(mealMap.entries())
    .map(([meal, value]) => ({ meal, value }))
    .sort((a, b) => b.value - a.value)

  const averageRating = totalRatingsCount
    ? totalRatingsSum / totalRatingsCount
    : 0

    function getDateMs(value: any) {
        if (!value) return 0
        if (typeof value?.toDate === "function") return value.toDate().getTime()
        if (typeof value?.seconds === "number") return value.seconds * 1000
        return 0
    }

    function formatChartDate(date: Date) {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
        })
    }

    function buildRecipesOverTime(
        recipes: { createdAtMs: number }[],
        daysCount = 30
    ) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const buckets = new Map<string, number>()

        for (let index = daysCount - 1; index >= 0; index -= 1) {
            const date = new Date(today)
            date.setDate(today.getDate() - index)

            buckets.set(formatChartDate(date), 0)
        }

        recipes.forEach((recipe) => {
            if (!recipe.createdAtMs) return

            const date = new Date(recipe.createdAtMs)
            date.setHours(0, 0, 0, 0)

            const diffDays = Math.floor(
            (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
            )

            if (diffDays < 0 || diffDays >= daysCount) return

            const label = formatChartDate(date)
            buckets.set(label, (buckets.get(label) || 0) + 1)
        })

        return Array.from(buckets.entries()).map(([label, recipes]) => ({
            label,
            recipes,
        }))
    }

    const moderationActivityQuery = query(
        collection(db, "adminModerationActivity"),
        orderBy("createdAt", "desc"),
        limit(5)
    )

    const moderationActivitySnapshot = await getDocs(moderationActivityQuery)

    const recentModerationActivity: AdminDashboardModerationActivity[] =
    moderationActivitySnapshot.docs.map((docSnap) => {
        const data = docSnap.data()

        return {
            id: docSnap.id,
            type: data.type || "approved",
            recipeId: data.recipeId || "",
            recipeTitle: data.recipeTitle || "Untitled recipe",
            adminUserId: data.adminUserId || "",
            adminUsername: data.adminUsername || "Admin",
            createdAtMs: mapDateMs(data.createdAt),
        }
    })

  return {
    totalUsers,
    totalRecipes,
    pendingRecipes,
    needsRevisionRecipes,
    publishedRecipes,
    totalSaves,
    totalComments,
    averageRating,
    statusDistribution: [
      { status: "published", label: "Published", value: publishedRecipes },
      { status: "pending", label: "Pending Review", value: pendingRecipes },
      { status: "needs_revision", label: "Needs Revision", value: needsRevisionRecipes },
    //   { status: "draft", label: "Draft", value: draftRecipes },
    ],
    mealDistribution,
    topSavedRecipes,
    recipesOverTime: buildRecipesOverTime(recipesForTimeline, 30),
    recipeTimelineSource: recipesForTimeline,
    recentModerationActivity,
  }
}