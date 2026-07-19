import { Recipe } from "../types"

export interface RecipePreferenceProfile {
  cuisines: Map<string, number>
  meals: Map<string, number>
  ingredients: Map<string, number>
}

function normalizeValue(value?: string | null) {
  return value?.trim().toLowerCase() || ""
}

function incrementWeight(
  map: Map<string, number>,
  value: string,
  weight: number
) {
  const normalizedValue = normalizeValue(value)

  if (!normalizedValue) return

  map.set(
    normalizedValue,
    (map.get(normalizedValue) || 0) + weight
  )
}

export function buildRecipePreferenceProfile(
  interactionRecipes: Recipe[]
): RecipePreferenceProfile {
  const profile: RecipePreferenceProfile = {
    cuisines: new Map(),
    meals: new Map(),
    ingredients: new Map(),
  }

  interactionRecipes.forEach((recipe) => {
    incrementWeight(
      profile.cuisines,
      recipe.cuisine || "",
      3
    )

    incrementWeight(
      profile.meals,
      recipe.meal || "",
      2
    )

    recipe.ingredients?.forEach((ingredient) => {
      incrementWeight(
        profile.ingredients,
        ingredient.ingredient || "",
        1
      )
    })
  })

  return profile
}

function getTimestampSeconds(
  createdAt: Recipe["createdAt"]
) {
  return createdAt?.seconds ?? 0
}

function getRecencyScore(recipe: Recipe) {
  const createdAtSeconds = getTimestampSeconds(
    recipe.createdAt
  )

  if (!createdAtSeconds) return 0

  const ageInDays =
    (Date.now() / 1000 - createdAtSeconds) /
    (60 * 60 * 24)

  if (ageInDays <= 3) return 3
  if (ageInDays <= 7) return 2
  if (ageInDays <= 30) return 1

  return 0
}

function getQualityScore(recipe: Recipe) {
  const averageRating = Number(
    recipe.stats?.averageRating || 0
  )

  const ratingsCount = Number(
    recipe.stats?.ratingsCount || 0
  )

  const savesCount = Number(
    recipe.stats?.savesCount || 0
  )

  const ratingConfidence =
    ratingsCount > 0
      ? Math.min(3, Math.log2(ratingsCount + 1))
      : 0

  const ratingScore =
    averageRating > 0
      ? (averageRating / 5) * ratingConfidence
      : 0

  const savesScore = Math.min(
    3,
    Math.log10(savesCount + 1)
  )

  return ratingScore + savesScore
}

export function calculateRecipeRecommendationScore({
  recipe,
  preferenceProfile,
  followingUserIds,
  savedRecipeIds,
  currentUserId,
}: {
  recipe: Recipe
  preferenceProfile: RecipePreferenceProfile
  followingUserIds: Set<string>
  savedRecipeIds: Set<string>
  currentUserId: string | null
}) {
  const recipeId = recipe.recipeId || recipe.id || ""
  const authorId = recipe.userId || ""

  let score = 0

  if (
    recipe.cuisine &&
    preferenceProfile.cuisines.has(
      normalizeValue(recipe.cuisine)
    )
  ) {
    score +=
      preferenceProfile.cuisines.get(
        normalizeValue(recipe.cuisine)
      ) || 0
  }

  if (
    recipe.meal &&
    preferenceProfile.meals.has(
      normalizeValue(recipe.meal)
    )
  ) {
    score +=
      preferenceProfile.meals.get(
        normalizeValue(recipe.meal)
      ) || 0
  }

  const matchedIngredients = new Set<string>()

  recipe.ingredients?.forEach((ingredient) => {
    const normalizedIngredient = normalizeValue(
      ingredient.ingredient
    )

    if (
      normalizedIngredient &&
      preferenceProfile.ingredients.has(
        normalizedIngredient
      )
    ) {
      matchedIngredients.add(normalizedIngredient)
    }
  })

  matchedIngredients.forEach((ingredient) => {
    score += Math.min(
      2,
      preferenceProfile.ingredients.get(ingredient) || 0
    )
  })

  score += getQualityScore(recipe)
  score += getRecencyScore(recipe)

  if (authorId && followingUserIds.has(authorId)) {
    score += 1.5
  }

  if (savedRecipeIds.has(recipeId)) {
    score -= 4
  }


  if (currentUserId && authorId === currentUserId) {
    score -= 6
  }

  return score
}

export function sortRecipesForYou({
  recipes,
  preferenceProfile,
  followingUserIds,
  savedRecipeIds,
  currentUserId,
}: {
  recipes: Recipe[]
  preferenceProfile: RecipePreferenceProfile
  followingUserIds: string[]
  savedRecipeIds: string[]
  currentUserId: string | null
}) {
  const followingSet = new Set(followingUserIds)
  const savedSet = new Set(savedRecipeIds)

  return [...recipes]
    .map((recipe) => ({
      recipe,
      score: calculateRecipeRecommendationScore({
        recipe,
        preferenceProfile,
        followingUserIds: followingSet,
        savedRecipeIds: savedSet,
        currentUserId,
      }),
    }))
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score
      }

      return (
        getTimestampSeconds(second.recipe.createdAt) -
        getTimestampSeconds(first.recipe.createdAt)
      )
    })
    .map(({ recipe }) => recipe)
}