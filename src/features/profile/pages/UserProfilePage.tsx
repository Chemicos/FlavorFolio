import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded"
import BlockRoundedIcon from "@mui/icons-material/BlockRounded"
import { CircularProgress } from "@mui/material"

import { useNavigate, useParams } from "react-router-dom"
import { useUserProfile } from "../hooks/useUserProfile"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDebounce } from "../../recipe-review/hooks/useDebounce"

import ProfileRecipeToolbar, { ProfileRecipeSortValue, ProfileRecipeViewMode } from "../components/ProfileRecipeToolbar"
import Navigation from "../../../components/layout/Navigation"
import MyProfileHeader from "../components/MyProfileHeader"
import ProfileRecipeGridSkeleton from "../components/ProfileRecipeGridSkeleton"
import ProfileRecipeGrid from "../components/ProfileRecipeGrid"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { ProfileConnectionType, subscribeToMyFollowingUserIds, subscribeToMySavedRecipeIds, toggleProfileFollow } from "../services/profileConnections.service"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import ProfileConnectionsModal from "../components/ProfileConnectionsModal"
import { Recipe } from "../../home/types"
import { CurrentUserCardData } from "../../home/types/recipeCard.types"
import { subscribeToProfileRecipeById } from "../services/profileRecipes.service"
import { AnimatePresence, motion } from "motion/react"
import ViewRecipeDrawer from "../../home/components/recipe-view-drawer/ViewRecipeDrawer"
import { MyProfileData, subscribeToMyProfile } from "../services/profile.service"
import { blockUser, subscribeToBlockedByUserIds, subscribeToBlockedUserIds, unblockUser } from "../../account-settings/services/blockedUsers.service"
import { createOrOpenDirectConversation } from "../../messages/services/messages.service"
import { SharedRecipeMessage } from "../../messages/types/messages.types"
import ShareRecipeModal from "../../messages/components/ShareRecipeModal"

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
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const { showSnackbar } = useSnackbar()
  

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([])
  const [blockedByUserIds, setBlockedByUserIds] = useState<string[]>([])
  const [isBlockLoading, setIsBlockLoading] = useState(false)

  const isBlockedProfile = Boolean(userId && blockedUserIds.includes(userId))
  const isBlockedByProfile = Boolean(userId && blockedByUserIds.includes(userId))
  const hasBlockedRelationship = isBlockedProfile || isBlockedByProfile

  const { profile, recipes, setRecipes, isLoading, error } = useUserProfile(userId)
  const [connectionsModalType, setConnectionsModalType] = useState<ProfileConnectionType | null>(null)
  const isConnectionsModalOpen = Boolean(connectionsModalType)
  const [isProfileActionsMenuOpen, setIsProfileActionsMenuOpen] = useState(false)
  const profileActionsMenuRef = useRef<HTMLDivElement | null>(null)

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<MyProfileData | null>(null)
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([])
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isMessageLoading, setIsMessageLoading] = useState(false)

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

  const [recipeToShare, setRecipeToShare] = useState<SharedRecipeMessage | null>(null)

  const buildSharedRecipeFromRecipe = (recipe: Recipe): SharedRecipeMessage => ({
    recipeId: recipe.recipeId || recipe.id || "",
    title: recipe.title || "Untitled recipe",
    image: recipe.image || "",
    authorUsername:
      recipe.author?.username ||
      recipe.user ||
      profile?.username ||
      "Unknown",
    cuisine: recipe.cuisine || "",
    meal: recipe.meal || "",
    difficulty: recipe.difficulty || "",
    durationMinutes: Number(recipe.durationMinutes || 0),
  })

  const buildSharedRecipeFromGridItem = (recipe: any): SharedRecipeMessage => ({
    recipeId: recipe.id || recipe.recipeId || "",
    title: recipe.title || "Untitled recipe",
    image: recipe.image || "",
    authorUsername: profile?.username || "Unknown",
    cuisine: recipe.category || recipe.cuisine || "",
    meal: recipe.meal || "",
    difficulty: recipe.difficulty || "",
    durationMinutes: Number(recipe.durationMinutes || 0),
  })

  const handleShareRecipeFromDrawer = (recipe: Recipe) => {
    setRecipeToShare(buildSharedRecipeFromRecipe(recipe))
  }

  const handleShareRecipeFromGrid = (recipe: any) => {
    setRecipeToShare(buildSharedRecipeFromGridItem(recipe))
  }

  const isDrawerOpen = Boolean(selectedRecipe || isRecipeDrawerLoading)

  const categories = useMemo(() => ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"],[])

  useEffect(() => {
    if (!currentUserId) {
      setBlockedByUserIds([])
      return
    }

    const unsubscribe = subscribeToBlockedByUserIds({
      userId: currentUserId,
      onChange: setBlockedByUserIds,
      onError: (error) => {
        console.error("Failed to load blocked by users:", error)
      },
    })

    return () => unsubscribe()
  }, [currentUserId])

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
    if (!isProfileActionsMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileActionsMenuRef.current &&
        !profileActionsMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileActionsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isProfileActionsMenuOpen])

  useEffect(() => {
    if (!currentUserId) {
      setBlockedUserIds([])
      return
    }

    const unsubscribe = subscribeToBlockedUserIds({
      userId: currentUserId,
      onChange: setBlockedUserIds,
      onError: (error) => {
        console.error("Failed to load blocked users:", error)
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

  const handleAuthorProfileClick = useCallback((authorId: string) => {
    setSelectedRecipeId(null)
    setSelectedRecipe(null)

    if (authorId === currentUserId) {
      navigate("/profile")
      return
    }

    navigate(`/users/${authorId}`)
  }, [navigate, currentUserId])

  const handleSendMessage = async () => {
    if (!currentUserId || !userId || isOwnProfile || isMessageLoading) return

    try {
      setIsMessageLoading(true)
      setIsProfileActionsMenuOpen(false)

      const conversationId = await createOrOpenDirectConversation({
        currentUserId,
        targetUserId: userId,
      })

      navigate(`/messages/${conversationId}`)
    } catch (error) {
      console.error("Failed to start conversation:", error)
      showSnackbar(
        "You can only message users who mutually follow you.",
        "error"
      )
    } finally {
      setIsMessageLoading(false)
    }
  }

  const handleToggleBlockUser = async () => {
    if (!currentUserId || !userId || !profile || isOwnProfile || isBlockLoading) return

    try {
      setIsProfileActionsMenuOpen(false)
      setIsBlockLoading(true)

      if (isBlockedProfile) {
        await unblockUser({
          currentUserId,
          targetUserId: userId,
        })

        setBlockedUserIds((prev) => prev.filter((id) => id !== userId))
        showSnackbar(`${profile.username} has been unblocked.`, "success")
        return
      }

      await blockUser({
        currentUserId,
        targetUserId: userId,
        targetUsername: profile.username || "User",
        targetProfileImage: profile.profileImage || "",
      })

      setBlockedUserIds((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      )

      setFollowingUserIds((prev) => prev.filter((id) => id !== userId))
      showSnackbar(`${profile.username} has been blocked.`, "success")
    } catch (error) {
      console.error("Failed to update block status:", error)
      showSnackbar("Failed to update block status. Please try again.", "error")
    } finally {
      setIsBlockLoading(false)
    }
  }

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
                    <div ref={profileActionsMenuRef} className="relative flex items-center gap-2">
                      {!hasBlockedRelationship && (
                        <>
                          <button
                            type="button"
                            onClick={handleToggleFollow}
                            disabled={isFollowLoading}
                            className={[
                              "inline-flex h-9 min-w-[96px] items-center justify-center rounded-lg border px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                              isFollowingProfile
                                ? "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                                : "border-white/10 bg-[#0b0b0c]/80 text-white hover:bg-[#202429]/80",
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

                          <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={isMessageLoading}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#feaa2b]/20 bg-[#feaa2b]/10 px-4 text-sm font-semibold text-[#ffd28a] transition hover:bg-[#feaa2b]/15 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isMessageLoading ? (
                              <CircularProgress size={15} thickness={5} sx={{ color: "#ffd28a" }} />
                            ) : (
                              <SendRoundedIcon sx={{ fontSize: 17 }} />
                            )}
                            Message
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsProfileActionsMenuOpen((prev) => !prev)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0b0b0c]/80 text-[#a8b3cf] transition hover:bg-[#202429]/80 hover:text-white active:scale-95"
                        aria-label="Profile options"
                      >
                        <MoreVertRoundedIcon sx={{ fontSize: 20 }} />
                      </button>

                      <AnimatePresence>
                        {isProfileActionsMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.16 }}
                            className="absolute right-0 top-[calc(100%+10px)] z-50 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0c] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
                          >
                            <button
                              type="button"
                              onClick={handleToggleBlockUser}
                              disabled={isBlockLoading}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#db7668] transition hover:bg-[#db4633]/10 hover:text-[#ff8b7d] disabled:opacity-60"
                            >
                              {isBlockLoading ? (
                                <CircularProgress size={15} thickness={5} sx={{ color: "#ff8b7d" }} />
                              ) : (
                                <BlockRoundedIcon sx={{ fontSize: 18 }} />
                              )}
                              {isBlockedProfile ? "Unblock user" : "Block user"}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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

              {hasBlockedRelationship ? (
                <div className="mt-8 rounded-2xl border border-orange-400/10 bg-orange-500/[0.04] p-8 text-center">
                  <h3 className="text-lg font-bold text-white">
                    {isBlockedProfile ? "You blocked this user" : "This profile is unavailable"}
                  </h3>

                  <p className="mx-auto mt-2 max-w-[520px] text-sm leading-6 text-[#8f97b1]">
                    {isBlockedProfile
                      ? "Recipes and interactions from this profile are hidden. You can manage blocked accounts from Account Settings."
                      : "You cannot view this profile or interact with this user."}
                  </p>
                </div>
              ) : (
                !isLoading && !isSearching && (
                  <ProfileRecipeGrid
                    recipes={visibleRecipes}
                    viewMode={viewMode}
                    currentUserId={null}
                    onRecipeClick={(recipe) => setSelectedRecipeId(recipe.id)}
                    onRecipeShare={handleShareRecipeFromGrid}
                  />
                )
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
              onAuthorClick={handleAuthorProfileClick}
              onShareRecipe={handleShareRecipeFromDrawer}
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

      <ShareRecipeModal
        isOpen={Boolean(recipeToShare)}
        currentUserId={currentUserId}
        recipe={recipeToShare}
        onClose={() => setRecipeToShare(null)}
        onShared={(username) => {
          showSnackbar(`Recipe shared with ${username}.`, "success")
          setRecipeToShare(null)
        }}
      />
    </div>
  )
}
