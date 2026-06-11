export interface PostRecipeIngredient {
    id: string
    ingredient: string
    quantity: string
    unit: string
}

export interface PostRecipeStep {
    id: string
    title?: string
    description: string
    image?: File | null
    imagePreview?: string
    existingImageUrl?: string
    existingImageFileName?: string | null
}

export interface PostRecipeStepDraft {
  title: string
  description: string
  image?: File | null
  imagePreview?: string
}

export interface PostRecipeIngredient {
  id: string
  ingredient: string
  quantity: string
  unit: string
}

export interface PostRecipeFormData {
    title: string
    description: string
    cuisine: string
    duration: string
    servings: string
    ingredients: PostRecipeIngredient[]
    steps: PostRecipeStep[]
    coverImage?: File | null
    coverImagePreview?: string
}
