import { CircularProgress } from "@mui/material";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMyProfile } from "../hooks/useMyProfile";
import { useDebounce } from "../../recipe-review/hooks/useDebounce";
import { AnimatePresence } from "motion/react";
import { useMyProfileRecipes } from "../hooks/useMyProfileRecipes";

import Navigation from "../../../components/layout/Navigation";
import MyProfileHeader from "../components/MyProfileHeader";
import ProfileRecipeTabs, { ProfileRecipeTabItem, ProfileRecipeTabValue } from "../components/ProfileRecipeTabs";
import ProfileRecipeToolbar, { ProfileRecipeSortValue, ProfileRecipeViewMode } from "../components/ProfileRecipeToolbar";
import ProfileRecipeGrid, { ProfileRecipeGridItem } from "../components/ProfileRecipeGrid";
import ProfileRecipeGridSkeleton from "../components/ProfileRecipeGridSkeleton";
import MyProfileEditForm from "../components/MyProfileEditForm";
import { useSnackbar } from "../../../components/layout/SnackbarProvider";
import { Recipe } from "../../home/types";
import { CurrentUserCardData } from "../../home/types/recipeCard.types";
import { fetchProfileRecipeById, subscribeToProfileRecipeById } from "../services/profileRecipes.service";
import ViewRecipeDrawer from "../../home/components/recipe-view-drawer/ViewRecipeDrawer";
import PostRecipeDrawer from "../../home/components/post-recipe/PostRecipeDrawer";
import { useNavigate, useSearchParams } from "react-router-dom";
import DeleteWarningDialog from "../../home/components/recipe-view-drawer/DeleteWarningDialog";
import MyProfileEditFormLoading from "../components/MyProfileEditFormLoading";
import { ProfileConnectionType, subscribeToMyFollowingUserIds } from "../services/profileConnections.service";
import ProfileConnectionsModal from "../components/ProfileConnectionsModal";
import { blockUser, subscribeToBlockedByUserIds, subscribeToBlockedUserIds } from "../../account-settings/services/blockedUsers.service";
import { SharedRecipeMessage } from "../../messages/types/messages.types";
import ShareRecipeModal from "../../messages/components/ShareRecipeModal";

function ViewRecipeDrawerLoading({ width }: { width: number }) {
  return (
    <aside
      style={{ width, flexShrink: 0 }}
      className="sticky top-16 flex h-[calc(100vh-80px)] flex-col items-center justify-center overflow-hidden rounded-l-2xl border-l border-white/10 bg-gradient-to-b from-[#16181d]/80 via-[#16181d]/95 to-[#16181d] shadow-[-24px_0_80px_rgba(0,0,0,0.28)]"
    >
      <div className="flex flex-col items-center gap-4">
        <CircularProgress
          size={34}
          thickness={4.5}
          sx={{ color: "#feaa2b" }}
        />

        <p className="text-sm font-medium text-[#a8b3cf]">
          Loading recipe...
        </p>
      </div>
    </aside>
  )
}

export default function MyProfilePage() {
  const navigate = useNavigate()
  const [activeRecipeTab, setActiveRecipeTab] = useState<ProfileRecipeTabValue>("my-recipes")
  const { 
    userId,
    profile, 
    isLoading: isProfileLoading,
    isBannerUploading,
    isAvatarUploading,
    uploadBannerImage,
    uploadAvatarImage,
    isProfileSaving,
    saveProfile,
  } = useMyProfile()

  const {
    recipes,
    savedRecipes,
    isLoading: isRecipesLoading,
    isActionLoading,
    error: recipesError,
    deleteRecipe,
    setRecipes,
    setSavedRecipes,
  } = useMyProfileRecipes(userId)

  const [recipeDrawerWidth] = useState(540)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [isRecipeDrawerLoading, setIsRecipeDrawerLoading] = useState(false)
  
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [isRecipeEditLoading, setIsRecipeEditLoading] = useState(false)
  const isDrawerOpen = Boolean(
    selectedRecipe || editingRecipe || isRecipeDrawerLoading || isRecipeEditLoading
  )
  
  const { showSnackbar } = useSnackbar()
  
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 1000)
  const isSearching = searchQuery.trim() !== debouncedSearchQuery.trim()
  
  const [searchParams, setSearchParams] = useSearchParams()
  const recipeIdFromUrl = searchParams.get("recipeId")
  
  const [sortBy, setSortBy] = useState<ProfileRecipeSortValue>("latest")
  const [category, setCategory] = useState("all")
  const [viewMode, setViewMode] = useState<ProfileRecipeViewMode>("grid")
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isProfileEditLoading, setIsProfileEditLoading] = useState(false)
  
  const [recipeToDelete, setRecipeToDelete] = useState<ProfileRecipeGridItem | null>(null)
  
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

  const buildSharedRecipeFromGridItem = (
    recipe: ProfileRecipeGridItem
  ): SharedRecipeMessage => ({
    recipeId: recipe.id || "",
    title: recipe.title || "Untitled recipe",
    image: recipe.image || "",
    authorUsername: profile?.username || "Unknown",
    cuisine: recipe.category || "",
    meal: recipe.meal || "",
    difficulty: recipe.difficulty || "",
    durationMinutes: Number(recipe.durationMinutes || 0),
  })

  const handleShareRecipeFromDrawer = (recipe: Recipe) => {
    setRecipeToShare(buildSharedRecipeFromRecipe(recipe))
  }

  const handleShareRecipeFromGrid = (recipe: ProfileRecipeGridItem) => {
    setRecipeToShare(buildSharedRecipeFromGridItem(recipe))
  }

  const [followingUserIds, setFollowingUserIds] = useState<string[]>([])
  
  const [connectionsModalType, setConnectionsModalType] = useState<ProfileConnectionType | null>(null)
  
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([])
  const [blockedByUserIds, setBlockedByUserIds] = useState<string[]>([])
  const [isBlockLoading, setIsBlockLoading] = useState(false)
  
  const recipeTabs = useMemo<ProfileRecipeTabItem[]>(
    () => [
      {
        value: "my-recipes",
        label: "My recipes",
        count: recipes.filter((recipe) => recipe.status === "published").length,
      },
      {
        value: "saved-recipes",
        label: "Saved recipes",
        count: savedRecipes.length,
      },
      {
        value: "pending-recipes",
        label: "Pending",
        count: recipes.filter((recipe) => recipe.status === "pending").length,
      },
      {
        value: "needs-revision",
        label: "Needs revision",
        count: recipes.filter((recipe) => recipe.status === "needs_revision").length,
      },
      {
        value: "drafts",
        label: "Drafts",
        count: recipes.filter((recipe) => recipe.status === "draft").length,
      },
    ],[recipes, savedRecipes]
  )

  const categories = useMemo(
    () => ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"],[]
  )

  const currentUser = useMemo<CurrentUserCardData | null>(() => {
    if (!userId || !profile) return null

    return {
      uid: userId,
      username: profile.username || "",
      profileImage: profile.profileImage || "",
    }
  }, [userId, profile])

  useEffect(() => {
    if (!userId) {
      setFollowingUserIds([])
      return
    }

    const unsubscribe = subscribeToMyFollowingUserIds({
      userId,
      onChange: setFollowingUserIds,
      onError: (error) => {
        console.error("Failed to load following user ids:", error)
      },
    })

    return () => unsubscribe()
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setBlockedUserIds([])
      setBlockedByUserIds([])
      return
    }

    const unsubBlocked = subscribeToBlockedUserIds({
      userId,
      onChange: setBlockedUserIds,
      onError: (error) => console.error("Failed to load blocked users:", error),
    })

    const unsubBlockedBy = subscribeToBlockedByUserIds({
      userId,
      onChange: setBlockedByUserIds,
      onError: (error) => console.error("Failed to load blocked by users:", error),
    })

    return () => {
      unsubBlocked()
      unsubBlockedBy()
    }
  }, [userId])

  const handleBlockCommentAuthor = async (user: {
    userId: string
    username: string
    profileImage?: string
  }) => {
    if (!userId || user.userId === userId || isBlockLoading) return

    try {
      setIsBlockLoading(true)

      await blockUser({
        currentUserId: userId,
        targetUserId: user.userId,
        targetUsername: user.username || "User",
        targetProfileImage: user.profileImage || "",
      })

      setSavedRecipes((prev) =>
        prev.filter((recipe) => recipe.userId !== user.userId)
      )

      setBlockedUserIds((prev) =>
        prev.includes(user.userId) ? prev : [...prev, user.userId]
      )

      setFollowingUserIds((prev) => prev.filter((id) => id !== user.userId))

      showSnackbar(`${user.username} has been blocked.`, "success")
    } catch (error) {
      console.error("Failed to block comment author:", error)
      showSnackbar("Failed to block user. Please try again.", "error")
    } finally {
      setIsBlockLoading(false)
    }
  }

  const handleOpenRecipeDrawer = (recipe: ProfileRecipeGridItem) => {
    setEditingRecipe(null)
    setSelectedRecipeId(recipe.id)
  }

  const handleOpenProfileEditor = async () => {
    setIsProfileEditLoading(true)
    setIsEditingProfile(false)

    await new Promise((resolve) => setTimeout(resolve, 220))

    setIsEditingProfile(true)
    setIsProfileEditLoading(false)
  }

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
        console.error("Failed to subscribe to selected recipe:", error)
        showSnackbar("Failed to load recipe updates.", "error")
        setIsRecipeDrawerLoading(false)
      }
    )

    return () => unsubscribe()
  }, [selectedRecipeId, showSnackbar])

  const handleEditRecipe = async (recipe: Recipe) => {
    setIsRecipeEditLoading(true)
    setEditingRecipe(null)

    await new Promise((resolve) => setTimeout(resolve, 220))

    setEditingRecipe(recipe)
    setIsRecipeEditLoading(false)
  }

  const handleRatingStateChange = useCallback((recipeId: string, stats: {
    averageRating: number
    ratingsCount: number
    ratingSum?: number
  }) => {
    const nextRating = Number(stats.averageRating || 0)

    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, rating: nextRating }
          : recipe
      )
    )

    setSavedRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, rating: nextRating }
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
  }, [setRecipes, setSavedRecipes, showSnackbar])

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

    setSavedRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, commentsCount: normalizedCount }
          : recipe
      )
    )

    setSelectedRecipe((prev) => {
      if (!prev || prev.recipeId !== recipeId) return prev

      const currentCount = Number(prev.stats?.commentsCount || 0)
      if (currentCount === normalizedCount) return prev

      return {
        ...prev,
        stats: {
          ...prev.stats,
          commentsCount: normalizedCount,
        },
      }
    })
  }, [setRecipes, setSavedRecipes])

  const handleViewDrawerRecipeEdit = async (recipe: Recipe) => {
    const recipeId = recipe.recipeId || recipe.id

    if (recipe.status === "needs_revision") {
      navigate(`/needs-revision?recipeId=${recipeId}`)
      return
    }

    await handleEditRecipe(recipe)
  }

  const handleProfileRecipeEdit = async (recipe: ProfileRecipeGridItem) => {
    if (recipe.status === "needs_revision") {
      navigate(`/needs-revision?recipeId=${recipe.id}`)
      return
    }

    const fullRecipe = await fetchProfileRecipeById(recipe.id)

    handleEditRecipe(fullRecipe)
  }

  const handleAuthorProfileClick = useCallback((authorId: string) => {
    setSelectedRecipeId(null)
    setSelectedRecipe(null)
    setEditingRecipe(null)

    if (authorId === userId) {
      navigate("/profile")
      return
    }

    navigate(`/users/${authorId}`)
  }, [navigate, userId])

  const visibleRecipes = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase()
    const sourceRecipes = activeRecipeTab === "saved-recipes" ? savedRecipes : recipes
    const filteredBlockedRecipes = sourceRecipes.filter(
      (recipe) => !blockedUserIds.includes(recipe.userId)
    )

    const filteredByTab = filteredBlockedRecipes.filter((recipe) => {
      if (activeRecipeTab === "my-recipes") {
        return recipe.status === "published"
      }

      if (activeRecipeTab === "pending-recipes") {
        return recipe.status === "pending"
      }

      if (activeRecipeTab === "needs-revision") {
        return recipe.status === "needs_revision"
      }

      if (activeRecipeTab === "drafts") {
        return recipe.status === "draft"
      }

      if (activeRecipeTab === "saved-recipes") {
        return true
      }

      return true
    })


    const filteredBySearch = filteredByTab.filter((recipe) => {
      if (!query) return true

      return [
        recipe.title,
        recipe.meal,
        recipe.difficulty,
        recipe.category,
        recipe.status,
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
  }, [recipes, savedRecipes, activeRecipeTab, debouncedSearchQuery, category, sortBy])

  useEffect(() => {
    if (!recipeIdFromUrl) return

    setEditingRecipe(null)
    setSelectedRecipe(null)
    setSelectedRecipeId(recipeIdFromUrl)
  }, [recipeIdFromUrl])

  const handleCloseRecipeDrawer = () => {
    setSelectedRecipeId(null)
    setSelectedRecipe(null)

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete("recipeId")
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div className="relative min-h-screen bg-[#0d0e11] text-white">
      <div className="relative z-10">
        <Navigation />

        <div className="mx-auto flex w-full max-w-[1900px] items-start gap-6 px-6 pt-28 xl:px-10">
          <main 
            className={[
              "min-w-0 flex-1 transition-all duration-300",
              isDrawerOpen ? "max-w-none" : "mx-auto max-w-[1400px]",
            ].join(" ")}
          >
            {isProfileEditLoading ? (
              <MyProfileEditFormLoading />
            ): isEditingProfile ? (
              <MyProfileEditForm
                profile={profile}
                isSaving={isProfileSaving}
                onCancel={() => setIsEditingProfile(false)}
                onSave={async (payload) => {
                  try {
                    await saveProfile(payload)
                    setIsEditingProfile(false)
                    showSnackbar("Profile updated successfully.", "success")
                  } catch (error) {
                    console.error("Failed to update profile:", error)
                    showSnackbar("Failed to update profile. Please try again.", "error")
                  }
                }}
              />
            ): (
              <MyProfileHeader
                username={profile?.username || "User"}
                fullName={profile?.fullName || "User"}
                bio={profile?.bio || "Food lover & recipe creator."}
                profileImage={profile?.profileImage || ""}
                bannerImage={profile?.bannerImage || ""}
                location={profile?.location || "Location not set"}
                website={profile?.website || "Website not set"}
                joinedLabel={profile?.joinedLabel || "Joined recently"}
                recipesCount={recipes.length}
                followersCount={profile?.stats.followersCount || 0}
                followingCount={profile?.stats.followingCount || 0}
                onEditProfile={handleOpenProfileEditor}
                onChangeAvatar={uploadAvatarImage}
                isAvatarUploading={isAvatarUploading}
                onChangeBanner={uploadBannerImage}
                isBannerUploading={isBannerUploading}
                onFollowersClick={() => setConnectionsModalType("followers")}
                onFollowingClick={() => setConnectionsModalType("following")}
              />
            )}

            <div className="sticky top-16 z-40 bg-[#0d0e11] pb-5">
              <ProfileRecipeTabs
                activeTab={activeRecipeTab}
                onTabChange={setActiveRecipeTab}
                tabs={recipeTabs}
              />

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


            {(isRecipesLoading || isSearching) && (
              <ProfileRecipeGridSkeleton viewMode={viewMode} count={8} />
            )}

            {recipesError && (
              <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">
                {recipesError}
              </div>
            )}

            {!isRecipesLoading && !isSearching && !recipesError && (
              <ProfileRecipeGrid
                recipes={visibleRecipes}
                viewMode={viewMode}
                currentUserId={userId}
                onRecipeClick={handleOpenRecipeDrawer}
                onRecipeEdit={handleProfileRecipeEdit}
                onRecipeDelete={(recipe) => {
                  setRecipeToDelete(recipe)
                }}
                onRecipeShare={handleShareRecipeFromGrid}
              />
            )}
          </main>

          <ProfileConnectionsModal
            isOpen={Boolean(connectionsModalType)}
            userId={userId}
            currentUserId={userId}
            type={connectionsModalType || "followers"}
            onClose={() => setConnectionsModalType(null)}
          />

          <AnimatePresence mode="wait">
            {(isRecipeDrawerLoading || isRecipeEditLoading) && (
              <ViewRecipeDrawerLoading width={recipeDrawerWidth} />
            )}

            {!isRecipeDrawerLoading && !isRecipeEditLoading && editingRecipe && currentUser &&  (
              <PostRecipeDrawer
                currentUser={currentUser}
                mode="edit"
                variant="inline"
                width={recipeDrawerWidth}
                recipeToEdit={editingRecipe}
                onClose={() => setEditingRecipe(null)}
                onSubmitSuccess={() => setEditingRecipe(null)}
                onUpdateSuccess={() => {
                  showSnackbar("Recipe updated and sent for review.", "success")
                  setEditingRecipe(null)
                }}
              />
            )}   

            {!isRecipeDrawerLoading && !isRecipeEditLoading && !editingRecipe && selectedRecipe && currentUser && (
              <ViewRecipeDrawer
                presentation="inline"
                width={recipeDrawerWidth}
                recipe={selectedRecipe}
                currentUser={currentUser}
                savedRecipes={savedRecipes.map((recipe) => ({
                  recipeId: recipe.id,
                }))}
                followingUserIds={followingUserIds}
                authorFollowersCount={
                  Number(selectedRecipe.author?.followersCount || 0)
                }
                onShareRecipe={handleShareRecipeFromDrawer}
                onAuthorClick={handleAuthorProfileClick}
                onClose={handleCloseRecipeDrawer}
                onFollowStateChange={handleFollowStateChange}
                onFavoriteStateChange={(recipeId, isNowSaved) => {
                  if (!selectedRecipe) return

                  if (isNowSaved) {
                    showSnackbar("Recipe saved.", "success")
                    return
                  }

                  showSnackbar("Recipe removed from saved recipes.", "info")

                  if (activeRecipeTab === "saved-recipes") {
                    setSelectedRecipeId(null)
                    setSelectedRecipe(null)
                  }
                }}
                onRatingStateChange={handleRatingStateChange}
                onCommentStateChange={handleCommentStateChange}
                onEditRecipe={handleViewDrawerRecipeEdit}
                onDeleteRecipe={(recipeId) => {
                  deleteRecipe(recipeId)
                  setSelectedRecipe(null)
                  setEditingRecipe(null)
                }}
                onBlockUser={handleBlockCommentAuthor}
                blockedUserIds={blockedUserIds}
                blockedByUserIds={blockedByUserIds}
              />
            )} 
          </AnimatePresence>

          <DeleteWarningDialog
            isOpen={Boolean(recipeToDelete)}
            isDeleting={isActionLoading}
            title="Delete recipe?"
            description={
              recipeToDelete
                ? `Are you sure you want to delete "${recipeToDelete.title}"? This action cannot be undone. The recipe, its ingredients, steps, comments and ratings will no longer be available.`
                : "This action cannot be undone. The recipe, its ingredients, steps, comments and ratings will no longer be available."
            }
            confirmLabel="Delete"
            onCancel={() => {
              if (isActionLoading) return
              setRecipeToDelete(null)
            }}
            onConfirm={async () => {
              if (!recipeToDelete) return

              try {
                await deleteRecipe(recipeToDelete.id)

                if (selectedRecipeId === recipeToDelete.id) {
                  setSelectedRecipeId(null)
                  setSelectedRecipe(null)
                }

                if (editingRecipe?.recipeId === recipeToDelete.id) {
                  setEditingRecipe(null)
                }

                setRecipeToDelete(null)
                showSnackbar("Recipe deleted successfully.", "success")
              } catch (error) {
                console.error("Failed to delete recipe:", error)
                showSnackbar("Failed to delete recipe. Please try again.", "error")
              }
            }}
          />

          <ShareRecipeModal
            isOpen={Boolean(recipeToShare)}
            currentUserId={userId}
            recipe={recipeToShare}
            onClose={() => setRecipeToShare(null)}
            onShared={(username) => {
              showSnackbar(`Recipe shared with ${username}.`, "success")
              setRecipeToShare(null)
            }}
          />
        </div>
      </div>
    </div>
  )
}
