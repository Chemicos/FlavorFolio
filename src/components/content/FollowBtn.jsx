/* eslint-disable react/prop-types */
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";


export default function FollowBtn({ recipeUser }) {
    const [isFollowing, setIsFollowing] = useState(false)
    const [user, setUser] = useState(null)
    const auth = getAuth()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser)
          checkIfFollowing(currentUser)
        } else {
          setUser(null)
        }
      })
  
      return () => unsubscribe()
  }, [user])

  const checkIfFollowing = async (currentUser) => {
    if (!recipeUser || !currentUser ) return
    const followRef = doc(db, 'followers', recipeUser.trim())
    const followSnap = await getDoc(followRef)
    if (followSnap.exists()) {
      const followers = followSnap.data().followers || []
      setIsFollowing(followers.includes(currentUser.uid))
    } else {
      setIsFollowing(false)
    }
  };

  const toggleFollow = async () => {
    if (!recipeUser || !user) return;
    const followRef = doc(db, 'followers', recipeUser.trim())

    try {
      if (isFollowing) {
        await updateDoc(followRef, {
          followers: arrayRemove(user.uid)
        })
      } else {
        const followSnap = await getDoc(followRef)
        if (followSnap.exists()) {
          await updateDoc(followRef, {
            followers: arrayUnion(user.uid)
          })
        } else {
          await setDoc(followRef, {
            followers: [user.uid]
          })
        }
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error updating followers: ", error)
    }
  }

  if (!user) {
    return null
  }

  return (
       <button
            onClick={toggleFollow}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-700 transition duration-150"
        >
            {isFollowing ? 'Nu mai urmari' : 'Urmareste'}
        </button>
  )
}
