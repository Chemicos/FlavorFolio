export type AdminRecipeStatus = "published" | "pending" | "needs_revision"

export interface AdminRecipeIngredient {
  ingredient: string
  quantity: string
  unit: string
}

export interface AdminRecipeStep {
  title?: string
  description: string
  image?: string
  imageUrl?: string
}

export interface AdminRecipeRow {
  recipeId: string
  title: string
  image: string
  description: string
  authorUsername: string
  authorProfileImage: string
  userId: string
  status: AdminRecipeStatus
  visibility: "public" | "private"
  meal: string
  cuisine: string
  difficulty: string
  durationMinutes: number
  servings: number
  savesCount: number
  commentsCount: number
  averageRating: number
  updatedAtMs: number
  ingredients: AdminRecipeIngredient[]
  cookingSteps: AdminRecipeStep[]
}