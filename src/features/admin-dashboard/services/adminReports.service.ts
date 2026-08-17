import { collection, collectionGroup, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, Timestamp, where } from "@firebase/firestore"
import { auth, db } from "../../../firebase-config"
import { AdminReportsCommunityStats, AdminReportsFlavorInsight, AdminReportsFoodStats, AdminReportsOverviewStats, AdminReportsSeasonalStats, AdminReportsTopSavedRecipe } from "../types/adminReports.types"

function getDateThirtyDaysAgo() {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  date.setHours(0, 0, 0, 0)

  return Timestamp.fromDate(date)
}

function normalizeText(value: unknown, fallback = "Unknown") {
  const text = String(value || "").trim()
  return text || fallback
}

function getDateMs(value: any) {
  if (!value) return 0
  if (typeof value?.toDate === "function") return value.toDate().getTime()
  if (typeof value?.seconds === "number") return value.seconds * 1000
  if (value instanceof Date) return value.getTime()

  return 0
}

function incrementMap(map: Map<string, number>, key: string) {
  const normalized = toTitleCase(String(key || "").trim().toLowerCase())
  if (!normalized) return

  map.set(normalized, (map.get(normalized) || 0) + 1)
}

function mapToSortedItems(map: Map<string, number>, limitCount?: number) {
  const items = Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return typeof limitCount === "number" ? items.slice(0, limitCount) : items
}

function normalizeIngredient(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

async function getCollectionCount(path: string) {
  const snapshot = await getCountFromServer(collection(db, path))
  return snapshot.data().count
}

async function getCountByCreatedAt(path: string) {
  const countQuery = query(
    collection(db, path),
    where("createdAt", ">=", getDateThirtyDaysAgo())
  )

  const snapshot = await getCountFromServer(countQuery)
  return snapshot.data().count
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  })
}

function buildLastMonths(count = 12) {
  const today = new Date()
  today.setDate(1)
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: count }).map((_, index) => {
    const date = new Date(today)
    date.setMonth(today.getMonth() - (count - 1 - index))

    return {
      key: getMonthKey(date),
      label: getMonthLabel(date),
      recipes: 0,
      users: 0,
      saves: 0,
      comments: 0,
    }
  })
}

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

function getSeasonByMonth(monthIndex: number): AdminReportsSeasonalStats["seasonalGroups"][number]["season"] {
  if ([11, 0, 1].includes(monthIndex)) return "Winter"
  if ([2, 3, 4].includes(monthIndex)) return "Spring"
  if ([5, 6, 7].includes(monthIndex)) return "Summer"
  return "Autumn"
}

function getTopItemsFromMap(map: Map<string, number>, limitCount = 4) {
  return Array.from(map.entries())
    .map(([ingredient, count]) => ({ ingredient, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limitCount)
}

function buildFlavorInsights({
  topCuisine,
  topIngredient,
  topMeal,
  publishedRecipesPercent,
}: {
  topCuisine: string
  topIngredient: string
  topMeal: string
  publishedRecipesPercent: number
}): AdminReportsFlavorInsight[] {
  const insights: AdminReportsFlavorInsight[] = []

  if (topCuisine) {
    insights.push({
      id: "top-cuisine",
      type: "cuisine",
      target: "top-cuisines",
      text: `${topCuisine} cuisine is currently the most represented cuisine on FlavorFolio.`,
    })
  }

  if (topIngredient) {
    insights.push({
      id: "top-ingredient",
      type: "ingredient",
      target: "top-ingredients",
      text: `${topIngredient} is one of the most frequently used ingredients across published recipes.`,
    })
  }

  if (topMeal) {
    insights.push({
      id: "top-meal-engagement",
      type: "engagement",
      target: "meal-types",
      text: `${topMeal} recipes currently generate strong engagement across saves and comments.`,
    })
  }

  insights.push({
    id: "published-ratio",
    type: "growth",
    text: `${publishedRecipesPercent.toFixed(1)}% of all submitted recipes are currently published.`,
  })

  return insights
}

export async function fetchAdminReportsOverview(): Promise<AdminReportsOverviewStats> {
  const [
    totalUsers,
    totalRecipes,
    publishedRecipes,
    newUsers30d,
    newRecipes30d,
  ] = await Promise.all([
    getCollectionCount("users"),
    getCollectionCount("recipes"),
    getCountFromServer(
      query(collection(db, "recipes"), where("status", "==", "published"))
    ).then((snapshot) => snapshot.data().count),
    getCountByCreatedAt("users"),
    getCountByCreatedAt("recipes"),
  ])

  const topSavedQuery = query(
    collection(db, "recipes"),
    orderBy("stats.savesCount", "desc"),
    limit(5)
  )

  const [allRecipesSnapshot, topSavedSnapshot] = await Promise.all([
    getDocs(collection(db, "recipes")),
    getDocs(topSavedQuery),
  ])

  let totalComments = 0
  let totalSaves = 0
  let ratingsSum = 0
  let ratingsCount = 0

  const cuisineMap = new Map<string, number>()
  const ingredientMap = new Map<string, number>()
  const mealEngagementMap = new Map<string, number>()

  allRecipesSnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data()
    const stats = data.stats || {}

    const commentsCount = Number(stats.commentsCount || 0)
    const savesCount = Number(stats.savesCount || 0)
    const recipeRatingsSum = Number(stats.ratingsSum || 0)
    const recipeRatingsCount = Number(stats.ratingsCount || 0)

    totalComments += commentsCount
    totalSaves += savesCount
    ratingsSum += recipeRatingsSum
    ratingsCount += recipeRatingsCount

    const cuisine = normalizeText(data.cuisine, "")
    if (cuisine) {
      const normalizedCuisine = toTitleCase(cuisine.toLowerCase())
      cuisineMap.set(
        normalizedCuisine,
        (cuisineMap.get(normalizedCuisine) || 0) + 1
      )
    }

    const meal = normalizeText(data.meal, "")
    if (meal) {
      const normalizedMeal = toTitleCase(meal.toLowerCase())
      mealEngagementMap.set(
        normalizedMeal,
        (mealEngagementMap.get(normalizedMeal) || 0) +
          commentsCount +
          savesCount
      )
    }

    const ingredients = Array.isArray(data.ingredients) ? data.ingredients : []

    ingredients.forEach((item) => {
      const ingredient = normalizeIngredient(item?.ingredient)

      if (!ingredient) return

      const label = toTitleCase(ingredient)

      ingredientMap.set(label, (ingredientMap.get(label) || 0) + 1)
    })
  })

  const topSavedRecipes: AdminReportsTopSavedRecipe[] =
    topSavedSnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      const stats = data.stats || {}

      return {
        recipeId: data.recipeId || docSnap.id,
        title: data.title || "Untitled recipe",
        image: data.image || "",
        authorUsername: data.author?.username || data.user || "Unknown",
        savesCount: Number(stats.savesCount || 0),
      }
    })

  const topCuisine =
    Array.from(cuisineMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || ""

  const topIngredient =
    Array.from(ingredientMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    ""

  const topMeal =
    Array.from(mealEngagementMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    ""

  const averageRating = ratingsCount ? ratingsSum / ratingsCount : 0

  const publishedRecipesPercent = totalRecipes
    ? (publishedRecipes / totalRecipes) * 100
    : 0

  return {
    totalUsers,
    totalRecipes,
    totalComments,
    totalSaves,
    averageRating,
    newUsers30d,
    newRecipes30d,
    publishedRecipesPercent,
    topSavedRecipes,
    flavorInsights: buildFlavorInsights({
      topCuisine,
      topIngredient,
      topMeal,
      publishedRecipesPercent,
    }),
  }
}

export async function fetchAdminReportsCommunity(): Promise<AdminReportsCommunityStats> {
  const buckets = buildLastMonths(12)
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  const [recipesSnapshot, usersSnapshot, savedRecipesSnapshot, commentsSnapshot] =
    await Promise.all([
      getDocs(collection(db, "recipes")),
      getDocs(collection(db, "users")),
      getDocs(collectionGroup(db, "savedRecipes")),
      getDocs(collectionGroup(db, "comments")),
    ])

  recipesSnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data()
    const createdAtMs = getDateMs(data.createdAt || data.publishedAt || data.updatedAt)
    if (!createdAtMs) return

    const key = getMonthKey(new Date(createdAtMs))
    const bucket = bucketMap.get(key)
    if (bucket) bucket.recipes += 1
  })

  usersSnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data()
    const createdAtMs = getDateMs(data.createdAt)
    if (!createdAtMs) return

    const key = getMonthKey(new Date(createdAtMs))
    const bucket = bucketMap.get(key)
    if (bucket) bucket.users += 1
  })

  savedRecipesSnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data()
    const createdAtMs = getDateMs(data.createdAt || data.savedAt)
    if (!createdAtMs) return

    const key = getMonthKey(new Date(createdAtMs))
    const bucket = bucketMap.get(key)
    if (bucket) bucket.saves += 1
  })

  commentsSnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data()
    const createdAtMs = getDateMs(data.createdAt)
    if (!createdAtMs) return

    const key = getMonthKey(new Date(createdAtMs))
    const bucket = bucketMap.get(key)
    if (bucket) bucket.comments += 1
  })

  return {
    monthlyActivity: buckets.map(({ key, ...bucket }) => bucket),
  }
}

export async function fetchAdminReportsFood(): Promise<AdminReportsFoodStats> {
  const snapshot = await getDocs(collection(db, "recipes"))

  const cuisineMap = new Map<string, number>()
  const mealMap = new Map<string, number>()
  const difficultyMap = new Map<string, number>()
  const ingredientMap = new Map<string, number>()

  const cookingTimeBuckets = {
    under15: 0,
    from15To30: 0,
    from30To60: 0,
    over60: 0,
  }

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data()

    incrementMap(cuisineMap, data.cuisine || "Unknown")
    incrementMap(mealMap, data.meal || "Other")
    incrementMap(difficultyMap, data.difficulty || "Unknown")

    const duration = Number(data.durationMinutes || 0)

    if (duration < 15) {
      cookingTimeBuckets.under15 += 1
    } else if (duration <= 30) {
      cookingTimeBuckets.from15To30 += 1
    } else if (duration <= 60) {
      cookingTimeBuckets.from30To60 += 1
    } else {
      cookingTimeBuckets.over60 += 1
    }

    const ingredients = Array.isArray(data.ingredients) ? data.ingredients : []

    ingredients.forEach((item) => {
      incrementMap(ingredientMap, item?.ingredient)
    })
  })

  return {
    topCuisines: mapToSortedItems(cuisineMap, 8),
    mealTypes: mapToSortedItems(mealMap),
    difficultyDistribution: mapToSortedItems(difficultyMap),
    cookingTimeDistribution: [
      { label: "< 15 min", value: cookingTimeBuckets.under15 },
      { label: "15 - 30 min", value: cookingTimeBuckets.from15To30 },
      { label: "30 - 60 min", value: cookingTimeBuckets.from30To60 },
      { label: "60+ min", value: cookingTimeBuckets.over60 },
    ],
    topIngredients: mapToSortedItems(ingredientMap, 20),
  }
}

export async function fetchAdminReportsSeasonal(): Promise<AdminReportsSeasonalStats> {
  const snapshot = await getDocs(collection(db, "recipes"))

  const monthlyIngredientMaps = Array.from(
    { length: 12 },
    () => new Map<string, number>()
  )

  const seasonalIngredientMaps = {
    Winter: new Map<string, number>(),
    Spring: new Map<string, number>(),
    Summer: new Map<string, number>(),
    Autumn: new Map<string, number>(),
  }

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data()

    const createdAtMs = getDateMs(
      data.publishedAt || data.createdAt || data.updatedAt
    )

    if (!createdAtMs) return

    const date = new Date(createdAtMs)
    const monthIndex = date.getMonth()
    const season = getSeasonByMonth(monthIndex)

    const ingredients = Array.isArray(data.ingredients) ? data.ingredients : []

    ingredients.forEach((item) => {
      const rawIngredient = normalizeIngredient(item?.ingredient)
      if (!rawIngredient) return

      const ingredient = toTitleCase(rawIngredient)

      const monthlyMap = monthlyIngredientMaps[monthIndex]

      if (monthlyMap) {
        monthlyMap.set(ingredient, (monthlyMap.get(ingredient) || 0) + 1)
      }

      const seasonalMap = seasonalIngredientMaps[season]
      seasonalMap.set(ingredient, (seasonalMap.get(ingredient) || 0) + 1)
    })
  })

  const topIngredientByMonth = monthlyIngredientMaps.map((map, index) => {
    const topIngredient = getTopItemsFromMap(map, 1)[0]

    return {
      month: MONTH_LABELS[index] ?? `Month ${index + 1}`,
      ingredient: topIngredient?.ingredient || "No data",
      count: topIngredient?.count || 0,
    }
  })

  return {
    topIngredientByMonth,
    seasonalGroups: [
      {
        season: "Winter",
        ingredients: getTopItemsFromMap(seasonalIngredientMaps.Winter),
      },
      {
        season: "Spring",
        ingredients: getTopItemsFromMap(seasonalIngredientMaps.Spring),
      },
      {
        season: "Summer",
        ingredients: getTopItemsFromMap(seasonalIngredientMaps.Summer),
      },
      {
        season: "Autumn",
        ingredients: getTopItemsFromMap(seasonalIngredientMaps.Autumn),
      },
    ],
  }
}

export async function getCurrentAdminDisplayName() {
  const user = auth.currentUser

  if (!user) return "Admin"

  const userSnap = await getDoc(doc(db, "users", user.uid))

  if (!userSnap.exists()) {
    return user.displayName || user.email || "Admin"
  }

  const data = userSnap.data()

  return (
    data.username ||
    [data.firstName, data.lastName].filter(Boolean).join(" ") ||
    user.displayName ||
    user.email ||
    "Admin"
  )
}