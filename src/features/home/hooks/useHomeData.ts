import { useCallback, useEffect, useMemo, useState } from "react"
import { RecipeFilters } from "../components/FilterDrawer"
import { Recipe, SavedRecipe } from "../types"
import type { CurrentUserCardData } from "../types/recipeCard.types"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { collection, doc, DocumentSnapshot, getDoc, getDocs, limit, onSnapshot, orderBy, query, startAfter, where } from "firebase/firestore"
import { db } from "../../../firebase-config"
import { applyRecipeFilters, getAvailableCuisines } from "../utils/recipeFilters"
import { sortByMostSaved, sortByNewest, sortForYou, sortTrending } from "../utils/recipeSorters"
import { fetchRecipesByIds, fetchRecommendationCandidates, subscribeToFollowingRecipes, subscribeToFollowingUserIds } from "../services/feed.service"
import { buildRecipePreferenceProfile, RecipePreferenceProfile, sortRecipesForYou } from "../utils/recipeRecommendations"

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

  // const [followingRecipes, setFollowingRecipes] = useState<Recipe[]>([])
  const [followingFeedRecipes, setFollowingFeedRecipes] = useState<Recipe[]>([])
  const [recommendationCandidates, setRecommendationCandidates] = useState<Recipe[]>([])

  const [preferenceRecipes, setPreferenceRecipes] = useState<Recipe[]>([])

  const [isFollowingFeedLoading, setIsFollowingFeedLoading] = useState(false)

  const [isForYouFeedLoading, setIsForYouFeedLoading] = useState(false)

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
    if (!currentUserId) {
      setFollowingUserIds([])
      return
    }

    const unsubscribe = subscribeToFollowingUserIds({
      currentUserId,

      onChange: setFollowingUserIds,

      onError: (error) => {
        console.error(
          "Failed to subscribe to following users:",
          error
        )
      },
    })

    return () => unsubscribe()
  }, [currentUserId])

  useEffect(() => {
    if (activeTab !== "Following") return

    if (!followingUserIds.length) {
      setFollowingFeedRecipes([])
      setIsFollowingFeedLoading(false)
      return
    }

    setIsFollowingFeedLoading(true)

    const unsubscribe = subscribeToFollowingRecipes({
      followingUserIds,

      onChange: (nextRecipes) => {
        setFollowingFeedRecipes(nextRecipes)
        setIsFollowingFeedLoading(false)
      },

      onError: (error) => {
        console.error(
          "Failed to subscribe to following recipes:",
          error
        )

        setFollowingFeedRecipes([])
        setIsFollowingFeedLoading(false)
      },
    })

    return () => unsubscribe()
  }, [activeTab, followingUserIds])

  useEffect(() => {
    if (activeTab !== "For You") return

    let isMounted = true

    async function loadRecommendationCandidates() {
      try {
        setIsForYouFeedLoading(true)

        const candidates = await fetchRecommendationCandidates()

        if (isMounted) {
          setRecommendationCandidates(candidates)
        }
      } catch (error) {
        console.error(
          "Failed to load recommendation candidates:",
          error
        )
      } finally {
        if (isMounted) {
          setIsForYouFeedLoading(false)
        }
      }
    }

    void loadRecommendationCandidates()

    return () => {
      isMounted = false
    }
  }, [activeTab])

  useEffect(() => {
    const savedRecipeIds = savedRecipes
      .map((savedRecipe) => savedRecipe.recipeId || savedRecipe.id)
      .filter((recipeId): recipeId is string => Boolean(recipeId))

    if (!savedRecipeIds.length) {
      setPreferenceRecipes([])
      return
    }

    let isMounted = true

    async function loadPreferenceRecipes() {
      try {
        const recipes = await fetchRecipesByIds(
          savedRecipeIds.slice(0, 60)
        )

        if (isMounted) {
          setPreferenceRecipes(recipes)
        }
      } catch (error) {
        console.error(
          "Failed to load preference recipes:",
          error
        )
      }
    }

    void loadPreferenceRecipes()

    return () => {
      isMounted = false
    }
  }, [savedRecipes])

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

  const preferenceProfile = useMemo<RecipePreferenceProfile>(() => {
      return buildRecipePreferenceProfile(
        preferenceRecipes
      )
    }, [preferenceRecipes])

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

  // const forYouRecipes = useMemo(() => {
  //   if (filters.saved.mostSaved) {
  //     return sortByMostSaved(filteredRecipes)
  //   }

  //   return sortForYou(filteredRecipes)
  // }, [filteredRecipes, filters.saved.mostSaved])

  const filteredRecommendationCandidates = useMemo(() => {
    return recommendationCandidates.filter((recipe) =>
      applyRecipeFilters(
        recipe,
        filters,
        savedRecipes,
        currentUserId
      )
    )
  }, [
    recommendationCandidates,
    filters,
    savedRecipes,
    currentUserId,
  ])

  const forYouRecipes = useMemo(() => {
    if (filters.saved.mostSaved) {
      return sortByMostSaved(
        filteredRecommendationCandidates
      )
    }

    return sortRecipesForYou({
      recipes: filteredRecommendationCandidates,
      preferenceProfile,
      followingUserIds,
      savedRecipeIds: savedRecipes
        .map((savedRecipe) => savedRecipe.recipeId || savedRecipe.id)
        .filter((recipeId): recipeId is string => Boolean(recipeId)),
      currentUserId,
    })
  }, [
    filteredRecommendationCandidates,
    preferenceProfile,
    followingUserIds,
    savedRecipes,
    currentUserId,
    filters.saved.mostSaved,
  ])  

  const trendingRecipes = useMemo(() => {
    if (filters.saved.mostSaved) {
      return sortByMostSaved(filteredRecipes)
    }

    return sortTrending(filteredRecipes)
  }, [filteredRecipes, filters.saved.mostSaved])

  // const followingRecipes = useMemo(() => {
  //   if (filters.saved.mostSaved) {
  //     return sortByMostSaved(filteredRecipes)
  //   }

  //   return sortByNewest(filteredRecipes)
  // }, [filteredRecipes, filters.saved.mostSaved])

  const filteredFollowingRecipes = useMemo(() => {
    return followingFeedRecipes.filter((recipe) =>
      applyRecipeFilters(
        recipe,
        filters,
        savedRecipes,
        currentUserId
      )
    )
  }, [
    followingFeedRecipes,
    filters,
    savedRecipes,
    currentUserId,
  ])

  const followingRecipes = useMemo(() => {
    if (filters.saved.mostSaved) {
      return sortByMostSaved(
        filteredFollowingRecipes
      )
    }

    return sortByNewest(filteredFollowingRecipes)
  }, [
    filteredFollowingRecipes,
    filters.saved.mostSaved,
  ])

  const newRecipes = useMemo(() => {
    if (filters.saved.mostSaved) {
      return sortByMostSaved(filteredRecipes)
    }

    return sortByNewest(filteredRecipes)
  }, [filteredRecipes, filters.saved.mostSaved])

  const activeFeedSource = useMemo<Recipe[]>(() => {
    switch (activeTab) {
      case "For You":
        return forYouRecipes

      case "Trending":
        return trendingRecipes

      case "Following":
        return followingFeedRecipes

      case "New":
        return newRecipes

      default:
        return forYouRecipes
    }
  }, [activeTab, forYouRecipes, trendingRecipes, followingFeedRecipes, newRecipes,])

  
  const filteredActiveRecipes = useMemo(() => {
    return activeFeedSource.filter((recipe) =>
      applyRecipeFilters(
        recipe,
        filters,
        savedRecipes,
        currentUserId
      )
    )
  }, [
    activeFeedSource,
    filters,
    savedRecipes,
    currentUserId,
  ])
  
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

  const activeRecipes = useMemo(() => {
    if (filters.saved.mostSaved) {
      return [...filteredActiveRecipes].sort((a, b) => {
        const firstSavesCount = Number(
          a.stats?.savesCount ?? a.savesCount ?? 0
        )

        const secondSavesCount = Number(
          b.stats?.savesCount ?? b.savesCount ?? 0
        )

        return secondSavesCount - firstSavesCount
      })
    }

    return filteredActiveRecipes
  }, [
    filteredActiveRecipes,
    filters.saved.mostSaved,
  ])

  const updateRecipeAcrossFeeds = useCallback(
    (
      recipeId: string,
      updater: (recipe: Recipe) => Recipe
    ) => {
      const updateCollection = (
        currentRecipes: Recipe[]
      ) =>
        currentRecipes.map((recipe) => {
          const currentRecipeId =
            recipe.recipeId || recipe.id || ""

          if (currentRecipeId !== recipeId) {
            return recipe
          }

          return updater(recipe)
        })

      setRecipes(updateCollection)
      setFollowingFeedRecipes(updateCollection)
      setRecommendationCandidates(updateCollection)
      setPreferenceRecipes(updateCollection)
    },
    []
  )

  const handleFavoriteStateChange = useCallback(
    (
      recipeId: string,
      isNowSaved: boolean
    ) => {
      updateRecipeAcrossFeeds(
        recipeId,
        (recipe) => {
          const currentSavesCount = Number(
            recipe.stats?.savesCount ??
              recipe.savesCount ??
              0
          )

          const nextSavesCount = Math.max(
            0,
            currentSavesCount +
              (isNowSaved ? 1 : -1)
          )

          return {
            ...recipe,

            savesCount: nextSavesCount,

            stats: {
              ...recipe.stats,
              savesCount: nextSavesCount,
            },
          }
        }
      )
    },
    [updateRecipeAcrossFeeds]
  )

  const handleRatingStateChange = useCallback(
    (
      recipeId: string,
      stats: {
        averageRating: number
        ratingsCount: number
        ratingsSum?: number
      }
    ) => {
      updateRecipeAcrossFeeds(
        recipeId,
        (recipe) => {
          const nextRatingsSum =
            stats.ratingsSum ??
            recipe.stats?.ratingsSum ??
            recipe.ratingsSum ??
            0

          return {
            ...recipe,

            averageRating: stats.averageRating,
            rating: stats.averageRating,
            ratingsCount: stats.ratingsCount,
            ratingsSum: nextRatingsSum,

            stats: {
              ...recipe.stats,
              averageRating: stats.averageRating,
              ratingsCount: stats.ratingsCount,
              ratingsSum: nextRatingsSum,
            },
          }
        }
      )
    },
    [updateRecipeAcrossFeeds]
  )
 
  const handleRecipeDeleteStateChange =
    useCallback(
      (recipeId: string) => {
        const removeRecipe = (
          currentRecipes: Recipe[]
        ) =>
          currentRecipes.filter((recipe) => {
            const currentRecipeId =
              recipe.recipeId || recipe.id || ""

            return currentRecipeId !== recipeId
          })

        setRecipes(removeRecipe)
        setFollowingFeedRecipes(removeRecipe)
        setRecommendationCandidates(removeRecipe)
        setPreferenceRecipes(removeRecipe)
      },
      []
    )

  const handleCommentStateChange = useCallback(
    (
      recipeId: string,
      commentsCount: number
    ) => {
      const normalizedCommentsCount = Math.max(
        0,
        Number(commentsCount || 0)
      )

      updateRecipeAcrossFeeds(
        recipeId,
        (recipe) => ({
          ...recipe,

          commentsCount: normalizedCommentsCount,

          stats: {
            ...recipe.stats,
            commentsCount: normalizedCommentsCount,
          },
        })
      )
    },
    [updateRecipeAcrossFeeds]
  )

  const activeFeedIsLoading =
    isLoading ||
    (activeTab === "Following" &&
      isFollowingFeedLoading) ||
    (activeTab === "For You" &&
      isForYouFeedLoading)

  return {
    activeRecipes,
    availableCuisines,
    currentUser,
    currentUserId,
    savedRecipes,
    followingUserIds,
    authorFollowersCountMap,

    isLoading: activeFeedIsLoading,
    isFiltering,

    handleFavoriteStateChange,
    handleFollowStateChange,
    handleRatingStateChange,
    handleCommentStateChange,
    handleRecipeDeleteStateChange,

    hasMoreRecipes:
      activeTab === "Following" ||
      activeTab === "For You"
        ? false
        : hasMoreRecipes,

    isFetchingMoreRecipes:
      activeTab === "Following" ||
      activeTab === "For You"
        ? false
        : isFetchingMoreRecipes,

    fetchMoreRecipes:
      activeTab === "Following" ||
      activeTab === "For You"
        ? () => undefined
        : fetchMoreRecipes, 
  }
}