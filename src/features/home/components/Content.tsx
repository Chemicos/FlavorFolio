/* eslint-disable react/prop-types */
import { db } from "../../../firebase-config";
import { useEffect, useMemo, useState } from "react";
import type { Recipe, SavedRecipe } from "../types"
import { collection, doc, getDoc, getDocs} from "@firebase/firestore";
import ViewRecipe from "./ViewRecipe";
import RecipeSection from "./RecipeSection";

interface ContentProps {
    recipes: Recipe[]
    isLoading: boolean
    title: string
    onOpenFilters: () => void
    currentUserId: string | null
    savedRecipes: SavedRecipe[]
    onFavoriteStateChange: (recipeId: string, isNowSaved: boolean) => void
}

export default function Content({ recipes, isLoading, title, onOpenFilters, currentUserId, savedRecipes, onFavoriteStateChange }: ContentProps) {
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    
    const [authorFollowersCountMap, setAuthorFollowersCountMap] = useState<Record<string, number>>({})
    const [followingUserIds, setFollowingUserIds] = useState<string[]>([])
    
    const [visibleCount, setVisibleCount] = useState(20)

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
        setVisibleCount(20)
    }, [recipes])

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
    
    const handleRecipeClick = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
    }

    const handleClose = () => {
        setSelectedRecipe(null)
    }

  return (
    <div className="flex w-full flex-col sm:mb-6">
        <RecipeSection
            title={title}
            recipes={recipes}
            visibleCount={visibleCount}
            onShowMore={() => setVisibleCount((prev) => prev + 4)}
            currentUserId={currentUserId}
            savedRecipes={savedRecipes}
            followingUserIds={followingUserIds}
            authorFollowersCountMap={authorFollowersCountMap}
            onFollowStateChange={handleFollowStateChange}
            onFavoriteStateChange={onFavoriteStateChange}
            onRecipeClick={handleRecipeClick}
            isLoading={isLoading}
            onOpenFilters={onOpenFilters}
        />

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