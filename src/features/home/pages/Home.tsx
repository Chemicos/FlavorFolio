import { useEffect, useMemo, useRef, useState } from "react"
import FilterDrawer, { defaultRecipeFilters, RecipeFilters } from "../components/FilterDrawer"
import Content from "../components/Content.js"

import ScrollToTopButton from "../components/ScrollToTopButton"
import FilterBar from "../components/FilterBar"
import FeedTabs from "../components/FeedTabs"
import { AnimatePresence, motion } from "motion/react"
import { useHomeData } from "../hooks/useHomeData"
import { Recipe } from "../types"
import ViewRecipeDrawer from "../components/recipe-view-drawer/ViewRecipeDrawer"
import PostRecipeDrawer from "../components/post-recipe/PostRecipeDrawer"
import { useNavigate, useSearchParams } from "react-router-dom"
import { blockUser, subscribeToBlockedByUserIds, subscribeToBlockedUserIds } from "../../account-settings/services/blockedUsers.service"
import ShareRecipeModal from "../../messages/components/ShareRecipeModal"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import { CircularProgress } from "@mui/material"
import { fetchRecipeById } from "../services/recipes.service"
import DeleteWarningDialog from "../components/recipe-view-drawer/DeleteWarningDialog"
import { useUserCapabilities } from "../../../components/permissions/UserCapabilitiesContext"

export type CreatePostType = "recipe" | "reel"

export default function Home() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const recipeIdFromUrl = searchParams.get("recipeId")
  
  const [activeTab, setActiveTab] = useState("For You")
  const [isFeedTabChanging, setIsFeedTabChanging] = useState(false)
  const feedTabLoadingTimerRef = useRef<number | null>(null)
  //Filtering
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [filters, setFilters] = useState<RecipeFilters>(defaultRecipeFilters)

  const [searchQuery, setSearchQuery] = useState("")
  const { showSnackbar } = useSnackbar()

  const [isPostFormVisible, setIsPostFormVisible] = useState(false)
  const [selectedPostType, setSelectedPostType] = useState<CreatePostType>("recipe")
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [isRecipeDrawerLoading, setIsRecipeDrawerLoading] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [recipeToShare, setRecipeToShare] = useState<Recipe | null>(null)

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([])
  const [blockedByUserIds, setBlockedByUserIds] = useState<string[]>([])
  const [userToBlock, setUserToBlock] = useState<{
    userId: string
    username: string
    profileImage?: string
  } | null>(null)
  const [isBlockingUser, setIsBlockingUser] = useState(false)

  const {restrictions} = useUserCapabilities()

  const isRecipeViewOpen = Boolean(selectedRecipe) || isRecipeDrawerLoading
  const isPostViewOpen = isPostFormVisible
  const isAnyOverlayOpen = isFilterDrawerOpen || isRecipeViewOpen || isPostViewOpen
  
  const recipeViewLoadingTimerRef = useRef<number | null>(null)
  // const isLargeDesktop = useMediaQuery("(min-width:1930px)")
  // const RECIPE_DRAWER_WIDTH = 540
  // const LAYOUT_GAP = 24
  // const isPostDrawerOpen = isPostFormVisible

  // const {setFloatingMessagesRightOffset} = useAppLayout()
  // const floatingActionsRightOffset = isPostDrawerOpen && !isLargeDesktop
  //   ? RECIPE_DRAWER_WIDTH + LAYOUT_GAP + 24 : 24

  const {
    activeRecipes,
    availableCuisines,
    currentUser,
    savedRecipes,
    followingUserIds,
    authorFollowersCountMap,
    isLoading,
    isFiltering,
    hasMoreRecipes,
    isFetchingMoreRecipes,
    fetchMoreRecipes,
    handleFavoriteStateChange,
    handleFollowStateChange,
    handleRatingStateChange,
    handleCommentStateChange,
    handleRecipeDeleteStateChange
  } = useHomeData({activeTab, filters})
  
  const handleResetFilters = () => {
    setFilters(defaultRecipeFilters)
  }

  // useEffect(() => {
  //   setFloatingMessagesRightOffset(floatingActionsRightOffset)

  //   return () => {
  //     setFloatingMessagesRightOffset(24)
  //   }
  // }, [floatingActionsRightOffset, setFloatingMessagesRightOffset])

  const selectedRecipeId = selectedRecipe?.recipeId || selectedRecipe?.id || null

  useEffect(() => {
    if (!recipeIdFromUrl) {
      return
    }

    if (selectedRecipeId === recipeIdFromUrl) return

    let isCancelled = false

    async function openRecipeFromUrl() {
      setIsPostFormVisible(false)
      setEditingRecipe(null)

      const localRecipe = activeRecipes.find((recipe) => {
        const recipeId = recipe.recipeId || recipe.id

        return recipeId === recipeIdFromUrl
      })

      if (localRecipe) {
        setSelectedRecipe(localRecipe)
        return
      }

      try {
        setIsRecipeDrawerLoading(true)

        const recipe = await fetchRecipeById(recipeIdFromUrl)

        if (isCancelled) return

        if (!recipe) {
          showSnackbar("Recipe not found.", "error")

          setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams)
            nextParams.delete("recipeId")
            return nextParams
          }, {
            replace: true,
          })

          setSelectedRecipe(null)
          return
        }

        setSelectedRecipe(recipe)
      } catch (error) {
        console.error("Failed to open recipe from search:", error)

        if (!isCancelled) {
          showSnackbar("Failed to load recipe.", "error")
          setSelectedRecipe(null)
        }
      } finally {
        if (!isCancelled) {
          setIsRecipeDrawerLoading(false)
        }
      }
    }

    openRecipeFromUrl()

    return () => {
      isCancelled = true
    }
  }, [
    recipeIdFromUrl,
    activeRecipes,
    selectedRecipeId,
    setSearchParams,
    showSnackbar,
  ])

  useEffect(() => {
    if (!currentUser?.uid) {
      setBlockedUserIds([])
      setBlockedByUserIds([])
      return
    }

    const unsubBlocked = subscribeToBlockedUserIds({
      userId: currentUser.uid,
      onChange: setBlockedUserIds,
      onError: console.error,
    })

    const unsubBlockedBy = subscribeToBlockedByUserIds({
      userId: currentUser.uid,
      onChange: setBlockedByUserIds,
      onError: console.error,
    })

    return () => {
      unsubBlocked()
      unsubBlockedBy()
    }
  }, [currentUser?.uid])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow

    if (isAnyOverlayOpen) {
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isAnyOverlayOpen])

  useEffect(() => {
    const raw = sessionStorage.getItem("authFeedback")
    if (!raw) return

    try {
      const parsed = JSON.parse(raw)
      showSnackbar(parsed.message || "Authentication successful.", "success")
    } catch (error) {
      console.error("Failed to parse auth feedback:", error)
    } finally {
      sessionStorage.removeItem("authFeedback")
    }
  }, [])

  const startRecipeViewLoading = () => {
    if (recipeViewLoadingTimerRef.current) {
      window.clearTimeout(recipeViewLoadingTimerRef.current)
    }

    setIsRecipeDrawerLoading(true)

    recipeViewLoadingTimerRef.current = window.setTimeout(() => {
      setIsRecipeDrawerLoading(false)
      recipeViewLoadingTimerRef.current = null
    }, 220)
  }

  useEffect(() => {
    return () => {
      if (recipeViewLoadingTimerRef.current) {
        window.clearTimeout(recipeViewLoadingTimerRef.current)
      }

      if (feedTabLoadingTimerRef.current) {
        window.clearTimeout(feedTabLoadingTimerRef.current)
      }
    }
  }, [])

  const handleAuthorProfileClick = (authorId: string) => {
    setSelectedRecipe(null)

    if (authorId === currentUser?.uid) {
      navigate("/profile")
      return
    }

    navigate(`/users/${authorId}`)
  }

  const handleConfirmBlockUser = async () => {
    if (!currentUser?.uid || !userToBlock) return

    try {
      setIsBlockingUser(true)

      await blockUser({
        currentUserId: currentUser.uid,
        targetUserId: userToBlock.userId,
        targetUsername: userToBlock.username,
        targetProfileImage: userToBlock.profileImage || "",
      })

      showSnackbar(`${userToBlock.username} has been blocked.`, "success")

      setUserToBlock(null)
    } catch (error) {
      console.error(error)
      showSnackbar("Failed to block user.", "error")
    } finally {
      setIsBlockingUser(false)
    }
  }

  const handleRecipeSubmitSuccess = () => {
    showSnackbar("Recipe submitted successfully. You'll be notified once it has been reviewed by an administrator.", "success")
    setIsPostFormVisible(false)
  }

  const handleReelSubmitSuccess = () => {
    showSnackbar("Reel submitted successfully. You'll be notified once it has been reviewed by an administrator.", "success")
    setIsPostFormVisible(false)
    setSelectedPostType("recipe")
  }
  
  const handlePostClick = (postType: CreatePostType) => {
    if (postType === "recipe" && !restrictions.canPostRecipes) {
      showSnackbar("Your account is currently restricted from publishing recipes.", "error")
      return
    }
    if (postType === "reel" && !restrictions.canPostReels) {
      showSnackbar("Your account is currently restricted from publishing reels.", "error")
      return
    }

    setSelectedRecipe(null)
    setEditingRecipe(null)
    setIsRecipeDrawerLoading(false)

    setSelectedPostType(postType)
    setIsPostFormVisible(true)

    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.delete("recipeId")
      return nextParams
    }, {
      replace: true,
    })
  }

  const handleRecipeClick = (recipe: Recipe) => {
    const recipeId = recipe.recipeId || recipe.id

    if (!recipeId) return

    setIsPostFormVisible(false)
    setEditingRecipe(null)
    setSelectedRecipe(recipe)

    startRecipeViewLoading()

    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.set("recipeId", recipeId)
      return nextParams
    }, {
      replace: true,
    })
  }

  const handleCloseRecipeDrawer = () => {
    if (recipeViewLoadingTimerRef.current) {
      window.clearTimeout(recipeViewLoadingTimerRef.current)
      recipeViewLoadingTimerRef.current = null
    }

    setSelectedRecipe(null)
    setIsRecipeDrawerLoading(false)

    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.delete("recipeId")
      return nextParams
    }, {
      replace: true,
    })
  }

  const handleEditRecipe = (recipe: Recipe) => {
    setSelectedRecipe(null)
    setEditingRecipe(recipe)
    setSelectedPostType("recipe")
    setIsPostFormVisible(true)

    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.delete("recipeId")
      return nextParams
    }, {
      replace: true,
    })
  }

  const handleRecipeDeleteSuccess = (recipeId: string) => {
    handleRecipeDeleteStateChange(recipeId)
    showSnackbar("Recipe deleted successfully.", "success")

    setSelectedRecipe(null)

    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.delete("recipeId")
      return nextParams
    }, {
      replace: true,
    })
  }

  const handleClosePostRecipeDrawer = () => {
    setIsPostFormVisible(false)
    setEditingRecipe(null)
    setSelectedPostType("recipe")
  }

  const handleRecipeUpdateSuccess = () => {
    showSnackbar(
      "Recipe changes saved as draft.", 
      "success",
      {label: "View Revision & Drafts", onClick: () => navigate("/needs-revision")}
    )
    setEditingRecipe(null)
    setIsPostFormVisible(false)
  }

  const searchedRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return activeRecipes

    return activeRecipes.filter((recipe) => {
      const searchableText = [
        recipe.title,
        recipe.description,
        recipe.cuisine,
        recipe.meal,
        recipe.difficulty,
        recipe.user,
        recipe.author?.username,
        ...(recipe.ingredients || []).map((item) => item.ingredient),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [activeRecipes, searchQuery])

  const blockedRelationshipUserIds = useMemo(
    () => new Set([...blockedUserIds, ...blockedByUserIds]),
    [blockedUserIds, blockedByUserIds]
  )

  const visibleSearchedRecipes = useMemo(() => {
    return searchedRecipes.filter(
      (recipe) => !blockedRelationshipUserIds.has(recipe.userId || "")
    )
  }, [searchedRecipes, blockedRelationshipUserIds])

  const handleShareRecipe = (recipe: Recipe) => {
    setRecipeToShare(recipe)
    setIsShareModalOpen(true)
  }

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return

    if (feedTabLoadingTimerRef.current) {
      window.clearTimeout(feedTabLoadingTimerRef.current)
    }

    setIsFeedTabChanging(true)

    setActiveTab(tab)
    setSearchQuery("")
    setSelectedRecipe(null)
    setEditingRecipe(null)
    setIsPostFormVisible(false)
    setIsRecipeDrawerLoading(false)

    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.delete("recipeId")
      return nextParams
    }, {
      replace: true,
    })

    feedTabLoadingTimerRef.current = window.setTimeout(() => {
      setIsFeedTabChanging(false)
      feedTabLoadingTimerRef.current = null
    }, 300)
  }

  const sharedRecipe = recipeToShare
    ? {
        recipeId: recipeToShare.recipeId || recipeToShare.id || "",
        title: recipeToShare.title || "Untitled recipe",
        image: recipeToShare.image || "",
        authorUsername:
          recipeToShare.authorUsername ||
          recipeToShare.username ||
          recipeToShare.user ||
          "Unknown",
        cuisine: recipeToShare.cuisine || "",
        meal: recipeToShare.meal || "",
        difficulty: recipeToShare.difficulty || "",
        durationMinutes: Number(recipeToShare.durationMinutes || 0),
      }
    : null

    const handleRecipeDrawerFollowStateChange = (
      authorId: string,
      isNowFollowing: boolean
    ) => {
      handleFollowStateChange(authorId, isNowFollowing)

      const authorUsername =
        selectedRecipe?.author?.username ||
        selectedRecipe?.user ||
        "this user"

      if (isNowFollowing) {
        showSnackbar(`You are now following ${authorUsername}.`, "success")
        return
      }

      showSnackbar(`You unfollowed ${authorUsername}.`, "info")
    }

    const handleRecipeDrawerRatingStateChange = (
      recipeId: string,
      stats: {
        averageRating: number
        ratingsCount: number
        ratingsSum?: number
        ratingSum?: number
      }
    ) => {
      handleRatingStateChange(recipeId, {
        averageRating: stats.averageRating,
        ratingsCount: stats.ratingsCount,
        ratingsSum:
          stats.ratingsSum ??
          stats.ratingSum ??
          0,
      })

      showSnackbar("Recipe rating updated successfully.", "success")
    }
  
  return (
    <div  className="relative min-h-screen w-full overflow-x-clip bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <div className="relative">
        <div className="mx-auto flex w-full max-w-[1900px] items-start gap-6 px-6 pt-20 xl:px-10">
          <main className="mx-auto min-w-0 w-full max-w-[1320px] flex-1">
            <div>
              <FeedTabs
                activeTab={activeTab}
                // onTabChange={setActiveTab}
                onTabChange={handleTabChange}
              />

              <FilterBar
                filters={filters}
                onChangeFilters={setFilters}
                onResetFilters={handleResetFilters}
              />  
            </div>

            <div className="mt-8">        
              <Content
                recipes={visibleSearchedRecipes}
                isLoading={isLoading || isFeedTabChanging}
                isFiltering={isFiltering}
                title={activeTab}
                onOpenFilters={() => setIsFilterDrawerOpen(true)}
                currentUser={currentUser}
                savedRecipes={savedRecipes}
                followingUserIds={followingUserIds}
                authorFollowersCountMap={authorFollowersCountMap}
                onFollowStateChange={handleFollowStateChange}
                onFavoriteStateChange={handleFavoriteStateChange}
                activeTab={activeTab}
                filters={filters}
                onRecipeClick={handleRecipeClick}
                onCreatePost={handlePostClick}
                hasMoreRecipes={hasMoreRecipes}
                isFetchingMoreRecipes={isFetchingMoreRecipes}
                onFetchMoreRecipes={fetchMoreRecipes}
              />
            </div>
          </main>

          <AnimatePresence>
            {isPostFormVisible && (
              <motion.div
                className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-5 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(event) => {
                  if (event.target === event.currentTarget) {
                    handleClosePostRecipeDrawer()
                  }
                }}
              >
                <PostRecipeDrawer
                  key={editingRecipe ? `edit-${editingRecipe.recipeId || editingRecipe.id}` : `create-${selectedPostType}`}
                  postType={editingRecipe ? "recipe" : selectedPostType}
                  onClose={handleClosePostRecipeDrawer}
                  currentUser={currentUser}
                  onSubmitSuccess={handleRecipeSubmitSuccess}
                  onReelSubmitSuccess={handleReelSubmitSuccess}
                  mode={editingRecipe ? "edit" : "create"}
                  recipeToEdit={editingRecipe}
                  onUpdateSuccess={handleRecipeUpdateSuccess}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(selectedRecipe || isRecipeDrawerLoading) && (
              <motion.div
                className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-5 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{duration: 0.2, ease: "easeOut"}}
                onClick={(event) => {
                  if (event.target === event.currentTarget) {
                    handleCloseRecipeDrawer()
                  }
                }}
              >
                {isRecipeDrawerLoading ? (
                  <CircularProgress
                    size={34}
                    thickness={4.5}
                    sx={{ color: "var(--accent)" }}
                  />
                ) : selectedRecipe ? (
                  <ViewRecipeDrawer
                    recipe={selectedRecipe}
                    onShareRecipe={handleShareRecipe}
                    currentUser={currentUser}
                    savedRecipes={savedRecipes}
                    followingUserIds={followingUserIds}
                    authorFollowersCount={
                      authorFollowersCountMap[selectedRecipe.userId || ""] ??
                      Number(selectedRecipe.author?.followersCount || 0)
                    }
                    onAuthorClick={handleAuthorProfileClick}
                    onClose={handleCloseRecipeDrawer}
                    onFavoriteStateChange={(recipeId, isNowSaved) => {
                      handleFavoriteStateChange(recipeId, isNowSaved)

                      showSnackbar(
                        isNowSaved
                          ? "Recipe saved."
                          : "Recipe removed from saved recipes.",
                        isNowSaved ? "success" : "info"
                      )
                    }}
                    onFollowStateChange={handleRecipeDrawerFollowStateChange}
                    onRatingStateChange={handleRecipeDrawerRatingStateChange}
                    onCommentStateChange={handleCommentStateChange}
                    onEditRecipe={handleEditRecipe}
                    onDeleteRecipe={handleRecipeDeleteSuccess}
                    onBlockUser={setUserToBlock}
                    blockedUserIds={blockedUserIds}
                    blockedByUserIds={blockedByUserIds}
                  />
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>        
        </div>

        <ScrollToTopButton rightOffset={24} />

        <ShareRecipeModal
            isOpen={isShareModalOpen}
            currentUserId={currentUser?.uid || null}
            recipe={sharedRecipe}
            onClose={() => {
                setIsShareModalOpen(false)
                setRecipeToShare(null)
            }}
            onShared={(username) => {
                showSnackbar(`Recipe shared with ${username}`, "success")
            }}
        />

        <DeleteWarningDialog 
          isOpen={Boolean(userToBlock)}
          isDeleting={isBlockingUser}
          title={`Block ${userToBlock?.username}?`}
          description="You won't see this user's recipes, comments or profile anymore. They also won't be able to interact with your content."
          confirmLabel="Block"
          onCancel={() => setUserToBlock(null)}
          onConfirm={handleConfirmBlockUser}
        />
      </div>

      <AnimatePresence>
        {isFilterDrawerOpen && (
          <FilterDrawer
            isOpen={isFilterDrawerOpen}
            filters={filters}
            availableCuisines={availableCuisines}
            onClose={() => setIsFilterDrawerOpen(false)}
            onChange={setFilters}
            onReset={() => setFilters(defaultRecipeFilters)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
