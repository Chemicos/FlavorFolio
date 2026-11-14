export type RecipeImageType = "main" | "step"

type RecipeImageReference = {
  imageFileName?: string | null
  cookingSteps?: Array<{
    imageFileName?: string | null
  }>
}

export function resolveRecipeImagePath(
  value: unknown,
  type: RecipeImageType
): string | null {
  if (typeof value !== "string") return null

  const path = value.trim()
  if (!path) return null

  if (path.startsWith("recipe_uploads/")) {
    const validMain =
      /^recipe_uploads\/[^/]+\/[^/]+\/main\/[^/]+$/

    const validStep =
      /^recipe_uploads\/[^/]+\/[^/]+\/steps\/\d+\/[^/]+$/

    return (
      type === "main"
        ? validMain.test(path)
        : validStep.test(path)
    )
      ? path
      : null
  }

  if (
    path.includes("/") ||
    path.includes("\\") ||
    path === "." ||
    path === ".."
  ) {
    return null
  }

  const directory =
    type === "main"
      ? "recipe_images"
      : "cooking_steps_images"

  return `${directory}/${path}`
}

export function collectRecipeImagePaths(
  recipe: RecipeImageReference
): Set<string> {
  const paths = new Set<string>()

  const mainPath = resolveRecipeImagePath(
    recipe.imageFileName,
    "main"
  )

  if (mainPath) paths.add(mainPath)

  for (const step of recipe.cookingSteps ?? []) {
    const stepPath = resolveRecipeImagePath(
      step.imageFileName,
      "step"
    )

    if (stepPath) paths.add(stepPath)
  }

  return paths
}

export function findRemovedRecipeImages(
  previous: RecipeImageReference,
  next: RecipeImageReference
): string[] {
  const previousPaths = collectRecipeImagePaths(previous)
  const nextPaths = collectRecipeImagePaths(next)

  return [...previousPaths].filter(
    (path) => !nextPaths.has(path)
  )
}