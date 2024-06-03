/* eslint-disable react/prop-types */
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { db } from "../../firebase-config";
import { useEffect, useState } from "react";
import RecipeCard from "../RecipeCard";
import { collection, getDocs } from "@firebase/firestore";
import ViewRecipe from "../ViewRecipe";
import Pagination from "./Pagination";

export default function Content({ handlePostClick, recipes }) {
    const [showFilter, setShowFilter] = useState(false)
    const [selectedRecipe, setSelectedRecipe] = useState(null)
    const [mealFilter, setMealFilter] = useState([])
    const [mealOptionsVisible, setMealOptionsVisible] = useState(false)
    const [difficultyFilter, setDifficultyFilter] = useState([])
    const [difficultyOptionsVisible, setDifficultyOptionsVisible] = useState(false)
    const [durationFilter, setDurationFilter] = useState([])
    const [durationOptionsVisible, setDurationOptionsVisible] = useState(false)
    const [favoritesFilter, setFavoritesFilter] = useState(false)
    const [savedRecipes, setSavedRecipes] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [recipesPerPage] = useState(6)

    const handleClose = () => {
        setSelectedRecipe(null)
    }

    const handleRecipeClick = (recipe) => {
        setSelectedRecipe(recipe)
    }

    // Filter functions << 
    const toggleMealOptions = () => {
        setMealOptionsVisible(!mealOptionsVisible)
    }
    const toggleDifficultyOptions = () => {
        setDifficultyOptionsVisible(!difficultyOptionsVisible)
    }
    const toggleDurationOptions = () => {
        setDurationOptionsVisible(!durationOptionsVisible)
    }

        const handleCheckboxChange = (filter, setFilter, value) => {
            if (filter.includes(value)) {
                setFilter(filter.filter((item) => item !== value))
            } else {
                setFilter([...filter, value])
            }
            setCurrentPage(1)
        }

        const handleFavoritesChange = () => {
            setFavoritesFilter(!favoritesFilter)
            setCurrentPage(1)
        }

        // Fetch savedRecipes <<
        useEffect(() => {
            const fetchSavedRecipes = async () => {
              const savedRecipesCollection = collection(db, "savedRecipes")
              const savedRecipesSnapshot = await getDocs(savedRecipesCollection)
              const savedRecipesList = savedRecipesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              setSavedRecipes(savedRecipesList)
            }
              fetchSavedRecipes()
          }, [])

        //   >>
        const filteredRecipes = recipes.filter((recipe) => {
            const matchesMeal = mealFilter.length ? mealFilter.includes(recipe.meal) : true
            const matchesDifficulty = difficultyFilter.length ? difficultyFilter.includes(recipe.difficulty) : true
            const matchesDuration = durationFilter.length ? durationFilter.includes(recipe.duration) : true
            const matchesFavorites = favoritesFilter ? savedRecipes.some((fav) => fav.id === recipe.id) : true

            return matchesMeal && matchesDifficulty && matchesDuration && matchesFavorites
        })
    // >>

    // Pagination functions <<
        const indexOfLastRecipe = currentPage * recipesPerPage
        const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage
        const currentRecipes = filteredRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe)

        const paginate = pageNumber => setCurrentPage(pageNumber)
    // >>

  return (
    <div className="bg-ff-content flex flex-col justify-between w-full sm:w-[80%] 2xl:w-[1200px] h-[755px] sm:h-[720px] rounded-t-3xl sm:rounded-3xl shadow-md sm:mb-6">
        <div className="flex flex-row justify-between gap-2 px-10 py-4">
            <button 
                className="bg-ff-btn px-3 py-2 rounded-lg shadow flex items-center gap-3 border border-ff-btn
                duration-200 transition-all ease-in-out transform hover:scale-125"
                onClick={() => setShowFilter(!showFilter)}
            >
                <FontAwesomeIcon icon={faBars} /> 
            </button>

            {showFilter && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-20 sm:hidden">
                    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-30 p-4 overflow-y-auto">
                    <button
                        className="mb-4 text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => setShowFilter(false)}
                    >
                        <FontAwesomeIcon icon={faTimes} /> Close
                    </button>

                    <div className="relative group">
                        <button 
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            onClick={toggleMealOptions}
                        >
                            Meal
                        </button>
                        <div className={`ml-4 w-full transition-all duration-500 overflow-hidden ${mealOptionsVisible ? 'max-h-screen' : 'max-h-0'}`}>
                        {["breakfast", "lunch", "dinner", "snack", "dessert"].map((meal) => (
                            <label key={meal} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={mealFilter.includes(meal)}
                              onChange={() => handleCheckboxChange(mealFilter, setMealFilter, meal)}
                            />
                            {meal}
                          </label>
                        ))}
                        </div>
                    </div>

                    <div className="relative group mt-4">
                        <button className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            onClick={toggleDifficultyOptions}
                        >
                        Difficulty
                        </button>
                        <div className={`ml-4 w-full transition-all duration-500 overflow-hidden ${difficultyOptionsVisible ? 'max-h-screen' : 'max-h-0'}`}>
                        {["easy", "medium", "hard"].map((difficulty) => (
                            <label key={difficulty} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                             <input 
                                 type="checkbox"
                                 className="mr-2"
                                 checked={difficultyFilter.includes(difficulty)} 
                                 onChange={() => handleCheckboxChange(difficultyFilter, setDifficultyFilter, difficulty)}
                             />
                             {difficulty}
                            </label>
                        ))}
                        </div>
                    </div>

                    <div className="relative group mt-4">
                        <button className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            onClick={toggleDurationOptions}
                        >
                        Duration
                        </button>
                        <div className={`ml-4 w-full transition-all duration-500 overflow-hidden ${durationOptionsVisible ? 'max-h-screen' : 'max-h-0'}`}>
                        {[
                            "10 min",
                            "20 min",
                            "30 min",
                            "40 min",
                            "50 min",
                            "1 hour",
                        ].map((duration) => (
                            <label key={duration} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                                <input 
                                    type="checkbox" 
                                    className="mr-2"
                                    checked={durationFilter.includes(duration)}
                                    onChange={() => handleCheckboxChange(durationFilter, setDurationFilter, duration)}
                                />
                                {duration}
                            </label>
                        ))}
                        </div>
                    </div>

                    <label className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                        <input 
                            type="checkbox" 
                            className="mr-2"
                            checked={favoritesFilter}
                            onChange={handleFavoritesChange}
                        />
                        Favorites
                    </label>
                    </div>
                </div>
            )}
            
            {/* min-width:640px  */}
                {showFilter && (
                    <div className="absolute z-10 mt-12 w-48 bg-white shadow-lg rounded-lg py-1">
                        <div className="relative group">
                        <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                            Meal
                        </button>
                        <div className="absolute left-full top-0 mt-1 w-48 bg-white shadow-lg rounded-lg py-1 hidden group-hover:block">
                            {["breakfast", "lunch", "dinner", "snack", "dessert"].map((meal) => (
                            <label key={meal} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={mealFilter.includes(meal)}
                              onChange={() => handleCheckboxChange(mealFilter, setMealFilter, meal)}
                            />
                            {meal}
                          </label>
                            ))}
                        </div>
                        </div>
        
                        <div className="relative group">
                        <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                            Difficulty
                        </button>
                        <div className="absolute left-full top-0 mt-1 w-48 bg-white shadow-lg rounded-lg py-1 hidden group-hover:block">
                            {["easy", "medium", "hard"].map((difficulty) => (
                            <label key={difficulty} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                                <input 
                                    type="checkbox"
                                    className="mr-2"
                                    checked={difficultyFilter.includes(difficulty)} 
                                    onChange={() => handleCheckboxChange(difficultyFilter, setDifficultyFilter, difficulty)}
                                />
                                {difficulty}
                            </label>
                            ))}
                        </div>
                        </div>
        
                        <div className="relative group">
                        <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                            Duration
                        </button>
                        <div className="absolute left-full top-0 mt-1 w-48 bg-white shadow-lg rounded-lg py-1 hidden group-hover:block">
                            {["10 min", "20 min", "30 min", "40 min", "50 min", "1 hour"].map((duration) => (
                            <label key={duration} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                                <input 
                                    type="checkbox" 
                                    className="mr-2"
                                    checked={durationFilter.includes(duration)}
                                    onChange={() => handleCheckboxChange(durationFilter, setDurationFilter, duration)}
                                />
                                {duration}
                            </label>
                            ))}
                        </div>
                    </div>
        
                    <label className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                        <input 
                            type="checkbox" 
                            className="mr-2"
                            checked={favoritesFilter}
                            onChange={handleFavoritesChange}
                        />
                        Favorites
                    </label>
                  </div>
                )}
                
            <button 
                className="bg-ff-btn px-4 py-2 rounded-lg shadow border border-ff-btn
                transition duration-200 ease-in-out hover:scale-125"
                onClick={handlePostClick}
            >
                Post
            </button>
        </div>

        <div className="flex flex-wrap gap-8  justify-center overflow-y-auto py-4">
            {currentRecipes.map((recipe, index) => (
                    <RecipeCard 
                        key={index} 
                        recipe={recipe}
                        savedRecipes={savedRecipes}
                        onClick={() => handleRecipeClick(recipe)}
                    />
                ))}
        </div> 

        <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredRecipes.length / recipesPerPage)} 
            onPageChange={paginate}
        />
        
        {selectedRecipe && (
            <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 
            z-10 flex items-center justify-center">
                <ViewRecipe recipe={selectedRecipe} onClose={handleClose}/>
            </div>
        )}
    </div>
  )
}