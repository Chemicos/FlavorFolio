import { useParams } from "react-router-dom"
import { useUserProfile } from "../hooks/useUserProfile"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDebounce } from "../../recipe-review/hooks/useDebounce"

import ProfileRecipeToolbar, { ProfileRecipeSortValue, ProfileRecipeViewMode } from "../components/ProfileRecipeToolbar"
import Navigation from "../../../components/layout/Navigation"
import MyProfileHeader from "../components/MyProfileHeader"
import ProfileRecipeGridSkeleton from "../components/ProfileRecipeGridSkeleton"
import ProfileRecipeGrid from "../components/ProfileRecipeGrid"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { ProfileConnectionType, subscribeToMyFollowingUserIds, subscribeToMySavedRecipeIds, toggleProfileFollow } from "../services/profileConnections.service"
import { CircularProgress } from "@mui/material"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import ProfileConnectionsModal from "../components/ProfileConnectionsModal"
import { Recipe } from "../../home/types"
import { CurrentUserCardData } from "../../home/types/recipeCard.types"
import { subscribeToProfileRecipeById } from "../services/profileRecipes.service"
import { AnimatePresence } from "motion/react"
import ViewRecipeDrawer from "../../home/components/recipe-view-drawer/ViewRecipeDrawer"
import { MyProfileData, subscribeToMyProfile } from "../services/profile.service"

function ViewRecipeDrawerLoading({ width }: { width: number }) {
  return (
    <aside
      style={{ width, flexShrink: 0 }}
      className="sticky top-16 flex h-[calc(100vh-80px)] flex-col items-center justify-center overflow-hidden rounded-l-2xl border-l border-white/10 bg-gradient-to-b from-[#16181d]/80 via-[#16181d]/95 to-[#16181d]"
    >
      <CircularProgress size={34} thickness={4.5} sx={{ color: "#feaa2b" }} />
      <p className="mt-4 text-sm font-medium text-[#a8b3cf]">Loading recipe...</p>
    </aside>
  )
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { showSnackbar } = useSnackbar()

  const { profile, recipes, setRecipes, isLoading, error } = useUserProfile(userId)
  const [connectionsModalType, setConnectionsModalType] = useState<ProfileConnectionType | null>(null)
  const isConnectionsModalOpen = Boolean(connectionsModalType)

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<MyProfileData | null>(null)
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([])
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 1000)
  const isSearching = searchQuery.trim() !== debouncedSearchQuery.trim()

  const [sortBy, setSortBy] = useState<ProfileRecipeSortValue>("latest")
  const [category, setCategory] = useState("all")
  const [viewMode, setViewMode] = useState<ProfileRecipeViewMode>("grid")

  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([])
  const [recipeDrawerWidth] = useState(540)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isRecipeDrawerLoading, setIsRecipeDrawerLoading] = useState(false)

  const isDrawerOpen = Boolean(selectedRecipe || isRecipeDrawerLoading)

  const categories = useMemo(() => ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"],[])

  useEffect(() => {
    const auth = getAuth()

    return onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid || null)
    })
  }, [])

  useEffect(() => {
    if (!currentUserId) {
      setFollowingUserIds([])
      return
    }

    const unsubscribe = subscribeToMyFollowingUserIds({
      userId: currentUserId,
      onChange: setFollowingUserIds,
      onError: (error) => {
        console.error("Failed to load following ids:", error)
      },
    })

    return () => unsubscribe()
  }, [currentUserId])

  useEffect(() => {
    if (!currentUserId) {
      setSavedRecipeIds([])
      return
    }

    const unsubscribe = subscribeToMySavedRecipeIds({
      userId: currentUserId,
      onChange: setSavedRecipeIds,
      onError: (error) => {
        console.error("Failed to load saved recipe ids:", error)
      },
    })

    return () => unsubscribe()
  }, [currentUserId])

  useEffect(() => {
  if (!currentUserId) {
    setCurrentUserProfile(null)
    return
  }

  const unsubscribe = subscribeToMyProfile(
      currentUserId,
      setCurrentUserProfile,
      (error) => {
        console.error("Failed to load current user profile:", error)
      }
    )

    return () => unsubscribe()
  }, [currentUserId])

  const currentUser = useMemo<CurrentUserCardData | null>(() => {
    if (!currentUserId) return null

    return {
      uid: currentUserId,
      username: currentUserProfile?.username || "User",
      profileImage: currentUserProfile?.profileImage || "",
    }
  }, [currentUserId, currentUserProfile])

  useEffect(() => {
    if (!selectedRecipeId) {
      setSelectedRecipe(null)
      return
    }

    setIsRecipeDrawerLoading(true)

    const unsubscribe = subscribeToProfileRecipeById(
      selectedRecipeId,
      (recipe) => {
        setSelectedRecipe(recipe)
        setIsRecipeDrawerLoading(false)
      },
      (error) => {
        console.error("Failed to load selected recipe:", error)
        showSnackbar("Failed to load recipe.", "error")
        setIsRecipeDrawerLoading(false)
      }
    )

    return () => unsubscribe()
  }, [selectedRecipeId, showSnackbar])

  const isOwnProfile = currentUserId === userId
  const isFollowingProfile = Boolean(userId && followingUserIds.includes(userId))

  const handleToggleFollow = async () => {
    if (!currentUserId || !userId || !profile || isOwnProfile || isFollowLoading) return

    try {
      setIsFollowLoading(true)

      const nextIsFollowing = await toggleProfileFollow({
        currentUserId,
        targetUserId: userId,
        isCurrentlyFollowing: isFollowingProfile,
        currentUsername: currentUserProfile?.username || "User",
        currentProfileImage: currentUserProfile?.profileImage || "",
        targetUsername: profile.username || "User",
        targetProfileImage: profile.profileImage || "",
      })

      showSnackbar(
        nextIsFollowing
          ? `You are now following ${profile.username}.`
          : `You unfollowed ${profile.username}.`,
        "success"
      )
    } catch (error) {
      console.error("Failed to toggle follow:", error)
      showSnackbar("Failed to update follow status. Please try again.", "error")
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleRatingStateChange = useCallback((
    recipeId: string,
    stats: {
      averageRating: number
      ratingsCount: number
      ratingSum?: number
    }
  ) => {
    const nextRating = Number(stats.averageRating || 0)

    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? {
              ...recipe,
              rating: nextRating,
            }
          : recipe
      )
    )

    setSelectedRecipe((prev) => {
      if (!prev || prev.recipeId !== recipeId) return prev

      return {
        ...prev,
        stats: {
          ...prev.stats,
          averageRating: nextRating,
          ratingsCount: stats.ratingsCount,
          ratingsSum: stats.ratingSum ?? prev.stats?.ratingsSum ?? 0,
        },
      }
    })

    showSnackbar("Recipe rating updated successfully.", "success")
  }, [setRecipes, showSnackbar])

  const handleFollowStateChange = useCallback((
    authorUserId: string,
    isNowFollowing: boolean,
    nextFollowersCount?: number
  ) => {
    setFollowingUserIds((prev) =>
      isNowFollowing
        ? Array.from(new Set([...prev, authorUserId]))
        : prev.filter((id) => id !== authorUserId)
    )

    setSelectedRecipe((prev) => {
      if (!prev || prev.userId !== authorUserId) return prev

      const currentCount = Number(prev.author?.followersCount || 0)

      return {
        ...prev,
        author: {
          ...prev.author,
          followersCount:
            typeof nextFollowersCount === "number"
              ? nextFollowersCount
              : Math.max(0, currentCount + (isNowFollowing ? 1 : -1)),
        },
      }
    })

    showSnackbar(
      isNowFollowing ? "Creator followed." : "Creator unfollowed.",
      isNowFollowing ? "success" : "info"
    )
  }, [showSnackbar])

  const handleFavoriteStateChange = useCallback((
    recipeId: string,
    isNowSaved: boolean,
    nextSavesCount?: number
  ) => {
    setSavedRecipeIds((prev) =>
      isNowSaved
        ? Array.from(new Set([...prev, recipeId]))
        : prev.filter((id) => id !== recipeId)
    )

    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.id !== recipeId) return recipe

        const currentCount = Number(recipe.savesCount || 0)

        return {
          ...recipe,
          savesCount:
            typeof nextSavesCount === "number"
              ? nextSavesCount
              : Math.max(0, currentCount + (isNowSaved ? 1 : -1)),
        }
      })
    )

    setSelectedRecipe((prev) => {
      if (!prev || prev.recipeId !== recipeId) return prev

      const currentCount = Number(prev.stats?.savesCount || 0)

      return {
        ...prev,
        stats: {
          ...prev.stats,
          savesCount:
            typeof nextSavesCount === "number"
              ? nextSavesCount
              : Math.max(0, currentCount + (isNowSaved ? 1 : -1)),
        },
      }
    })

    showSnackbar(
      isNowSaved ? "Recipe saved." : "Recipe removed from saved recipes.",
      isNowSaved ? "success" : "info"
    )
  }, [setRecipes, showSnackbar])

  const handleCommentStateChange = useCallback((
    recipeId: string,
    nextCommentsCount: number
  ) => {
    const normalizedCount = Number(nextCommentsCount || 0)

    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, commentsCount: normalizedCount }
          : recipe
      )
    )

    setSelectedRecipe((prev) => {
      if (!prev || prev.recipeId !== recipeId) return prev

      return {
        ...prev,
        stats: {
          ...prev.stats,
          commentsCount: normalizedCount,
        },
      }
    })
  }, [setRecipes])

  const visibleRecipes = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase()

    const filteredBySearch = recipes.filter((recipe) => {
      if (!query) return true

      return [
        recipe.title,
        recipe.meal,
        recipe.difficulty,
        recipe.category,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    })

    const filteredByCategory = filteredBySearch.filter((recipe) => {
      if (category === "all") return true

      return recipe.category.toLowerCase() === category.toLowerCase()
    })

    return [...filteredByCategory].sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt || "").getTime() -
          new Date(b.createdAt || "").getTime()
        )
      }

      if (sortBy === "popular") {
        return b.savesCount + b.commentsCount - (a.savesCount + a.commentsCount)
      }

      if (sortBy === "highest-rated") {
        return b.rating - a.rating
      }

      return (
        new Date(b.createdAt || "").getTime() -
        new Date(a.createdAt || "").getTime()
      )
    })
  }, [recipes, debouncedSearchQuery, category, sortBy])

  return (
    <div className="relative min-h-screen bg-[#0d0e11] text-white">
      <Navigation variant="solid" />
      <div className="mx-auto flex w-full max-w-[1900px] items-start gap-6 px-6 pt-28 xl:px-10">
        <main 
          className={[
            "min-w-0 flex-1 transition-all duration-300",
            isDrawerOpen ? "max-w-none" : "mx-auto max-w-[1400px]",
          ].join(" ")}
        >
          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">
              {error}
            </div>
          )}

          {!error && profile && (
            <>
              <MyProfileHeader
                username={profile.username || "User"}
                fullName={profile.fullName || profile.username || "User"}
                bio={profile.bio || "Food lover & recipe creator."}
                profileImage={profile.profileImage || ""}
                bannerImage={profile.bannerImage || ""}
                location={profile.location || "Location not set"}
                website={profile.website || "Website not set"}
                joinedLabel={profile.joinedLabel || "Joined recently"}
                recipesCount={recipes.length}
                followersCount={profile.stats.followersCount || 0}
                followingCount={profile.stats.followingCount || 0}
                onFollowersClick={() => setConnectionsModalType("followers")}
                onFollowingClick={() => setConnectionsModalType("following")}
                rightAction={
                  !isOwnProfile ? (
                    <button
                      type="button"
                      onClick={handleToggleFollow}
                      disabled={isFollowLoading}
                      className={[
                        "inline-flex h-9 min-w-[96px] items-center justify-center rounded-lg border px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                        isFollowingProfile
                          ? "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                          : "border-white/10 bg-[#0b0b0c]/80 text-white hover:bg-white/[0.06]",
                      ].join(" ")}
                    >
                      {isFollowLoading ? (
                        <CircularProgress size={15} thickness={5} sx={{ color: "#ffffff" }} />
                      ) : isFollowingProfile ? (
                        "Following"
                      ) : (
                        "Follow"
                      )}
                    </button>
                  ) : null
                }
              />

              <div className="sticky top-16 z-40 bg-[#0d0e11] pb-5">
                <div className="border-b border-white/10 pt-6" />

                <ProfileRecipeToolbar
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  resultCount={visibleRecipes.length}
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                  category={category}
                  onCategoryChange={setCategory}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  categories={categories}
                />
              </div>

              {(isLoading || isSearching) && (
                <ProfileRecipeGridSkeleton viewMode={viewMode} count={8} />
              )}

              {!isLoading && !isSearching && (
                <ProfileRecipeGrid
                  recipes={visibleRecipes}
                  viewMode={viewMode}
                  currentUserId={null}
                  onRecipeClick={(recipe) => {setSelectedRecipeId(recipe.id)}}
                />
              )}
            </>
          )}
        </main>

        <AnimatePresence mode="wait">
          {isRecipeDrawerLoading && (
            <ViewRecipeDrawerLoading width={recipeDrawerWidth} />
          )}

          {!isRecipeDrawerLoading && selectedRecipe && currentUser && (
            <ViewRecipeDrawer
              presentation="inline"
              width={recipeDrawerWidth}
              recipe={selectedRecipe}
              currentUser={currentUser}
              savedRecipes={savedRecipeIds.map((recipeId) => ({ recipeId }))}
              followingUserIds={followingUserIds}
              authorFollowersCount={Number(selectedRecipe.author?.followersCount || 0)}
              onClose={() => {
                setSelectedRecipeId(null)
                setSelectedRecipe(null)
              }}
              onFollowStateChange={handleFollowStateChange}
              onFavoriteStateChange={handleFavoriteStateChange}
              onRatingStateChange={handleRatingStateChange}
              onCommentStateChange={handleCommentStateChange}
            />
          )}
        </AnimatePresence>
      </div>

      {connectionsModalType && (
        <ProfileConnectionsModal
          isOpen={true}
          userId={userId || null}
          currentUserId={currentUserId}
          type={connectionsModalType}
          onClose={() => setConnectionsModalType(null)}
        />
      )}
    </div>
  )
}
