import { useEffect, useMemo, useState } from "react"
import { RecipeFilters } from "../components/FilterDrawer"
import { Recipe, SavedRecipe } from "../types"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { collection, getDocs, onSnapshot } from "@firebase/firestore"
import { db } from "../../../firebase-config"
import { applyRecipeFilters, getAvailableCuisines } from "../utils/recipeFilters"
import { sortByMostSaved, sortByNewest, sortForYou, sortTrending } from "../utils/recipeSorters"

interface UseHomeDataParams {
  activeTab: string
  filters: RecipeFilters
}

export function useHomeData({activeTab, filters}: UseHomeDataParams) {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const auth = getAuth()

        const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUserId(user ? user.uid : null)
        })

        return () => unsubscribe()
    }, [])

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
            const savedRecipesList = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
            })) as SavedRecipe[]

            setSavedRecipes(savedRecipesList)
        },
        (error) => {
            console.error("Error listening to saved recipes:", error)
        }
        )

        return () => unsubscribe()
    }, [currentUserId])

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
        currentUserId,
        savedRecipes,
        isLoading,
        handleFavoriteStateChange,
    }
}