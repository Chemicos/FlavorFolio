import { useEffect, useMemo, useState } from "react"
import { RecipeFilters } from "../components/FilterDrawer"
import { Recipe, SavedRecipe } from "../types"
import type { CurrentUserCardData } from "../types/recipeCard.types"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { collection, doc, getDoc, getDocs, onSnapshot } from "@firebase/firestore"
import { db } from "../../../firebase-config"
import { applyRecipeFilters, getAvailableCuisines } from "../utils/recipeFilters"
import { sortByMostSaved, sortByNewest, sortForYou, sortTrending } from "../utils/recipeSorters"

interface UseHomeDataParams {
  activeTab: string
  filters: RecipeFilters
}

export function useHomeData({ activeTab, filters }: UseHomeDataParams) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
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

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true)

      try {
        const recipeCollection = collection(db, "recipes")
        const recipeSnapshot = await getDocs(recipeCollection)

        const nextRecipes = recipeSnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Recipe[]

        setRecipes(nextRecipes)
      } catch (error) {
        console.error("Failed to fetch recipes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecipes()
  }, [])

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

  return {
    activeRecipes,
    availableCuisines,
    currentUser,
    currentUserId,
    savedRecipes,
    isLoading,
    isFiltering,
    handleFavoriteStateChange,
  }
}