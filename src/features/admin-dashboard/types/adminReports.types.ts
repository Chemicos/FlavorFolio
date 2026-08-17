export interface AdminReportsMetric {
  id: string
  label: string
  value: string
  helper: string
}

export interface AdminReportsMonthlyActivityItem {
  label: string
  recipes: number
  users: number
  saves: number
  comments: number
}

export type AdminReportsInsightTarget =
  | "top-cuisines"
  | "top-ingredients"
  | "meal-types"

export interface AdminReportsFlavorInsight {
  id: string
  text: string
  type: "cuisine" | "ingredient" | "engagement" | "growth"
  target?: AdminReportsInsightTarget
}

export interface AdminReportsCommunityStats {
  monthlyActivity: AdminReportsMonthlyActivityItem[]
}

export interface AdminReportsTopSavedRecipe {
  recipeId: string
  title: string
  image: string
  authorUsername: string
  savesCount: number
}

export interface AdminReportsFoodChartItem {
  name: string
  value: number
}

export interface AdminReportsCookingTimeBucket {
  label: string
  value: number
}

export interface AdminReportsFoodStats {
  topCuisines: AdminReportsFoodChartItem[]
  mealTypes: AdminReportsFoodChartItem[]
  difficultyDistribution: AdminReportsFoodChartItem[]
  cookingTimeDistribution: AdminReportsCookingTimeBucket[]
  topIngredients: AdminReportsFoodChartItem[]
}

export interface AdminReportsSeasonalMonthIngredient {
  month: string
  ingredient: string
  count: number
}

export interface AdminReportsSeasonGroup {
  season: "Winter" | "Spring" | "Summer" | "Autumn"
  ingredients: {
    ingredient: string
    count: number
  }[]
}

export interface AdminReportsSeasonalStats {
  topIngredientByMonth: AdminReportsSeasonalMonthIngredient[]
  seasonalGroups: AdminReportsSeasonGroup[]
}

export interface AdminReportsOverviewStats {
  totalUsers: number
  totalRecipes: number
  totalComments: number
  totalSaves: number
  averageRating: number
  newUsers30d: number
  newRecipes30d: number
  publishedRecipesPercent: number
  topSavedRecipes: AdminReportsTopSavedRecipe[]
  flavorInsights: AdminReportsFlavorInsight[]
}