/* eslint-disable react/prop-types */
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { ref, listAll, getDownloadURL } from "firebase/storage";
import { db } from "../firebase-config";
import { useEffect, useState } from "react";
import RecipeCard from "./RecipeCard";
import { collection, getDocs } from "@firebase/firestore";
import ViewRecipe from "./ViewRecipe";

export default function Content({ handlePostClick }) {
    const [showFilter, setShowFilter] = useState(false)
    const [recipes, setRecipes] = useState([])
    const [selectedRecipe, setSelectedRecipe] = useState(null)

    const handleClose = () => {
        setSelectedRecipe(null)
    }

    useEffect(() => {
        const loadRecipes = async () => {
            const recipeCollection = collection(db, "recipes")
            const recipeSnapshot = await getDocs(recipeCollection)
            const recipeList = recipeSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))
            setRecipes(recipeList)
        }
        loadRecipes()
    }, [])

    const handleRecipeClick = (recipe) => {
        setSelectedRecipe(recipe)
    }

    // TODO: ADD ViewRecipe component
  return (
    <div className="bg-ff-content flex flex-col w-full sm:w-4/5 h-[755px] sm:h-[720px] rounded-t-3xl sm:rounded-3xl shadow-md sm:mb-6">
        <div className="flex flex-row justify-between gap-2 px-10 py-4">
            <button 
                className="bg-ff-btn px-3 py-2 rounded-lg shadow flex items-center gap-3 border border-ff-btn
                duration-200 transition-all ease-in-out transform hover:scale-125"
                onClick={() => setShowFilter(!showFilter)}
            >
                <FontAwesomeIcon icon={faBars} /> 
            </button>

                {showFilter && 
                    <div className={`flex flex-row gap-6 transition-opacity duration-500 ease-out ${showFilter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                        <button className="flex flex-row gap-3 items-center px-3 py-2 rounded-lg shadow border border-black
                        hover:bg-ff-btn hover:border-ff-btn duration-300 transition-all ease-in-out transform hover:scale-105">
                            Meal
                            <FontAwesomeIcon icon={faBars} /> 
                        </button>
                        <button className="px-3 py-2 rounded-lg shadow border border-black
                        hover:bg-ff-btn hover:border-ff-btn duration-300 transition-all ease-in-out transform hover:scale-105">
                            Favorites
                        </button>
                        <button className="flex flex-row gap-3 items-center px-3 py-2 rounded-lg shadow border border-black
                        hover:bg-ff-btn hover:border-ff-btn duration-300 transition-all ease-in-out transform hover:scale-105">
                            Difficulty
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                        <button className="flex flex-row gap-3 items-center px-3 py-2 rounded-lg shadow border border-black
                        hover:bg-ff-btn hover:border-ff-btn duration-300 transition-all ease-in-out transform hover:scale-105">
                            Duration
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                        <button className="flex flex-row gap-3 items-center px-3 py-2 rounded-lg shadow border border-black
                        hover:bg-ff-btn hover:border-ff-btn duration-300 transition-all ease-in-out transform hover:scale-105">
                            Ingredients 
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                    </div>
                }
                
            <button 
                className="bg-ff-btn px-4 py-2 rounded-lg shadow border border-ff-btn
                transition duration-200 ease-in-out hover:scale-125"
                onClick={handlePostClick}
            >
                Post
            </button>
        </div>

        <div className="flex flex-wrap gap-4 justify-center overflow-y-auto py-4">
            {recipes.map((recipe, index) => (
                    <RecipeCard 
                        key={index} 
                        recipe={recipe}
                        onClick={() => handleRecipeClick(recipe)}
                    />
                ))}
        </div>    
        
        {selectedRecipe && (
            <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 
            z-10 flex items-center justify-center">
                <ViewRecipe recipe={selectedRecipe} onClose={handleClose}/>
            </div>
        )}
    </div>
  )
}