import { Timestamp, arrayUnion, collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from "@firebase/firestore"
import { useEffect, useState } from "react"
import { db, storage } from "../firebase-config"
import Navigation from "./Navigation"
import ViewPendingRecipe from "./ViewPendingRecipe"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faTrash } from "@fortawesome/free-solid-svg-icons"
import { deleteObject, ref } from "firebase/storage"
import Feedback from "./Feedback/Feedback"


export default function PendingRecipes() {
    const [pendingRecipes, setPendingRecipes] = useState([])
    const [selectedRecipe, setSelectedRecipe] = useState(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [recipeToDelete, setRecipeToDelete] = useState(null)
    const [isFeedbackVisible, setIsFeedbackVisible] = useState(false)
    
    const handleFeedbackClick = () => {
      setIsFeedbackVisible(true)
  }
  const handleFeedbackClose = () => {
      setIsFeedbackVisible(false)
  }

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
      try {
        await deleteDoc(doc(db, 'pendingRecipes', recipeToDelete.id))
        
        const mainImageRef = ref(storage, `recipe_images/${recipeToDelete.imageFileName}`)
        await deleteObject(mainImageRef)

        if (recipeToDelete.cookingSteps) {
          const deleteStepsImages = recipeToDelete.cookingSteps.map(async step => {
            if (step.stepImageFileName) {
              const stepImageRef = ref(storage, `cooking_steps_images/${step.stepImageFileName}`)
              await deleteObject(stepImageRef)
            }
          })
          await Promise.all(deleteStepsImages)
        }

        await addNotification(recipeToDelete.userId, `Reteta ${recipeToDelete.title} a fost refuzata`)

        setPendingRecipes(pendingRecipes.filter(recipe => recipe.id !== recipeToDelete.id))
        setShowDeleteConfirm(false)
        setRecipeToDelete(null)
      } catch (error) {
        console.error("Error deleting recipe: ", error)
      }
    }

    const handleApprove = async (recipe) => {
      try {
        await setDoc(doc(db, 'recipes', recipe.id), recipe)
        await deleteDoc(doc(db, 'pendingRecipes', recipe.id))
        await addNotification(recipe.userId, `Reteta ${recipe.title} a fost aprobata si postata!`)
  
        setPendingRecipes(pendingRecipes.filter(r => r.id !== recipe.id))
      } catch (error) {
        console.error("Error approving recipe: ", error)
      }
    }
    // >>

    const addNotification = async (userId, message) => {
      const userRef = doc(db, 'users', userId)
      const notification = {
        message,
        timestamp: Timestamp.now(),
      }
  
      try {
        await updateDoc(userRef, {
          notifications: arrayUnion(notification),
        })
      } catch (error) {
        console.error("Error adding notification: ", error)
      }
    }

  return (
    <div className="flex flex-col h-screen w-screen bg-ff-bg dark:bg-dark-bg overflow-x-hidden">
      <Navigation onFeedbackClick={handleFeedbackClick} />

      <div className="flex flex-grow items-center justify-center">
        <div className="md:bg-ff-content flex flex-col w-full sm:w-4/5 h-[720px] rounded-3xl
        md:shadow-md items-center gap-4 dark:md:bg-transparent dark:md:border dark:md:border-opacity-40 dark:border-dark-border ">
          <h1 className="text-2xl mt-2 dark:text-dark-border">Rețete în Așteptare</h1>

          <div className="w-4/5 overflow-y-auto">
            <ul className="flex flex-col gap-4 h-[600px]">
            {pendingRecipes.map((recipe, index) => (
                <li className="flex flex-col sm:flex-row justify-between items-center 
                bg-ff-content md:bg-ff-bg gap-4 rounded-2xl py-4 px-6 active:bg-red-700 hover:bg-opacity-40 
                duration-150 cursor-pointer shadow-md sm:shadow-none hover:shadow-md
                dark:bg-dark-elements dark:shadow-none dark:hover:bg-dark-highlight" 
                  key={index}
                >
                  <div onClick={() => setSelectedRecipe(recipe)} className="flex-1">
                    <p className="dark:text-dark-border">{recipe.title}</p>
                    <p className="dark:text-dark-border">{recipe.user}</p>
                    <p className="text-sm opacity-80 dark:text-dark-border">Creata pe {new Date(recipe.createdAt.seconds * 1000).toLocaleString()}</p>
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
              <p>Doriti sa stergeti reteta?</p>
              <div className="flex justify-center gap-4 mt-4">
                <button className="duration-150 bg-gray-300 hover:bg-gray-500 px-4 py-2 rounded" 
                  onClick={() => setShowDeleteConfirm(false)}>
                  Nu
                </button>

                <button className="duration-150 bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded" 
                  onClick={handleDelete}>
                    Da
                </button>
              </div>
            </div>
        </div>
      )}

      {isFeedbackVisible && (
        <Feedback onClose={handleFeedbackClose} />
      )}
    </div>
  )
}
