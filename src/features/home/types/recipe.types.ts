export interface RecipeAuthor {
    username?: string
    profileImage?: string
    followersCount?: number
}

export interface RecipeStats {
    averageRating?: number
    ratingsCount?: number
    ratingsSum?: number
    commentsCount?: number
    savesCount?: number
}

export interface RecipeIngredient {
    ingredient: string
    quantity?: string | number
    unit?: string
}

export interface RecipeCookingSteps {
    title?: string
    description?: string
    imageUrl?: string
    image?: string | null
    error?: boolean
}

export interface RecipePublishedAt {
    seconds?: number
}

export interface Recipe {
    id?: string
    recipeId: string
    title?: string
    image?: string
    description?: string
    durationMinutes?: number
    difficulty?: string
    meal?: string
    servings?: number
    cuisine?: string
    userId?: string
    status?: string
    visibility?: string
    ingredients?: RecipeIngredient[]
    cookingSteps?: RecipeCookingSteps[]
    publishedAt?: RecipePublishedAt
    author?: RecipeAuthor
    stats?: RecipeStats
}

export interface SavedRecipe {
    id?: string
    recipeId?: string
}