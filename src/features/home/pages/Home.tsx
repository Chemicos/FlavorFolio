import { useEffect, useMemo, useState } from "react"
import FilterDrawer, { defaultRecipeFilters, RecipeFilters } from "../components/FilterDrawer"
import Navigation from "../../../components/layout/Navigation"
import Content from "../components/Content.js"
// import PostForm from "../../../components/PostForm.jsx"
// import Feedback from "../../../components/Feedback/Feedback.jsx"

import Snackbar from "@mui/material/Snackbar"
import Alert from "@mui/material/Alert"
import bg from "../../../assets/blurry-gradient-haikei.svg"
import ScrollToTopButton from "../components/ScrollToTopButton"
import FilterBar from "../components/FilterBar"
import FeedTabs from "../components/FeedTabs"
import { AnimatePresence } from "motion/react"
import { useHomeData } from "../hooks/useHomeData"

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

  const {
    activeRecipes,
    availableCuisines,
    currentUserId,
    savedRecipes,
    isLoading,
    handleFavoriteStateChange
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

  const handleClose = () => {
    setIsPostFormVisible(false)
    setIsFeedbackVisible(false)
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
          title={activeTab}
          onOpenFilters={() => setIsFilterDrawerOpen(true)}
          currentUserId={currentUserId}
          savedRecipes={savedRecipes}
          onFavoriteStateChange={handleFavoriteStateChange}
        />
      </div>

      <ScrollToTopButton />

      {/* {isPostFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <PostForm handleClose={handleClose} />
        </div>
      )} */}

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
    </div>
  </div>
  )
}
