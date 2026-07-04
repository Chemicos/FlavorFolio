export type RecipeStatus = "pending" | "published" | "needs_revision" 

export interface AdminMetricCardData {
  id: string
  label: string
  value: number
  helper?: string
}

export type AdminDashboardTimeRange = "30d" | "90d" | "1y" | "all"
export interface AdminDashboardRecipeTimelineSource {
  createdAtMs: number
}

export interface AdminDashboardActivityItem {
  label: string
  recipes: number
}

export interface AdminDashboardStatusItem {
  status: RecipeStatus
  label: string
  value: number
}

export interface AdminDashboardMealItem {
  meal: string
  value: number
}

export interface AdminDashboardTopRecipe {
  recipeId: string
  title: string
  image: string
  authorUsername: string
  savesCount: number
}

export interface AdminDashboardModerationActivity {
  id: string
  type: "approved" | "needs_revision" | "resubmitted"
  recipeId: string
  recipeTitle: string
  adminUserId: string
  adminUsername: string
  createdAtMs: number
}

export interface AdminDashboardStats {
  totalUsers: number
  totalRecipes: number
  pendingRecipes: number
  needsRevisionRecipes: number
  publishedRecipes: number
  totalSaves: number
  totalComments: number
  averageRating: number
  statusDistribution: AdminDashboardStatusItem[]
  mealDistribution: AdminDashboardMealItem[]
  topSavedRecipes: AdminDashboardTopRecipe[]
  recipesOverTime: AdminDashboardActivityItem[]
  recipeTimelineSource: AdminDashboardRecipeTimelineSource[]
  recentModerationActivity: AdminDashboardModerationActivity[]
}