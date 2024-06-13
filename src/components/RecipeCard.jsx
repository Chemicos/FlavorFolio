/* eslint-disable react/prop-types */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import { deleteDoc, doc, setDoc } from '@firebase/firestore'
import { db } from '../firebase-config'
import Rating from './Rating'

export default function RecipeCard({ recipe, onClick, savedRecipes }) {

    // Favorite function <<
    const [isFavorite, setIsFavorite] = useState(false)

    useEffect(() => {
        const checkIfFavorite = () => {
            const isFav = savedRecipes.some(savedRecipe => savedRecipe.id === recipe.id)
            setIsFavorite(isFav)
        }
        checkIfFavorite()
    }, [recipe.id, savedRecipes])

    const toggleFavorite = async () => {
        const recipeRef = doc(db, "savedRecipes", recipe.id)

        if (isFavorite) {
            await deleteDoc(recipeRef)
        } else {
            await setDoc(recipeRef, recipe)
        }
        setIsFavorite(!isFavorite)
    }
    // >>
  return (
    <div className="relative rounded-xl overflow-hidden shadow-md cursor-pointer">
        <img className='h-[180px] w-[280px] sm:w-[340px] sm:h-[240px] object-cover duration-300 hover:scale-125' 
            onClick={onClick}
            src={recipe.image} 
            alt="reteta" 
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-25 flex flex-col
             justify-between p-4 pointer-events-none"></div>

        <div className='absolute top-0 right-0 flex items-start justify-end px-4 pt-2'>
            <FontAwesomeIcon 
                icon={faHeart} 
                onClick={toggleFavorite}
                className={`cursor-pointer text-xl hover:text-red-600 duration-100 ease-in-out hover:scale-125
                ${isFavorite ? 'text-red-600' : 'text-white'}
                `}
            />
        </div>

        <div className='absolute bottom-0 left-0 right-0 flex items-end justify-between px-4 pb-2'>
            <div className='flex flex-col'>
                <h1 className='text-white italic text-lg font-semibold'>{recipe.title}</h1>
                <span className='text-white italic text-sm'>{recipe.user}</span>
            </div>

            <Rating recipeId={recipe.id} initialRating={recipe.rating} />
        </div>
     
    </div>
  )
}
