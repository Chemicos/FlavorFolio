/* eslint-disable react/prop-types */
import { collection, doc, getDoc, getDocs, query, where } from "@firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../../firebase-config"
// TODO: AFISEAZA SI NUMARUL TOTAL DE UTILIZATORI URMARITI DE CONTUL CONECTAT

export default function UserDetails({ username, userId }) {
    const [recipeCount, setRecipeCount] = useState(0)
    const [followersCount, setFollowersCount] = useState(0)

    useEffect(() => {
      const fetchUserRecipes = async () => {
        if (username) {
          const recipesRef = collection(db, 'recipes')
          const q = query(recipesRef, where('user', '==', username))
          const querySnapshot = await getDocs(q)
          setRecipeCount(querySnapshot.size)
        }
      }
  
      const fetchUserFollowers = async () => {
        if (userId) {
          const followersRef = doc(db, 'followers', userId.trim())
          const followerSnap = await getDoc(followersRef)
          if (followerSnap.exists()) {
            const followersData = followerSnap.data()
            const followersList = followersData.followers || []
            setFollowersCount(followersList.length)
          } else {
            setFollowersCount(0)
          }
        } else {
          console.log("UserId is not defined.")
        }
      }
  
      fetchUserRecipes()
      fetchUserFollowers()
    }, [username, userId])

  return (
    <div className="flex flex-row gap-6 items-center bg-ff-form rounded-2xl p-4 shadow-md">
        <p className="flex flex-col font-semibold italic items-center">
            {recipeCount}
            <span>Rețete</span>
        </p>

        <span className="bg-black w-[1px] h-8 rounded"></span>

        <p className="flex flex-col items-center font-semibold italic">
            {followersCount}
            <span> Urmăritori</span>
        </p>
    </div>
  )
}
