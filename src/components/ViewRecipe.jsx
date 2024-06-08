/* eslint-disable react/prop-types */
import { faClock, faUser } from "@fortawesome/free-regular-svg-icons";
import { faBasketShopping, faClose, faHeart } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { db } from "../firebase-config";
import { deleteDoc, doc, getDoc, setDoc } from "@firebase/firestore";
import Rating from "./Rating";

export default function ViewRecipe({ recipe, onClose }) {
  const [isFavorite, setIsFavorite] = useState(false)

    // Adding to favorites <<
  const toggleFavorite = async () => {
    const recipeRef = doc(db, "savedRecipes", recipe.id)

    if (isFavorite) {
        await deleteDoc(recipeRef)
    } else {
        await setDoc(recipeRef, recipe)
    }
    setIsFavorite(!isFavorite)
  }

  useEffect(() => {
    const checkIfFavorite = async () => {
        const recipeRef = doc(db, "savedRecipes", recipe.id)
        const recipeSnap = await getDoc(recipeRef)

        if(recipeSnap.exists()) {
            setIsFavorite(true)
        }
    }
    checkIfFavorite()
  }, [recipe.id])
    // >>

  return (
    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center 
    justify-center z-10 overflow-hidden">
        <div className="relative flex flex-col bg-ff-bg sm:rounded-lg h-full sm:h-[95%] w-full
         md:w-[720px]">
           <button 
              onClick={onClose}
              className="absolute top-3 right-3 opacity-70 sm:opacity-100 sm:-top-2 sm:-right-2 text-2xl bg-ff-close rounded-full h-10 w-10 
              transition duration-150 ease-in-out hover:scale-110 hover:bg-red-700 hover:text-white z-30">
                <FontAwesomeIcon icon={faClose} />
            </button>

            <div className="overflow-y-auto overflow-x-hidden">
              <div className="relative">
                <div className='absolute top-3 left-5 flex items-start z-10 justify-end'>
                  <FontAwesomeIcon 
                      icon={faHeart} 
                      onClick={toggleFavorite}
                      className={`cursor-pointer text-2xl hover:text-red-600 duration-100
                      ${isFavorite ? 'text-red-600' : 'text-white' } ease-in-out hover:scale-125
                      `}
                  />
                </div>

                <div>
                    <img 
                      className="w-full md:h-[500px] sm:rounded-t-lg" 
                      src={recipe.image} 
                      alt={recipe.title} 
                    />

                  <div className="absolute bottom-14 sm:bottom-12 left-6 z-20">
                      <h1 className="italic font-semibold text-lg sm:text-2xl text-white">
                          {recipe.title}
                      </h1>
                      <p className="italic text-sm sm:text-base text-white">By {recipe.user}</p>
                  </div>

                  <div className="absolute bottom-14 sm:bottom-12 right-6 z-20">
                    <Rating recipeId={recipe.id} initialRating={recipe.rating} />
                  </div>
                </div>

                <div className="absolute bottom-[-30px] left-1/2 transform -translate-x-1/2 z-20 flex items-center justify-center bg-ff-form
                  h-[65px] w-[320px] gap-4 rounded-2xl shadow-md">
                      <div className="flex flex-col items-center">
                          <FontAwesomeIcon icon={faClock} />
                          <span className="italic font-semibold">{recipe.duration}</span>
                      </div>

                      <span className="bg-black w-[1px] h-6 rounded"></span>

                      <div className="flex flex-col items-center">
                          <FontAwesomeIcon icon={faUser} />
                          <span className="italic font-semibold">{recipe.servings} servings</span>
                      </div>

                      <span className="bg-black w-[1px] h-6 rounded"></span>

                      <div className="flex flex-col items-center">
                          <FontAwesomeIcon icon={faBasketShopping} />
                          <span className="italic font-semibold">{recipe.ingredients.length} ingredients</span>
                      </div>
                  </div>

                <div className="absolute inset-0 bg-black opacity-50 sm:rounded-t-lg"></div>
              </div>

              <div className="flex flex-col gap-4">
                    <div className="flex gap-4 mt-12 justify-center">
                        <p className="italic border border-black py-2 px-3 rounded-xl">
                            {recipe.meal}
                        </p>
                        <p className="italic border border-black py-2 px-3 rounded-xl">
                            {recipe.cuisine}
                        </p>
                        <p className="italic border border-black py-2 px-3 rounded-xl">
                            {recipe.difficulty}
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="sm:bg-ff-form w-auto sm:w-[580px] px-4 py-2 rounded-xl sm:shadow-md sm:border sm:border-black">
                            <h2 className="text-lg italic font-semibold">Description</h2>
                            
                            <p className="">{recipe.description}</p>
                        </div>
                            
                        <div className="flex flex-col gap-2 bg-ff-form w-[280px] p-4 rounded-xl shadow-md border border-black">
                            <h2 className="text-lg italic font-semibold">Ingredients</h2>

                            <ul className="flex flex-col gap-2 shadow-sm 
                            ">
                                {recipe.ingredients.map((ingredient, index) => (
                                    <li key={index} className="italic bg-ff-bg p-2 rounded-xl">
                                        {ingredient.quantity} {ingredient.unit} of {ingredient.ingredient}
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>

                    <div className="flex flex-col sm:w-[580px] sm:mx-auto">   
                        {recipe.cookingSteps.map((step, index) => (
                            <div key={index} className="flex flex-col mb-8 px-4 pt-2 pb-4 sm:pb-6 sm:pt-2 bg-ff-form
                            shadow-md sm:rounded-xl sm:border sm:border-black">
                                <h3 className="text-lg italic font-semibold">
                                    Step {index + 1}
                                </h3>

                                <div className="flex flex-col sm:flex-row gap-4 items-center">
                                    <p className="">{step.description}</p>
                                    {step.imageUrl && (
                                        <img 
                                            src={step.imageUrl} 
                                            alt={`Step ${index + 1}`}
                                            className="w-[400px] h-[240px] sm:w-[200px] sm:h-[200px] rounded-lg" 
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
