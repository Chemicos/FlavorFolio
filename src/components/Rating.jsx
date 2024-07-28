/* eslint-disable react/prop-types */
import { arrayUnion, doc, getDoc, updateDoc } from "@firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../firebase-config"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faStar } from "@fortawesome/free-solid-svg-icons"


export default function Rating({ recipeId, initialRating }) {
    const [rating, setRating] = useState(0)
    const [averageRating, setAverageRating] = useState(0)

    const handleRatingClick = async (level) => {
        const recipeRef = doc(db, "recipes", recipeId)

        await updateDoc(recipeRef, {
            rating: arrayUnion(level)
        })

        const updatedRecipe = await getDoc(recipeRef)
        const updatedRating = updatedRecipe.data().rating || []
        const totalRating = updatedRating.reduce((acc, val) => acc + val, 0)
        const avgRating = totalRating / updatedRating.length
        setRating(level)
        setAverageRating(avgRating.toFixed(1))
    }

    useEffect(() => {
        if (initialRating && initialRating.length > 0) {
            const totalRating = initialRating.reduce((acc, val) => acc + val, 0)
            const avgRating = totalRating / initialRating.length
            setRating(Math.round(avgRating))
            setAverageRating(avgRating.toFixed(1))
        } else {
            setRating(0)
            setAverageRating(0)
        }
    }, [initialRating])

  return (
    <div className="flex items-center gap-2">
        <div className="flex gap-1">
        {[1,2,3].map((index) => (
            <FontAwesomeIcon
                key={index}
                icon={faStar}
                onClick={() => handleRatingClick(index)}
                className={`cursor-pointer hover:text-yellow-300 text-2xl sm:text-xl ${index <= rating ? 'text-yellow-300' : 'text-white'}`} 
            />
        ))}
        </div>

        <span className="text-white text-sm">
            {averageRating}
        </span>
    </div>
  )
}
