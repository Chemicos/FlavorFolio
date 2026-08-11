import { ReviewRecipe } from "../../recipe-review/types/recipeReview.types"

export type NeedsRevisionRecipe = ReviewRecipe

export type RevisionStatus = "needs_revision"

export interface DenialFeedback {
  reason?: string
  reasonLabel?: string
  message?: string
  createdAt?: {
    seconds: number
    nanoseconds: number
  }
}