/* eslint-disable react/prop-types */
import { collection, doc, getDoc, getDocs, query, where } from "@firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../../firebase-config"

export default function UserDetails({ username, userId }) {
    const [recipeCount, setRecipeCount] = useState(0)
    const [followersCount, setFollowersCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)

    useEffect(() => {
      const fetchUserRecipes = async () => {
        if (userId) {
          const recipesRef = collection(db, 'recipes')
          const q = query(recipesRef, where('userId', '==', userId))
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
      
      const fetchUserFollowing = async () => {
        if (userId) {
          const followingRef = doc(db, 'following', userId.trim())
          const followingSnap = await getDoc(followingRef)
          if (followingSnap.exists()) {
            const followingData = followingSnap.data()
            const followedUsersList = followingData.followedUsers || []
            setFollowingCount(followedUsersList.length)
          } else {
            setFollowingCount(0)
          }
        } else {
          console.log("UserId is not defined.")
        }
      }

      fetchUserRecipes()
      fetchUserFollowers()
      fetchUserFollowing()
    }, [username, userId])


  return (
    <div className="flex flex-row w-[290px] justify-between items-center bg-ff-form rounded-2xl p-4 shadow-md
    dark:bg-dark-elements dark:shadow-none">
        <p className="flex flex-col font-semibold italic items-center dark:text-dark-border">
            {recipeCount}
            <span>Rețete</span>
        </p>

        <span className="bg-black w-[1px] h-8 opacity-20 rounded dark:bg-dark-border dark:opacity-40"></span>

        <p className="flex flex-col items-center font-semibold italic dark:text-dark-border">
            {followersCount}
            <span> Urmăritori</span>
        </p>

        <span className="bg-black w-[1px] h-8 opacity-20 rounded dark:bg-dark-border dark:opacity-40"></span>

        <p className="flex flex-col items-center font-semibold italic dark:text-dark-border">
            {followingCount}
            <span>Urmăriți</span>
        </p>
    </div>
  )
}
