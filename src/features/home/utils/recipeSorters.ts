import { Recipe } from "../types"

export function sortByMostSaved(recipes: Recipe[]) {
  return [...recipes].sort((a, b) => {
    const aSaves = Number(a?.stats?.savesCount || 0)
    const bSaves = Number(b?.stats?.savesCount || 0)

    if (bSaves !== aSaves) return bSaves - aSaves

    const aComments = Number(a?.stats?.commentsCount || 0)
    const bComments = Number(b?.stats?.commentsCount || 0)

    return bComments - aComments
  })
}

export function sortForYou(recipes: Recipe[]) {
  return [...recipes].sort((a, b) => {
    const aScore = Number(a?.stats?.averageRating || 0)
    const bScore = Number(b?.stats?.averageRating || 0)
    return bScore - aScore
  })
}

export function sortTrending(recipes: Recipe[]) {
  return [...recipes].sort((a, b) => {
    const aSaves = Number(a?.stats?.savesCount || 0)
    const bSaves = Number(b?.stats?.savesCount || 0)

    if (bSaves !== aSaves) return bSaves - aSaves

    const aComments = Number(a?.stats?.commentsCount || 0)
    const bComments = Number(b?.stats?.commentsCount || 0)

    return bComments - aComments
  })
}

function getRecipePublishedTime(recipe: Recipe) {
  return (
    recipe.publishedAt?.seconds ??
    recipe.createdAt?.seconds ??
    0
  )
}

export function sortByNewest(recipes: Recipe[]) {
  return [...recipes].sort((a, b) => {
    return getRecipePublishedTime(b) - getRecipePublishedTime(a)
  })
}