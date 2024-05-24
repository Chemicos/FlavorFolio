import { collection, deleteDoc, doc, getDocs, setDoc } from "@firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../firebase-config"
import Navigation from "./Navigation"
import ViewPendingRecipe from "./ViewPendingRecipe"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faTrash } from "@fortawesome/free-solid-svg-icons"


export default function PendingRecipes() {
    const [pendingRecipes, setPendingRecipes] = useState([])
    const [selectedRecipe, setSelectedRecipe] = useState(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [recipeToDelete, setRecipeToDelete] = useState(null)

    const handleClose = () => {
      setSelectedRecipe(null)
    }

    // Fetch pendingRecipes <<
    useEffect(() => {
        const fetchPendingRecipes = async () => {
            const recipeCollection = collection(db, 'pendingRecipes')
            const recipeSnapshot = await getDocs(recipeCollection)
            const recipeList = recipeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setPendingRecipes(recipeList)
        }
        fetchPendingRecipes()
    }, [])
    // >>

    // Gestionare retete in asteptare <<
    const handleDeleteConfirm = (recipe) => {
      setRecipeToDelete(recipe)
      setShowDeleteConfirm(true)
    }

    const handleDelete = async () => {
      await deleteDoc(doc(db, 'pendingRecipes', recipeToDelete.id))
      setPendingRecipes(pendingRecipes.filter(recipe => recipe.id !== recipeToDelete.id))
      setShowDeleteConfirm(false)
      setRecipeToDelete(null)
    }

    const handleApprove = async (recipe) => {
      await setDoc(doc(db, 'recipes', recipe.id), recipe)
      await deleteDoc(doc(db, 'pendingRecipes', recipe.id))
      setPendingRecipes(pendingRecipes.filter(r => r.id !== recipe.id))
    }
    // >>

  return (
    <div className="flex flex-col h-screen w-screen overflow-x-hidden">
      <Navigation />

      <div className="flex flex-grow items-center justify-center">
        <div className="bg-ff-content flex flex-col w-full sm:w-4/5 h-[720px] rounded-3xl
        shadow-md items-center gap-4">
          <h1 className="text-2xl  mt-2">Pending Recipes</h1>

          <div className="w-4/5 overflow-y-auto">
            <ul className="flex flex-col gap-4 h-[600px]">
            {pendingRecipes.map((recipe, index) => (
                <li className="flex flex-col sm:flex-row justify-between items-center 
                bg-ff-bg gap-4 rounded-2xl py-4 px-6 active:bg-red-700 hover:bg-opacity-40 
                duration-150 cursor-pointer shadow-md sm:shadow-none hover:shadow-md" 
                  key={index}
                >
                  <div onClick={() => setSelectedRecipe(recipe)} className="flex-1">
                    <p>{recipe.title}</p>
                    <p>{recipe.user}</p>
                    <p className="text-sm opacity-80">Created at {new Date(recipe.createdAt.seconds * 1000).toLocaleString()}</p>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center gap-8 sm:gap-4">
                    <button onClick={() => handleDeleteConfirm(recipe)}>
                      <FontAwesomeIcon icon={faTrash} className="text-xl text-red-600 hover:text-red-800 duration-100 hover:scale-125" />
                    </button>

                    <button onClick={() => handleApprove(recipe)}>
                      <FontAwesomeIcon icon={faCheck} className="text-xl text-green-600 hover:text-green-800 duration-100 hover:scale-125" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {selectedRecipe && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 z-10 flex items-center justify-center">
          <ViewPendingRecipe recipe={selectedRecipe} onClose={handleClose} />
        </div>
      )}

      {showDeleteConfirm && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 z-10 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <p>Are you sure you want to delete this recipe?</p>
              <div className="flex justify-center gap-4 mt-4">
                <button className="duration-150 bg-gray-300 hover:bg-gray-500 px-4 py-2 rounded" 
                  onClick={() => setShowDeleteConfirm(false)}>
                  No
                </button>

                <button className="duration-150 bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded" 
                  onClick={handleDelete}>
                    Yes
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  )
}
