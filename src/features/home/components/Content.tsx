/* eslint-disable react/prop-types */
import { db } from "../../../firebase-config";
import { useEffect, useMemo, useState } from "react";
import type { Recipe, SavedRecipe } from "../types"
import { collection, doc, getDoc, getDocs} from "@firebase/firestore";
import ViewRecipe from "./ViewRecipe";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import RecipeSection from "./RecipeSection";

interface ContentProps {
    recipes: Recipe[]
    isLoading: boolean
    activeTab: string
    onOpenFilters: () => void
}

export default function Content({ recipes, isLoading, activeTab, onOpenFilters }: ContentProps) {
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    
    const [authorFollowersCountMap, setAuthorFollowersCountMap] = useState<Record<string, number>>({})
    const [followingUserIds, setFollowingUserIds] = useState<string[]>([])
    
    const [visibleCount, setVisibleCount] = useState(20)

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
    }, [activeTab])

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

    const publishedPublicRecipes = useMemo(() => {
        return [...recipes].filter(
            (recipe) => recipe.status === "published" && recipe.visibility === "public"
        )
    }, [recipes])

    const forYouRecipes = useMemo(() => {
        return [...publishedPublicRecipes].sort((a, b) => {
            const aScore = Number(a?.stats?.averageRating || 0)
            const bScore = Number(b?.stats?.averageRating || 0)
            return bScore - aScore
        })
    }, [publishedPublicRecipes])

    const trendingRecipes = useMemo(() => {
        return [...publishedPublicRecipes].sort((a, b) => {
            const aSaves = Number(a?.stats?.savesCount || 0)
            const bSaves = Number(b?.stats?.savesCount || 0)

            if (bSaves !== aSaves) return bSaves - aSaves

            const aComments = Number(a?.stats?.commentsCount || 0)
            const bComments = Number(b?.stats?.commentsCount || 0)

            return bComments - aComments
        })
    }, [publishedPublicRecipes])

    const followingRecipes = useMemo(() => {
        return [...publishedPublicRecipes].sort((a, b) => {
            const aDate = a?.publishedAt?.seconds || 0
            const bDate = b?.publishedAt?.seconds || 0
            return bDate - aDate
        })
    }, [publishedPublicRecipes])

    const newRecipes = useMemo(() => {
        return [...publishedPublicRecipes].sort((a, b) => {
            const aDate = a?.publishedAt?.seconds || 0
            const bDate = b?.publishedAt?.seconds || 0
            return bDate - aDate
        })
    }, [publishedPublicRecipes])

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

  return (
    <div className="flex w-full flex-col sm:mb-6">
            <RecipeSection
                title={activeTab}
                recipes={activeRecipes}
                visibleCount={visibleCount}
                onShowMore={() => setVisibleCount((prev) => prev + 4)}
                currentUserId={currentUserId}
                savedRecipes={savedRecipes}
                followingUserIds={followingUserIds}
                authorFollowersCountMap={authorFollowersCountMap}
                onFollowStateChange={handleFollowStateChange}
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