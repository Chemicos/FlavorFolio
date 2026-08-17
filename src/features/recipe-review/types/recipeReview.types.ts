import { Recipe } from "../../home/types"

export type ReviewRecipe = Recipe

export interface PendingRecipesResult {
  recipes: ReviewRecipe[]
  isLoading: boolean
  error: string | null
}