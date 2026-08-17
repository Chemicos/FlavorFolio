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

export function sortByNewest(recipes: Recipe[]) {
  return [...recipes].sort((a, b) => {
    const aDate = a?.publishedAt?.seconds || 0
    const bDate = b?.publishedAt?.seconds || 0
    return bDate - aDate
  })
}