// import { getAuth, onAuthStateChanged } from "firebase/auth"
 import { useEffect, useState } from "react"
// import { useNavigate } from "react-router-dom"
// import { db } from "../firebase-config"
// import { doc, getDoc } from "@firebase/firestore"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Navigation from "./Navigation"
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import Content from "./Content"
import PostForm from "./PostForm"
import { collection, getDocs, query, where } from "@firebase/firestore"
import { db } from "../firebase-config"

// TODO: FIX navigation bar
export default function Home() {
  const [isPostFormVisible, setIsPostFormVisible] = useState(false)
  const [recipes, setRecipes] = useState([])

  const handlePostClick = () => {
    setIsPostFormVisible(true)
  }

  const handleClose = () => {
    setIsPostFormVisible(false)
  }

  // Search Functionality <<
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredRecipes, setFilteredRecipes] = useState([])

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
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

  return (
    <div className="h-screen w-screen overflow-x-hidden">
      <Navigation />

      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-6 mt-4">
          <h1 className="font-base italic text-2xl">Search and cook</h1> 
          <div className="relative">
            <input type="search" 
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="rounded-2xl w-80 bg-ff-search py-2 pl-10 pr-4
              placeholder:text-ff-placeholder shadow-md duration-200 opacity-50 hover:opacity-100 focus:opacity-100"
            />

            <FontAwesomeIcon 
              icon={faMagnifyingGlass} 
              className="absolute inset-y-0 left-0 my-auto ml-2 opacity-80" 
            />
          </div>
        </div>
      
        <Content handlePostClick={handlePostClick} recipes={filteredRecipes} />

        {isPostFormVisible && 
          <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 z-10 flex items-center justify-center">
            <PostForm handleClose={handleClose} />
          </div>
        }
      </div>
    </div>
  )
}
