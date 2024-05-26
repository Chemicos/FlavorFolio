/* eslint-disable react/prop-types */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faStar } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import { deleteDoc, doc, getDoc, setDoc } from '@firebase/firestore'
import { db } from '../firebase-config'

export default function RecipeCard({ recipe, onClick }) {
    const [difficulty, setDifficulty] = useState(0)

    const handleDifficultyClick = (level) => {
        setDifficulty(level)
    }

    // Favorite function <<
    const [isFavorite, setIsFavorite] = useState(false)

    useEffect(() => {
        const checkIfFavorite = async () => {
            const recipeRef = doc(db, "savedRecipes", recipe.id)
            const recipeSnap = await getDoc(recipeRef)

            if (recipeSnap.exists()) {
                setIsFavorite(true)
            }
        }
        checkIfFavorite()
    }, [recipe.id])

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
        <img className='w-64 h-44 object-cover duration-300 hover:scale-125' 
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
                        onClick={() => handleDifficultyClick(index)} 
                        className={`cursor-pointer hover:text-yellow-300 text-lg ${index <= difficulty ? 'text-yellow-300' : 'text-white'}`}
                    />
                ))}
            </div>
        </div>
     
    </div>
  )
}
