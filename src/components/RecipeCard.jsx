/* eslint-disable react/prop-types */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faStar } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import { deleteDoc, doc, getDoc, setDoc, updateDoc, arrayUnion } from '@firebase/firestore'
import { db } from '../firebase-config'

export default function RecipeCard({ recipe, onClick, savedRecipes }) {
    const [rating, setRating] = useState(0)

    // Rating Functionality <<
    const handleRatingClick = async (level) => {
        const recipeRef = doc(db, "recipes", recipe.id)

        await updateDoc(recipeRef, {
            rating: arrayUnion(level)
        })

        const updatedRecipe = await getDoc(recipeRef)
        const updatedRating = updatedRecipe.data().rating
        const totalRating = updatedRating.reduce((acc, val) => acc + val, 0)
        const avgRating = totalRating / updatedRating.length
        setRating(Math.round(avgRating))
    }

    useEffect(() => {
        if (recipe.rating && recipe.rating.length > 0) {
            const totalRating = recipe.rating.reduce((acc, val) => acc + val, 0)
            const avgRating = totalRating / recipe.rating.length
            setRating(Math.round(avgRating))
        } else {
            setRating(0)
        }
    }, [recipe.rating])
    // >>

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

            <div className='flex gap-1'>
                {[1,2,3].map((index) => (
                    <FontAwesomeIcon 
                        key={index} 
                        icon={faStar} 
                        onClick={() => handleRatingClick(index)} 
                        className={`cursor-pointer hover:text-yellow-300 text-lg ${index <= rating ? 'text-yellow-300' : 'text-white'}`}
                    />
                ))}
            </div>
        </div>
     
    </div>
  )
}
