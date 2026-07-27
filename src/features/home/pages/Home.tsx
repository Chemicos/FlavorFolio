import { useEffect, useMemo, useState } from "react"
import FilterDrawer, { defaultRecipeFilters, RecipeFilters } from "../components/FilterDrawer"
import Navigation from "../../../components/layout/Navigation"
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
import { subscribeToBlockedByUserIds, subscribeToBlockedUserIds } from "../../account-settings/services/blockedUsers.service"
import ShareRecipeModal from "../../messages/components/ShareRecipeModal"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import { CircularProgress, useMediaQuery } from "@mui/material"
import { fetchRecipeById } from "../services/recipes.service"

export type CreatePostType = "recipe" | "reel"

export default function Home() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const recipeIdFromUrl = searchParams.get("recipeId")
  
  const [activeTab, setActiveTab] = useState("For You")
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

  const isAnyOverlayOpen = isFilterDrawerOpen

  const isLargeDesktop = useMediaQuery("(min-width:1930px)")
  const RECIPE_DRAWER_WIDTH = 540
  const LAYOUT_GAP = 24
  const isInlineDrawerOpen = Boolean(selectedRecipe) || isPostFormVisible || Boolean(editingRecipe) || isRecipeDrawerLoading

  const floatingActionsRightOffset = isInlineDrawerOpen && !isLargeDesktop
    ? RECIPE_DRAWER_WIDTH + LAYOUT_GAP + 24
    : 24


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

  useEffect(() => {
    if (!recipeIdFromUrl) {
      return
    }

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
        setIsRecipeDrawerLoading(false)
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

  const handleAuthorProfileClick = (authorId: string) => {
    setSelectedRecipe(null)

    if (authorId === currentUser?.uid) {
      navigate("/profile")
      return
    }

    navigate(`/users/${authorId}`)
  }

  const handleRecipeSubmitSuccess = () => {
    showSnackbar("Recipe submitted successfully. You'll be notified once it has been reviewed by an administrator.", "success")
    // setsnackbarMessage(
    //   "Recipe submitted successfully. You'll be notified once it has been reviewed by an administrator."
    // )
    // setSnackbarOpen(true)
    setIsPostFormVisible(false)
  }

  const handleReelSubmitSuccess = () => {
    showSnackbar("Reel published successfully. It is now available in the Reels feed.", "success")
    setIsPostFormVisible(false)
    setSelectedPostType("recipe")
  }
  
  const handlePostClick = (postType: CreatePostType) => {
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

  // const handleFeedbackClick = () => {
  //   setIsFeedbackVisible(true)
  // }

  const handleRecipeClick = (recipe: Recipe) => {
    const recipeId = recipe.recipeId || recipe.id

    if (!recipeId) return

    setIsPostFormVisible(false)
    setEditingRecipe(null)
    setSelectedRecipe(recipe)

    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.set("recipeId", recipeId)
      return nextParams
    })
  }

  const handleCloseRecipeDrawer = () => {
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
    showSnackbar("Recipe updated successfully. You'll be notified once it has been reviewed by an administrator.", "success")
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
    // setSelectedRecipe(null)
    setRecipeToShare(recipe)
    setIsShareModalOpen(true)
  }

  const handleTabChange = (tab: string) => {
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
    <div 
      className="relative min-h-screen w-full overflow-x-clip bg-[#0d0e11]"
      style={{
        background: `
          radial-gradient(circle at 15% 0%, rgba(255,145,0,0.08), transparent 30%),
          radial-gradient(circle at 90% 10%, rgba(255,255,255,0.025), transparent 25%),
          radial-gradient(circle at 50% 100%, rgba(255,170,60,0.04), transparent 45%),
          linear-gradient(180deg, #0d0e11 0%, #090909 100%)
        `,
      }}
    >
    <div className="relative z-10">
      <Navigation floatingMessagesRightOffset={floatingActionsRightOffset} />

      <div className="mx-auto flex w-full max-w-[1900px] items-start gap-6 px-6 pt-20 xl:px-10">
        <main
          className={[
            "min-w-0 flex-1 transition-[max-width,width] duration-300 ease-out",
            isInlineDrawerOpen ? "max-w-none" : "mx-auto max-w-[1400px]",
          ].join(" ")}
        >
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
              // recipes={activeRecipes}
              recipes={visibleSearchedRecipes}
              isLoading={isLoading}
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

        <AnimatePresence mode="wait">
          {isInlineDrawerOpen && (
            <motion.div
              key={
                isRecipeDrawerLoading
                  ? `loading-${recipeIdFromUrl}`
                  : editingRecipe
                    ? `edit-${editingRecipe.recipeId || editingRecipe.id}`
                    : isPostFormVisible
                      ? `create-${selectedPostType}`
                      : `view-${selectedRecipe?.recipeId || selectedRecipe?.id}`
              }
              initial={{ opacity: 0, }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, }}
              transition={{
                duration: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="sticky top-20 self-start"
              style={{
                width: RECIPE_DRAWER_WIDTH,
                flexShrink: 0,
              }}
            >
              {isRecipeDrawerLoading ? (
                <aside className="flex h-[calc(100vh-96px)] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#16181d] shadow-[-24px_0_80px_rgba(0,0,0,0.28)]">
                  <CircularProgress
                    size={34}
                    thickness={4.5}
                    sx={{ color: "#feaa2b" }}
                  />

                  <p className="mt-4 text-sm font-medium text-[#a8b3cf]">
                    Loading recipe...
                  </p>
                </aside>
              ) : isPostFormVisible ? (
                <PostRecipeDrawer
                  variant="inline"
                  width={RECIPE_DRAWER_WIDTH}
                  postType={editingRecipe ? "recipe" : selectedPostType}
                  onClose={handleClosePostRecipeDrawer}
                  currentUser={currentUser}
                  onSubmitSuccess={handleRecipeSubmitSuccess}
                  onReelSubmitSuccess={handleReelSubmitSuccess}
                  mode={editingRecipe ? "edit" : "create"}
                  recipeToEdit={editingRecipe}
                  onUpdateSuccess={handleRecipeUpdateSuccess}
                />
              ) : selectedRecipe ? (
                <ViewRecipeDrawer
                  presentation="inline"
                  width={RECIPE_DRAWER_WIDTH}
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
                  blockedUserIds={blockedUserIds}
                  blockedByUserIds={blockedByUserIds}
                />
              ) : null}
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>

      {/* <FloatingSpeedDial /> */}
      <ScrollToTopButton rightOffset={floatingActionsRightOffset} />

      {/* <AnimatePresence>
        {isPostFormVisible && (
          <PostRecipeDrawer 
            onClose={handleClosePostRecipeDrawer} 
            currentUser={currentUser} 
            onSubmitSuccess={handleRecipeSubmitSuccess}
            mode={editingRecipe ?  "edit" : "create"}
            recipeToEdit={editingRecipe}
            onUpdateSuccess={handleRecipeUpdateSuccess}
          />
        )}
      </AnimatePresence> */}

      {/* {isFeedbackVisible && <Feedback onClose={handleClose} />} */}
      
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
    </div>
  </div>
  )
}
