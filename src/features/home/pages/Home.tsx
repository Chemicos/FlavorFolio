import { useEffect, useMemo, useState } from "react"
import FilterDrawer, { defaultRecipeFilters, RecipeFilters } from "../components/FilterDrawer"
import Navigation from "../../../components/layout/Navigation"
import Content from "../components/Content.js"

import ScrollToTopButton from "../components/ScrollToTopButton"
import FilterBar from "../components/FilterBar"
import FeedTabs from "../components/FeedTabs"
import { AnimatePresence } from "motion/react"
import { useHomeData } from "../hooks/useHomeData"
import { Recipe } from "../types"
import ViewRecipeDrawer from "../components/recipe-view-drawer/ViewRecipeDrawer"
import PostRecipeDrawer from "../components/post-recipe/PostRecipeDrawer"
import { useNavigate } from "react-router-dom"
import { subscribeToBlockedByUserIds, subscribeToBlockedUserIds } from "../../account-settings/services/blockedUsers.service"
import ShareRecipeModal from "../../messages/components/ShareRecipeModal"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"

export default function Home() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("For You")
  //Filtering
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [filters, setFilters] = useState<RecipeFilters>(defaultRecipeFilters)

  const [searchQuery, setSearchQuery] = useState("")
  const { showSnackbar } = useSnackbar()

  const [isPostFormVisible, setIsPostFormVisible] = useState(false)
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false)

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [recipeToShare, setRecipeToShare] = useState<Recipe | null>(null)

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([])
  const [blockedByUserIds, setBlockedByUserIds] = useState<string[]>([])

  const isAnyOverlayOpen = isPostFormVisible || Boolean(editingRecipe) || Boolean(selectedRecipe) || isFilterDrawerOpen

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
      // setsnackbarMessage(parsed.message || "Authentication successful.")
      // setSnackbarOpen(true)
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
  
  const handlePostClick = () => {
    setIsPostFormVisible(true)
  }

  const handleFeedbackClick = () => {
    setIsFeedbackVisible(true)
  }

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
  }

  const handleCloseRecipeDrawer = () => {
    setSelectedRecipe(null)
  }

  const handleEditRecipe = (recipe: Recipe) => {
    setSelectedRecipe(null)
    setEditingRecipe(recipe)
    setIsPostFormVisible(true)
  }

  const handleRecipeDeleteSuccess = (recipeId: string) => {
    handleRecipeDeleteStateChange(recipeId)
    showSnackbar("Recipe deleted successfully.", "success")
    // setsnackbarMessage("Recipe deleted successfully.")
    // setSnackbarOpen(true)
    setSelectedRecipe(null)
  }

  const handleClosePostRecipeDrawer = () => {
    setIsPostFormVisible(false)
    setEditingRecipe(null)
  }

  const handleRecipeUpdateSuccess = () => {
    showSnackbar("Recipe updated successfully. You'll be notified once it has been reviewed by an administrator.", "success")
    // setsnackbarMessage("Recipe updated successfully. You'll be notified once it has been reviewed by an administrator.")
    // setSnackbarOpen(true)
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
    setSelectedRecipe(null)
    setRecipeToShare(recipe)
    setIsShareModalOpen(true)
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
  
  return (
    <div 
      className="relative min-h-screen w-full overflow-x-hidden bg-[#0d0e11]"
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
      <Navigation onFeedbackClick={handleFeedbackClick} />

      <div className="mx-auto mt-[6rem] w-full max-w-[1400px] px-6 xl:px-10">
        <FeedTabs
          activeTab={activeTab}
          // onTabChange={setActiveTab}
          onTabChange={(tab) => {
            setActiveTab(tab)
            setSearchQuery("")
          }}
        />

        <FilterBar
          filters={filters}
          onChangeFilters={setFilters}
          onResetFilters={handleResetFilters}
        />
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center mt-8 gap-8 px-6 xl:px-10">        
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

      {/* <FloatingSpeedDial /> */}
      <ScrollToTopButton />

      <AnimatePresence>
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
      </AnimatePresence>

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

      <AnimatePresence>
        {selectedRecipe && (
          <ViewRecipeDrawer 
            recipe={selectedRecipe}
            onShareRecipe={handleShareRecipe}
            currentUser={currentUser}
            savedRecipes={savedRecipes}
            followingUserIds={followingUserIds}
            authorFollowersCount={
              authorFollowersCountMap[selectedRecipe.userId || ""] ??
              Number(selectedRecipe?.author?.followersCount || 0)
            }
            onAuthorClick={handleAuthorProfileClick}
            onClose={handleCloseRecipeDrawer}
            onFavoriteStateChange={handleFavoriteStateChange}
            onFollowStateChange={handleFollowStateChange}
            onRatingStateChange={handleRatingStateChange}
            onCommentStateChange={handleCommentStateChange}
            onEditRecipe={handleEditRecipe}
            onDeleteRecipe={handleRecipeDeleteSuccess}
            blockedUserIds={blockedUserIds}
            blockedByUserIds={blockedByUserIds}
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
