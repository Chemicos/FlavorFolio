import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Navigation from "./Navigation.js"
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import Content from "./content/Content.jsx"
import PostForm from "./PostForm.jsx"
import { collection, getDocs } from "@firebase/firestore"
import { db } from "../firebase-config.js"
import Feedback from "./Feedback/Feedback.jsx"

import Snackbar from "@mui/material/Snackbar"
import Alert from "@mui/material/Alert"
import bg from "../assets/darkGradientBackground.jpg"

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
    <div
    className="relative min-h-screen w-full overflow-x-hidden bg-cover bg-center bg-no-repeat"
    style={{ backgroundImage: `url(${bg})` }}
  >
    <div className="absolute inset-0 z-0 bg-[#0b0b0c]/50" />

    <div className="relative z-10">
      <Navigation onFeedbackClick={handleFeedbackClick} />

      <div className="flex flex-col items-center gap-8 px-4 pt-6 pb-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1200px] rounded-3xl border border-white/10 bg-[#0b0b0c]/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Placeholder content</h2>
            <p className="mt-1 text-sm text-[#a8b3cf]">
              Folosit doar pentru a testa scroll-ul și comportamentul navbar-ului.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePostClick}
            className="rounded-xl bg-[#f2a533] px-4 py-2 font-medium text-black transition hover:scale-[1.03]"
          >
            Test action
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 18 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-white/5 bg-[#111318]/95"
            >
              <div className="h-48 w-full bg-gradient-to-br from-[#1b2330] via-[#121827] to-[#0f1117]" />

              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 rounded bg-white/10" />
                <div className="h-4 w-1/2 rounded bg-white/5" />
                <div className="h-4 w-2/3 rounded bg-white/5" />

                <div className="pt-2">
                  <div className="h-10 w-28 rounded-xl bg-[#f2a533]/80" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* <div className="mt-4 flex flex-col items-center gap-4">
          <h1 className="font-base italic text-2xl dark:text-dark-border">
            Caută și gătește
          </h1>

          <div className="relative">
            <input
              type="search"
              placeholder="Caută..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-80 rounded-2xl bg-ff-search py-2 pl-10 pr-4 shadow-md duration-200 opacity-50 hover:opacity-100 focus:opacity-100 dark:border dark:border-dark-border dark:border-opacity-20 dark:bg-dark-elements dark:text-dark-border dark:placeholder:text-dark-border dark:sm:hover:border-opacity-60 dark:focus:border-opacity-60 dark:opacity-100"
            />

            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute inset-y-0 left-0 my-auto ml-2 opacity-80 dark:text-dark-btn"
            />
          </div>
        </div> */}
        {/* <Content
          handlePostClick={handlePostClick}
          recipes={filteredRecipes}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        /> */}
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
