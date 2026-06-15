export interface RecipeReviewFilters {
  difficulties: string[]
  cuisines: string[]
  meals: string[]
  durations: string[]
  servings: string[]
  steps: string[]
}

export const defaultRecipeReviewFilters: RecipeReviewFilters = {
  difficulties: [],
  cuisines: [],
  meals: [],
  durations: [],
  servings: [],
  steps: [],
}