import { resolveStorageImage } from "../../../utils/resolveStorageItems"
import { Recipe } from "../types"

export async function resolveRecipeImages(
  recipe: Recipe
): Promise<Recipe> {
  const [image, cookingSteps] = await Promise.all([
    resolveStorageImage(recipe.image),

    Promise.all(
      (recipe.cookingSteps ?? []).map(async (step) => ({
        ...step,
        image: await resolveStorageImage(step.image),
      }))
    ),
  ])

  return {
    ...recipe,
    image,
    cookingSteps,
  }
}