import { useCallback, useEffect, useMemo, useState } from "react"
import { RecipeFilters } from "../components/FilterDrawer"
import { Recipe, SavedRecipe } from "../types"
import type { CurrentUserCardData } from "../types/recipeCard.types"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { collection, doc, DocumentSnapshot, getDoc, getDocs, limit, onSnapshot, orderBy, query, startAfter, where } from "firebase/firestore"
import { db } from "../../../firebase-config"
import { applyRecipeFilters, getAvailableCuisines } from "../utils/recipeFilters"
import { sortByMostSaved, sortByNewest, sortForYou, sortTrending } from "../utils/recipeSorters"

interface UseHomeDataParams {
  activeTab: string
  filters: RecipeFilters
}
const PAGE_SIZE = 20

export function useHomeData({ activeTab, filters }: UseHomeDataParams) {

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [lastRecipeDoc, setLastRecipeDoc] = useState<DocumentSnapshot | null>(null)
  const [hasMoreRecipes, setHasMoreRecipes] = useState(true)
  const [isFetchingMoreRecipes, setIsFetchingMoreRecipes] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [authorFollowersCountMap, setAuthorFollowersCountMap] = useState<Record<string, number>>({})
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([])
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    username: string
    profileImage: string
  } | null>(null)
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUserId(null)
        setCurrentUserProfile(null)
        return
      }

      setCurrentUserId(user.uid)

      try {
        const userRef = doc(db, "users", user.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const userData = userSnap.data()

          setCurrentUserProfile({
            username: userData?.username || user.displayName || "",
            profileImage: userData?.profileImage || user.photoURL || "",
          })
        } else {
          setCurrentUserProfile({
            username: user.displayName || "",
            profileImage: user.photoURL || "",
          })
        }
      } catch (error) {
        console.error("Failed to fetch current user profile:", error)

        setCurrentUserProfile({
          username: user.displayName || "",
          profileImage: user.photoURL || "",
        })
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    setIsFiltering(true)

    const timeout = window.setTimeout(() => {
      setIsFiltering(false)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [activeTab, filters])

  const buildRecipesQuery = (cursor?: DocumentSnapshot | null) => {
    const constraints = [
      where("status", "==", "published"),
      where("visibility", "==", "public"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE),
    ]

    return cursor
      ? query(collection(db, "recipes"), ...constraints, startAfter(cursor))
      : query(collection(db, "recipes"), ...constraints)
  }

  const mapRecipeDocs = (docs: DocumentSnapshot[]) => {
    return docs.map((docSnap) => ({
      id: docSnap.id,
      recipeId: docSnap.id,
      ...docSnap.data(),
    })) as Recipe[]
  }

  const fetchInitialRecipes = useCallback(async () => {
    setIsLoading(true)

    try {
      const snapshot = await getDocs(buildRecipesQuery())

      setRecipes(mapRecipeDocs(snapshot.docs))
      setLastRecipeDoc(snapshot.docs[snapshot.docs.length - 1] ?? null)
      setHasMoreRecipes(snapshot.docs.length === PAGE_SIZE)
    } catch (error) {
      console.error("Failed to fetch initial recipes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchMoreRecipes = useCallback(async () => {
    if (isFetchingMoreRecipes || !hasMoreRecipes || !lastRecipeDoc) return

    setIsFetchingMoreRecipes(true)

    try {
      const snapshot = await getDocs(buildRecipesQuery(lastRecipeDoc))
      const nextRecipes = mapRecipeDocs(snapshot.docs)

      setRecipes((prev) => {
        const existingIds = new Set(prev.map((recipe) => recipe.recipeId || recipe.id))

        const uniqueNewRecipes = nextRecipes.filter(
          (recipe) => !existingIds.has(recipe.recipeId || recipe.id)
        )

        return [...prev, ...uniqueNewRecipes]
      })

      setLastRecipeDoc(snapshot.docs[snapshot.docs.length - 1] ?? null)
      setHasMoreRecipes(snapshot.docs.length === PAGE_SIZE)
    } catch (error) {
      console.error("Failed to fetch more recipes:", error)
    } finally {
      setIsFetchingMoreRecipes(false)
    }
  }, [hasMoreRecipes, isFetchingMoreRecipes, lastRecipeDoc])

  useEffect(() => {
    setRecipes([])
    setLastRecipeDoc(null)
    setHasMoreRecipes(true)

    fetchInitialRecipes()
  }, [fetchInitialRecipes])

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!currentUserId) {
          setFollowingUserIds([])
          return
      }

      try {
          const followingCollection = collection(db, "users", currentUserId, "following")
          const followingSnapshot = await getDocs(followingCollection)

          const ids = followingSnapshot.docs.map((docSnap) => {
              const data = docSnap.data()
              return String(data.userId || docSnap.id)
          })

          setFollowingUserIds(ids)
      } catch (error) {
          console.error("Error fetching following users:", error)
      }
    }

    fetchFollowing()
  }, [currentUserId])

  useEffect(() => {
    const fetchAuthorFollowerCounts = async () => {
      const authorIds = [
          ...new Set(
              recipes.map((recipe) => recipe.userId).filter((userId): userId is string => Boolean(userId))
          )
      ]

      if (!authorIds.length) {
          setAuthorFollowersCountMap({})
          return
      }

      try {
          const entries = await Promise.all(
              authorIds.map(async (authorId) => {
                  const userRef = doc(db, "users", authorId)
                  const userSnap = await getDoc(userRef)

                  const followersCount = userSnap.exists() ? Number(userSnap.data()?.stats?.followersCount || 0) : 0

                  return [authorId, followersCount] as const
              })
          )

          setAuthorFollowersCountMap(Object.fromEntries(entries))
      } catch (error) {
          console.error("Error fetching author follower counts:", error)
      }
    }

    fetchAuthorFollowerCounts()
  }, [recipes])

  useEffect(() => {
    if (!currentUserId) {
      setSavedRecipes([])
      return
    }

    const savedRecipesCollection = collection(db, "users", currentUserId, "savedRecipes")

    const unsubscribe = onSnapshot(
      savedRecipesCollection,
      (snapshot) => {
        const savedRecipesList = snapshot.docs.map((docSnap) => {
        //   id: docSnap.id,
        //   ...docSnap.data(),
            const data = docSnap.data()

            return {
                recipeId: String(data.recipeId || docSnap.id),
                savedAt: data.savedAt ?? null,
            }
        }) as SavedRecipe[]

        setSavedRecipes(savedRecipesList)
      },
      (error) => {
        console.error("Error listening to saved recipes:", error)
      }
    )

    return () => unsubscribe()
  }, [currentUserId])

  const currentUser = useMemo<CurrentUserCardData | null>(() => {
    if (!currentUserId || !currentUserProfile) return null

    return {
      uid: currentUserId,
      username: currentUserProfile.username,
      profileImage: currentUserProfile.profileImage,
    }
  }, [currentUserId, currentUserProfile])

  const availableCuisines = useMemo(() => {
    return getAvailableCuisines(recipes)
  }, [recipes])

  const publishedPublicRecipes = useMemo(() => {
    return recipes.filter(
      (recipe) => recipe.status === "published" && recipe.visibility === "public"
    )
  }, [recipes])

  const filteredRecipes = useMemo(() => {
    return publishedPublicRecipes.filter((recipe) =>
      applyRecipeFilters(recipe, filters, savedRecipes, currentUserId)
    )
  }, [publishedPublicRecipes, filters, savedRecipes, currentUserId])

  const forYouRecipes = useMemo(() => {
    if (filters.saved.mostSaved) {
      return sortByMostSaved(filteredRecipes)
    }

    return sortForYou(filteredRecipes)
  }, [filteredRecipes, filters.saved.mostSaved])

  const trendingRecipes = useMemo(() => {
    if (filters.saved.mostSaved) {
      return sortByMostSaved(filteredRecipes)
    }

    return sortTrending(filteredRecipes)
  }, [filteredRecipes, filters.saved.mostSaved])

  const followingRecipes = useMemo(() => {
    if (filters.saved.mostSaved) {
      return sortByMostSaved(filteredRecipes)
    }

    return sortByNewest(filteredRecipes)
  }, [filteredRecipes, filters.saved.mostSaved])

  const newRecipes = useMemo(() => {
    if (filters.saved.mostSaved) {
      return sortByMostSaved(filteredRecipes)
    }

    return sortByNewest(filteredRecipes)
  }, [filteredRecipes, filters.saved.mostSaved])

  const activeRecipes = useMemo(() => {
    switch (activeTab) {
      case "Trending":
        return trendingRecipes
      case "Following":
        return followingRecipes
      case "New":
        return newRecipes
      case "For You":
      default:
        return forYouRecipes
    }
  }, [activeTab, forYouRecipes, trendingRecipes, followingRecipes, newRecipes])

  const handleFollowStateChange = (authorId: string, isNowFollowing: boolean) => {
    setFollowingUserIds((prev) => {
        if (isNowFollowing) {
            return prev.includes(authorId) ? prev : [...prev, authorId]
        }

        return prev.filter((id) => id !== authorId)
    })

    setAuthorFollowersCountMap((prev) => ({
        ...prev,
        [authorId]: Math.max(0, Number(prev[authorId] || 0) + (isNowFollowing ? 1 : -1))
    }))
  }

  const handleFavoriteStateChange = (recipeId: string, isNowSaved: boolean) => {
    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.recipeId !== recipeId) return recipe

        const currentSavesCount = Number(recipe?.stats?.savesCount || 0)

        return {
          ...recipe,
          stats: {
            ...recipe.stats,
            savesCount: Math.max(0, currentSavesCount + (isNowSaved ? 1 : -1)),
          },
        }
      })
    )
  }

  const handleRatingStateChange = (
    recipeId: string,
    stats: {
      averageRating: number,
      ratingsCount: number,
      ratingsSum?: number
    }
  ) => {
    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.recipeId !== recipeId) return recipe

        return {
          ...recipe,
          stats: {
            ...recipe.stats,
            averageRating: stats.averageRating,
            ratingsCount: stats.ratingsCount,
            ratingsSum: stats.ratingsSum ?? recipe.stats?.ratingsSum,
          },
        }
      })
    )
  }

  const handleCommentStateChange = useCallback((recipeId: string, commentsCount: number) => {
    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.recipeId !== recipeId) return recipe

        return {
          ...recipe,
          stats: {
            ...recipe.stats,
            commentsCount,
          },
        }
      })
    )
  }, [])

  return {
    activeRecipes,
    availableCuisines,
    currentUser,
    currentUserId,
    savedRecipes,
    followingUserIds,
    authorFollowersCountMap,
    isLoading,
    isFiltering,
    handleFavoriteStateChange,
    handleFollowStateChange,
    handleRatingStateChange,
    handleCommentStateChange,
    hasMoreRecipes,
    isFetchingMoreRecipes,
    fetchMoreRecipes
  }
}