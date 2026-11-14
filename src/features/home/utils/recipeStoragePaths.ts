export type RecipeImageType = "main" | "step"

const LEGACY_DIRECTORIES = {
  main: "recipe_images",
  step: "cooking_steps_images",
} as const

export function resolveRecipeStoragePath(
  value: unknown,
  type: RecipeImageType
): string | null {
  if (typeof value !== "string") return null

  const path = value.trim()
  if (!path) return null

  // New structure: complete Storage path
  if (path.startsWith("recipe_uploads/")) {
    const segments = path.split("/")

    const isValidStructure =
      segments.length === 5 &&
      segments[1] !== "" &&
      segments[2] !== "" &&
      segments[3] === "main" &&
      type === "main"

    const isValidStepStructure =
      segments.length === 6 &&
      segments[1] !== "" &&
      segments[2] !== "" &&
      segments[3] === "steps" &&
      /^\d+$/.test(segments[4]) &&
      type === "step"

    if (isValidStructure || isValidStepStructure) {
      return path
    }

    return null
  }

  // Legacy structure: filename only
  if (
    path.includes("/") ||
    path.includes("\\") ||
    path === "." ||
    path === ".."
  ) {
    return null
  }

  return `${LEGACY_DIRECTORIES[type]}/${path}`
}