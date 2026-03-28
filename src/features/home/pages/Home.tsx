import { useEffect, useState } from "react"
import type { Recipe, RecipeIngredient } from "../types"
import Navigation from "../../../components/layout/Navigation"
import Content from "../components/Content.js"
import PostForm from "../../../components/PostForm.jsx"
import { collection, getDocs } from "@firebase/firestore"
import { db } from "../../../firebase-config.js"
import Feedback from "../../../components/Feedback/Feedback.jsx"

import Snackbar from "@mui/material/Snackbar"
import Alert from "@mui/material/Alert"
import bg from "../../../assets/blurry-gradient-haikei.svg"

export default function Home() {
  const [isPostFormVisible, setIsPostFormVisible] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false)

  // Auth Feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setsnackbarMessage] = useState("")

  const [isLoading, setIsLoading] = useState(true)

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

  const handleSnackbarClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return
    setSnackbarOpen(false)
  }

  // Search Functionality <<
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true)

      try {
        const recipeCollection = collection(db, "recipes")
        const recipeSnapshot = await getDocs(recipeCollection)
        const recipes: Recipe[] = recipeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Recipe[]
        setRecipes(recipes)
        setFilteredRecipes(recipes)
      } catch (error) {
        console.error("Failed to fetch recipes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecipes()
  }, [])

  useEffect(() => {
    const filtered = recipes.filter(recipe =>
      recipe.ingredients?.some((ingredient: RecipeIngredient) => 
        ingredient.ingredient.toLowerCase().includes(searchQuery.toLowerCase())
      ) || recipe.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    setFilteredRecipes(filtered)
  }, [searchQuery, recipes])
// >>

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

  return (
    <div
    className="relative min-h-screen w-full overflow-x-hidden bg-cover bg-center bg-no-repeat"
    style={{ backgroundImage: `url(${bg})` }}
  >
    <div className="absolute inset-0 z-0 bg-[#0b0b0c]/35" />

    <div className="relative z-10">
      <Navigation onFeedbackClick={handleFeedbackClick} />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center gap-8 px-6 pt-[8rem] pb-16 xl:px-10">
        <Content
          // handlePostClick={handlePostClick}
          recipes={filteredRecipes}
          // currentPage={currentPage}
          // setCurrentPage={setCurrentPage}
          isLoading={isLoading}
        />
      </div>

      {isPostFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <PostForm handleClose={handleClose} />
        </div>
      )}

      {isFeedbackVisible && <Feedback onClose={handleClose} />}

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
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  </div>
  )
}
