import { UserProfile } from "firebase/auth"
import { Recipe } from "../features/home/types/recipe.types"

function normalize(value: unknown): string[] {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2)
}

export function buildRecipeKeywords(recipe: Partial<Recipe>): string[] {
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.flatMap((ingredient: any) =>
        normalize(
          ingredient.ingredient ??
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

export function buildUserKeywords(user: Partial<UserProfile>): string[] {
  return Array.from(
    new Set([
      ...normalize(user.username),
      ...normalize(user.firstName),
      ...normalize(user.lastName),
      ...normalize(user.email),
    ])
  ).slice(0, 100)
}