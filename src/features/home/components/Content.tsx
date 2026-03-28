/* eslint-disable react/prop-types */
import { db } from "../../../firebase-config";
import { useEffect, useMemo, useState } from "react";
import type { Recipe, SavedRecipe } from "../types"
import { collection, getDocs} from "@firebase/firestore";
import ViewRecipe from "./ViewRecipe";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import RecipeSection from "./RecipeSection";

interface ContentProps {
    recipes: Recipe[]
    isLoading: boolean
}

export default function Content({ recipes, isLoading }: ContentProps) {
    // const [showFilter, setShowFilter] = useState(false)
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    
    const [forYouVisible, setForYouVisible] = useState(4)
    const [trendingVisible, setTrendingVisible] = useState(4)
    const [followingVisible, setFollowingVisible] = useState(4)

    // Fetch currentUserId <<
    useEffect(() => {
        const auth = getAuth()
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUserId(user ? user.uid : null)
        })

        return () => unsubscribe()
    }, [])
    // >>

    useEffect(() => {
        const fetchSavedRecipes = async () => {
            if (!currentUserId) {
                setSavedRecipes([])
                return
            }

            try {
                const savedRecipesCollection = collection(db, "users", currentUserId, "savedRecipes")
                const savedRecipesSnapshot = await getDocs(savedRecipesCollection)

                const savedRecipesList = savedRecipesSnapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                }))

                setSavedRecipes(savedRecipesList)
            } catch (error) {
                console.error("Error fetching saved recipes:", error)
            }
        }
        fetchSavedRecipes()
    }, [currentUserId])
    
    const handleRecipeClick = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
    }

    const handleClose = () => {
        setSelectedRecipe(null)
    }

    const forYouRecipes = useMemo(() => {
        return [...recipes]
        .filter(recipe => recipe.status === "published" && recipe.visibility === "public")
        .sort((a, b) => {
            const aScore = Number(a?.stats?.averageRating || 0)
            const bScore = Number(b?.stats?.averageRating || 0)
            return bScore - aScore
        })
    }, [recipes])

    const trendingRecipes = useMemo(() => {
        return [...recipes]
        .filter(recipe => recipe.status === "published" && recipe.visibility === "public")
        .sort((a,b) => {
            const aSaves = Number(a?.stats?.savesCount || 0)
            const bSaves = Number(b?.stats?.savesCount || 0)

            if (bSaves !== aSaves) return bSaves - aSaves

            const aComments = Number(a?.stats?.commentsCount || 0)
            const bComments = Number(b?.stats?.commentsCount || 0)
            return bComments - aComments
        })
    }, [recipes])

    const followingRecipes = useMemo(() => {
        return [...recipes]
        .filter(recipe => recipe.status === "published" && recipe.visibility === "public")
        .sort((a, b) => {
            const aDate = a?.publishedAt?.seconds || 0
            const bDate = b?.publishedAt?.seconds || 0
            return bDate - aDate
        })
    }, [recipes])

  return (
    <div className="flex w-full flex-col sm:mb-6">
        <div className="flex flex-col gap-[10rem] pb-10 pt-4">
            <RecipeSection
                title="For You"
                recipes={forYouRecipes}
                visibleCount={forYouVisible}
                onShowMore={() => setForYouVisible(prev => prev + 4)}
                currentUserId={currentUserId}
                savedRecipes={savedRecipes}
                onRecipeClick={handleRecipeClick}
                isLoading={isLoading}
            />

            <RecipeSection
                title="Trending Now"
                recipes={trendingRecipes}
                visibleCount={trendingVisible}
                onShowMore={() => setTrendingVisible(prev => prev + 4)}
                currentUserId={currentUserId}
                savedRecipes={savedRecipes}
                onRecipeClick={handleRecipeClick}
                isLoading={isLoading}
            />

            <RecipeSection
                title="From Creators You Follow"
                recipes={followingRecipes}
                visibleCount={followingVisible}
                onShowMore={() => setFollowingVisible(prev => prev + 4)}
                currentUserId={currentUserId}
                savedRecipes={savedRecipes}
                onRecipeClick={handleRecipeClick}
                isLoading={isLoading}
            />
        </div>

        {selectedRecipe && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                <ViewRecipe
                    recipe={selectedRecipe}
                    onClose={handleClose}
                    currentUserId={currentUserId}
                />
            </div>
        )}
    </div>
  )
}