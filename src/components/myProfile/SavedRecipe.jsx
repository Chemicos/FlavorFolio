/* eslint-disable react/prop-types */
import { collection, getDocs, query, where } from "@firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../../firebase-config"
import Rating from "../Rating"
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import ViewRecipe from "../ViewRecipe"


export default function SavedRecipe({ currentUserId }) {
    const [savedRecipes, setSavedRecipes] = useState([])
    const [ currentPage, setCurrentPage] = useState(1)
    const [selectedRecipe, setSelectedRecipe] = useState(null)
    const recipesPerPage = 8

    useEffect(() => {
        const fetchSavedRecipes = async () => {
            if (currentUserId) {
              const q = query(collection(db, "savedRecipes"), where("userIds", "array-contains", currentUserId))
              const querySnapshot = await getDocs(q)
              const recipesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }))
              setSavedRecipes(recipesList)
            }
          }
          fetchSavedRecipes()
        }, [currentUserId])

    const indexOfLastRecipe = currentPage * recipesPerPage
    const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage
    const currentRecipes = savedRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe)

    const onPageChange = (pageNumber) => setCurrentPage(pageNumber)

    const totalPages = Math.ceil(savedRecipes.length / recipesPerPage)

    const pages = []
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
    }

    const handleRecipeClick = (recipe) => {
        setSelectedRecipe(recipe)
    }

    const handleClose = () => {
        setSelectedRecipe(null)
    }
  return (
    <div className="flex flex-col items-center">
        <div className="flex flex-wrap gap-4 justify-center">
            {currentRecipes.map(recipe => (
                <div 
                key={recipe.id}
                className="relative rounded-xl overflow-hidden shadow-md cursor-pointer"
                onClick={() => handleRecipeClick(recipe)}
                >
                    <img className='h-[180px] w-[280px] sm:w-[340px] sm:h-[240px] object-cover duration-300 hover:scale-125'
                            src={recipe.image}
                            alt="recipe"
                    />

                    <div className="absolute inset-0 bg-black bg-opacity-25 flex flex-col justify-between p-4 pointer-events-none"></div>

                    <div className='absolute bottom-0 left-0 right-0 flex items-end justify-between px-4 pb-2'>
                        <div className='flex flex-col'>
                            <h1 className='text-white italic text-lg font-semibold'>{recipe.title}</h1>
                            <span className='text-white italic text-sm'>{recipe.user}</span>
                        </div>
                        <Rating recipeId={recipe.id} initialRating={recipe.rating} />
                    </div>
                </div>
            ))}
        </div>

        <div className="flex justify-center my-6">
            <button
                className={`mx-2 px-3 py-1 rounded-xl hover:scale-110 duration-150 
                ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-ff-btn hover:bg-ff-btn-dark'}`}
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <FontAwesomeIcon icon={faArrowLeft} />
            </button>

            {pages.map(page => (
                <button
                    key={page}
                    className={`mx-1 px-3 py-1 rounded-xl font-bold hover:scale-110 duration-150 
                    ${currentPage === page ? 'bg-ff-btn-dark text-white' : 'bg-ff-btn hover:bg-ff-btn-dark'}`}
                    onClick={() => onPageChange(page)}
                >
                    {page}
                </button>
            ))}

            <button
                className={`mx-2 px-3 py-1 rounded-xl hover:scale-110 duration-150 
                ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-ff-btn hover:bg-ff-btn-dark'}`}
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <FontAwesomeIcon icon={faArrowRight} />
            </button>
        </div>

        {selectedRecipe && (
                <div
                    className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 z-10 flex items-center justify-center"
                >
                    <ViewRecipe recipe={selectedRecipe} onClose={handleClose} currentUserId={currentUserId} />
                </div>
            )}
    </div>
  )
}
