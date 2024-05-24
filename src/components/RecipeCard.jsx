/* eslint-disable react/prop-types */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faStar } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'

export default function RecipeCard({ imageUrl, title, user }) {
    const [difficulty, setDifficulty] = useState(0)

    const handleDifficultyClick = (level) => {
        setDifficulty(level)
    }

    // Favorite function <<
    const [isFavorite, setIsFavorite] = useState(false)

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite)
    }
    // >>
  return (
    <div className="relative rounded-xl overflow-hidden shadow-md">
        <img className=' w-64 h-44 object-cover' 
            src={imageUrl} 
            alt="reteta" 
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-25 flex flex-col
             justify-between p-4 pointer-events-none"></div>

        <div className='absolute top-0 right-0 flex items-start justify-end px-4 pt-2'>
            <FontAwesomeIcon 
                icon={faHeart} 
                onClick={toggleFavorite}
                className={`cursor-pointer text-xl 
                ${isFavorite ? 'text-red-600' : 'text-white'}
                `}
            />
        </div>

        <div className='absolute bottom-0 left-0 right-0 flex items-end justify-between px-4 pb-2'>
            <div className='flex flex-col'>
                <h1 className='text-white italic text-lg font-semibold'>{title}</h1>
                <span className='text-white italic text-sm'>{user}</span>
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
