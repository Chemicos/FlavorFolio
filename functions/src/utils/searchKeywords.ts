type KeywordIngredient =
  | string
  | {
      ingredient?: string
      name?: string
      title?: string
    }

export interface RecipeKeywordInput {
  title?: string
  description?: string
  cuisine?: string
  meal?: string
  difficulty?: string
  authorUsername?: string
  user?: string
  ingredients?: KeywordIngredient[]
}

function normalize(value: unknown): string[] {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2)
}

export function buildRecipeKeywords(recipe: RecipeKeywordInput): string[] {
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.flatMap((ingredient) =>
        normalize(
          typeof ingredient === "string"
            ? ingredient
            : ingredient.ingredient ??
                ingredient.name ??
                ingredient.title ??
                ingredient
        )
      )
    : []

  return Array.from(
    new Set([
      ...normalize(recipe.title),
      ...normalize(recipe.description),
      ...normalize(recipe.cuisine),
      ...normalize(recipe.meal),
      ...normalize(recipe.difficulty),
      ...normalize(recipe.authorUsername),
      ...normalize(recipe.user),
      ...ingredients,
    ])
  ).slice(0, 100)
}