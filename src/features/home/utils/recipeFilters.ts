import { RecipeFilters } from "../components/FilterDrawer"
import { Recipe, SavedRecipe } from "../types"

export function matchesDurationFilter(
  durationMinutes: number | undefined,
  selectedDurations: string[]
) {
  if (!selectedDurations.length) return true
  if (typeof durationMinutes !== "number") return false

  return selectedDurations.some((duration) => {
    switch (duration) {
      case "under30":
        return durationMinutes < 30
      case "30to60":
        return durationMinutes >= 30 && durationMinutes <= 60
      case "over60":
        return durationMinutes > 60
      default:
        return false
    }
  })
}

export function matchesDifficultyFilter(
  recipeDifficulty: string | undefined,
  selectedDifficulties: string[]
) {
  if (!selectedDifficulties.length) return true
  if (!recipeDifficulty) return false

  const normalizedDifficulty = recipeDifficulty.trim().toLowerCase()
  return selectedDifficulties.includes(normalizedDifficulty)
}

export function matchesMealFilter(
  recipeMeal: string | undefined,
  selectedMeals: string[]
) {
  if (!selectedMeals.length) return true
  if (!recipeMeal) return false

  const normalizedMeal = recipeMeal.trim().toLowerCase()
  return selectedMeals.includes(normalizedMeal)
}


export function matchesRatingFilter(
  averageRating: number | undefined,
  selectedRatings: number[]
) {
  if (!selectedRatings.length) return true
  if (typeof averageRating !== "number") return false

  return selectedRatings.some((ratingThreshold) => averageRating >= ratingThreshold)
}

export function matchesServingsFilter(
  servings: number | undefined,
  selectedServings: string[]
) {
  if (!selectedServings.length) return true
  if (typeof servings !== "number") return false

  return selectedServings.some((range) => {
    switch (range) {
      case "1to2":
        return servings >= 1 && servings <= 2
      case "3to4":
        return servings >= 3 && servings <= 4
      case "5plus":
        return servings >= 5
      default:
        return false
    }
  })
}

export function matchesCuisineFilter(
  recipeCuisine: string | undefined,
  selectedCuisine: string[]
) {
  if (!selectedCuisine.length) return true
  if (!recipeCuisine) return false

  const normalizedCuisine = recipeCuisine.trim().toLowerCase()
  return selectedCuisine.includes(normalizedCuisine)
}

export function matchesSavedFilter(
  recipeId: string | undefined,
  filters: RecipeFilters,
  savedRecipes: SavedRecipe[],
  currentUserId: string | null
) {
  if (!filters.saved.onlySavedByMe) return true
  if (!currentUserId) return false
  if (!recipeId) return false

  return savedRecipes.some((savedRecipe) => {
    if (typeof savedRecipe === "string") return savedRecipe === recipeId
    if (savedRecipe?.recipeId) return savedRecipe.recipeId === recipeId
    if (savedRecipe?.id) return savedRecipe.id === recipeId
    return false
  })
}

export function matchesMostSavedFilter(recipe: Recipe, filters: RecipeFilters) {
  if (!filters.saved.mostSaved) return true

  const savesCount = Number(recipe.stats?.savesCount || 0)
  return savesCount > 0
}

export function applyRecipeFilters(
  recipe: Recipe,
  filters: RecipeFilters,
  savedRecipes: SavedRecipe[],
  currentUserId: string | null
) {
  return (
    matchesDurationFilter(recipe.durationMinutes, filters.durations) &&
    matchesDifficultyFilter(recipe.difficulty, filters.difficulties) &&
    matchesCuisineFilter(recipe.cuisine, filters.cuisines) &&
    matchesMealFilter(recipe.meal, filters.meals) &&
    matchesRatingFilter(recipe.stats?.averageRating, filters.ratings) &&
    matchesServingsFilter(recipe.servings, filters.servings) &&
    matchesSavedFilter(recipe.recipeId, filters, savedRecipes, currentUserId) &&
    matchesMostSavedFilter(recipe, filters)
  )
}

export function getAvailableCuisines(recipes: Recipe[]) {
  return [
    ...new Set(
      recipes
        .map((recipe) => recipe.cuisine?.trim().toLowerCase())
        .filter((cuisine): cuisine is string => Boolean(cuisine))
    ),
  ].sort((a, b) => a.localeCompare(b))
}