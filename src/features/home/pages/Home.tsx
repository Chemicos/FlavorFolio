import { useEffect, useMemo, useState } from "react"
import FilterDrawer, { defaultRecipeFilters, RecipeFilters } from "../components/FilterDrawer"
import Navigation from "../../../components/layout/Navigation"
import Content from "../components/Content.js"
import PostForm from "../../../components/PostForm.js"

import Snackbar from "@mui/material/Snackbar"
import Alert from "@mui/material/Alert"
import bg from "../../../assets/blurry-gradient-haikei.svg"
import ScrollToTopButton from "../components/ScrollToTopButton"
import FilterBar from "../components/FilterBar"
import FeedTabs from "../components/FeedTabs"
import { AnimatePresence } from "motion/react"
import { useHomeData } from "../hooks/useHomeData"
import FloatingSpeedDial from "../../../components/layout/FloatingSpeedDial"
import { Recipe } from "../types"
import ViewRecipeDrawer from "../components/recipe-view-drawer/ViewRecipeDrawer"
import PostRecipeDrawer from "../components/post-recipe/PostRecipeDrawer"

export default function Home() {
  const [activeTab, setActiveTab] = useState("For You")
  //Filtering
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [filters, setFilters] = useState<RecipeFilters>(defaultRecipeFilters)
  // Auth Feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setsnackbarMessage] = useState("")

  const [isPostFormVisible, setIsPostFormVisible] = useState(false)
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false)

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const {
    activeRecipes,
    availableCuisines,
    currentUser,
    currentUserId,
    savedRecipes,
    followingUserIds,
    authorFollowersCountMap,
    isLoading,
    isFiltering,
    handleFavoriteStateChange,
    handleFollowStateChange,
    handleRatingStateChange,
    handleCommentStateChange
  } = useHomeData({activeTab, filters})
  
  const handleSnackbarClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return
    setSnackbarOpen(false)
  }
  
  const handleResetFilters = () => {
    setFilters(defaultRecipeFilters)
  }

  useEffect(() => {
    const raw = sessionStorage.getItem("authFeedback")
    if (!raw) return 

    try {
      const parsed = JSON.parse(raw)
      setsnackbarMessage(parsed.message || "Authentication successful.")
      setSnackbarOpen(true)
    } catch (err) {
      console.error("Failed to parse auth feedback:", err)
    } finally {
      sessionStorage.removeItem("authFeedback")
    }
  }, [])
  
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
  
  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bg})` }}
    >
    {/* <div className="absolute inset-0 z-0 bg-[#0b0b0c]/30" /> */}

    <div className="relative z-10">
      <Navigation onFeedbackClick={handleFeedbackClick} />

      <div className="mx-auto mt-[8rem] w-full max-w-[1400px] 2xl-plus:max-w-[1600px] px-6 xl:px-10">
        <FeedTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <FilterBar
          filters={filters}
          onChangeFilters={setFilters}
          onResetFilters={handleResetFilters}
        />
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] 2xl-plus:max-w-[1600px] flex-col items-center mt-8 gap-8 px-6 xl:px-10">        
        <Content
          recipes={activeRecipes}
          isLoading={isLoading}
          isFiltering={isFiltering}
          title={activeTab}
          onOpenFilters={() => setIsFilterDrawerOpen(true)}
          currentUser={currentUser}
          currentUserId={currentUserId}
          savedRecipes={savedRecipes}
          followingUserIds={followingUserIds}
          authorFollowersCountMap={authorFollowersCountMap}
          onFollowStateChange={handleFollowStateChange}
          onFavoriteStateChange={handleFavoriteStateChange}
          activeTab={activeTab}
          filters={filters}
          onRecipeClick={handleRecipeClick}
          onCreatePost={handlePostClick}
        />
      </div>

      <FloatingSpeedDial />
      <ScrollToTopButton />

      <AnimatePresence>
        {isPostFormVisible && (
          <PostRecipeDrawer onClose={() => setIsPostFormVisible(false)} isOpen={isPostFormVisible} />
        )}
      </AnimatePresence>

      {/* {isFeedbackVisible && <Feedback onClose={handleClose} />} */}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3500}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          variant="filled"
          sx={{ 
            width: "100%", 
            backgroundColor: "rgba(0, 205, 6, 0.3)",
            backdropFilter: "blur(10px)",
            "& .MuiAlert-icon": {
              color: "#00cd06",
            },
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
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
            currentUser={currentUser}
            savedRecipes={savedRecipes}
            followingUserIds={followingUserIds}
            authorFollowersCount={
              authorFollowersCountMap[selectedRecipe.userId || ""] ??
              Number(selectedRecipe?.author?.followersCount || 0)
            }
            onClose={handleCloseRecipeDrawer}
            onFavoriteStateChange={handleFavoriteStateChange}
            onFollowStateChange={handleFollowStateChange}
            onRatingStateChange={handleRatingStateChange}
            onCommentStateChange={handleCommentStateChange}
          />
        )}
      </AnimatePresence>
    </div>
  </div>
  )
}
