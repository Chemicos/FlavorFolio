import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Navigation from "./Navigation.jsx"
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import Content from "./content/Content.jsx"
import PostForm from "./PostForm.jsx"
import { collection, getDocs } from "@firebase/firestore"
import { db } from "../firebase-config.js"
import Feedback from "./Feedback/Feedback.jsx"

import Snackbar from "@mui/material/Snackbar"
import Alert from "@mui/material/Alert"

export default function Home() {
  const [isPostFormVisible, setIsPostFormVisible] = useState(false)
  const [recipes, setRecipes] = useState([])
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false)

  // Auth Feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setsnackbarMessage] = useState("")

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
  const [filteredRecipes, setFilteredRecipes] = useState([])
  const [currentPage, setCurrentPage] = useState(1)

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  useEffect(() => {
    const fetchRecipes = async () => {
      const recipeCollection = collection(db, "recipes")
      const recipeSnapshot = await getDocs(recipeCollection)
      const recipes = recipeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setRecipes(recipes)
      setFilteredRecipes(recipes)
    }
    fetchRecipes()
  }, [])

  useEffect(() => {
    const filtered = recipes.filter(recipe =>
      recipe.ingredients.some(ingredient => 
        ingredient.ingredient.toLowerCase().includes(searchQuery.toLowerCase())
      ) || recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
    <div className="h-screen w-screen overflow-x-hidden bg-ff-bg dark:bg-dark-bg">
      <Navigation onFeedbackClick={handleFeedbackClick} />

      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-4 mt-4">
          <h1 className="font-base italic text-2xl dark:text-dark-border">Caută și gătește</h1> 
          <div className="relative">
            <input type="search" 
              placeholder="Caută..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="rounded-2xl w-80 bg-ff-search dark:bg-dark-elements py-2 pl-10 pr-4
              placeholder:text-ff-placeholder dark:placeholder:text-dark-border dark:border dark:text-dark-border
              dark:border-dark-border dark:border-opacity-20 dark:sm:hover:border-opacity-60 dark:focus:border-opacity-60
              shadow-md duration-200 opacity-50 dark:opacity-100 hover:opacity-100 focus:opacity-100"
            />

            <FontAwesomeIcon 
              icon={faMagnifyingGlass} 
              className="absolute inset-y-0 left-0 my-auto ml-2 opacity-80 dark:text-dark-btn" 
            />
          </div>
        </div>
      
        <Content 
          handlePostClick={handlePostClick} 
          recipes={filteredRecipes} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
        />

        {isPostFormVisible && 
          <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 z-10 flex items-center justify-center">
            <PostForm handleClose={handleClose} />
          </div>
        }

        {isFeedbackVisible && (
          <Feedback onClose={handleClose} />
        )}
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3500}
        onClose={handleSnackbarClose}
        anchorOrigin={{vertical: "bottom", horizontal: "center"}}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          variant="filled"
          sx={{
            width: "100%",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  )
}
