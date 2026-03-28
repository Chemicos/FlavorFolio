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

export interface RecipePublishedAt {
    seconds?: number
}

export interface Recipe {
    id?: string
    recipeId: string
    title?: string
    image?: string
    userId?: string
    status?: string
    visibility?: string
    ingredients?: RecipeIngredient[]
    publishedAt?: RecipePublishedAt
    author?: RecipeAuthor
    stats?: RecipeStats
}

export interface SavedRecipe {
    id?: string
    recipeId?: string
}