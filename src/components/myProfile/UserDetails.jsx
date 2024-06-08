/* eslint-disable react/prop-types */
import { collection, getDocs, query, where } from "@firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../../firebase-config"


export default function UserDetails({ username }) {
    const [recipeCount, setRecipeCount] = useState(0)

    useEffect(() => {
        const fetchUserRecipes = async () => {
            if (username) {
              const recipesRef = collection(db, 'recipes')
              const q = query(recipesRef, where('user', '==', username)) 
              const querySnapshot = await getDocs(q)
              setRecipeCount(querySnapshot.size)
            }
        }
        fetchUserRecipes()
    }, [username])

  return (
    <div className="bg-ff-form rounded-2xl p-4 shadow-md">
        <p className="flex flex-col font-semibold italic items-center">
            {recipeCount}
            <span>rețete</span>
        </p>
    </div>
  )
}
