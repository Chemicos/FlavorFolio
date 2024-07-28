/* eslint-disable react/prop-types */
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import { Timestamp, arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";


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
  }, [auth])

  const checkIfFollowing = async (currentUser) => {
      if (!recipeUser || !currentUser) return
      const followRef = doc(db, 'followers', recipeUser.trim())
      const followSnap = await getDoc(followRef)
      if (followSnap.exists()) {
          const followers = followSnap.data().followers || []
          setIsFollowing(followers.includes(currentUser.uid))
      } else {
          setIsFollowing(false)
      }
  }

  const toggleFollow = async () => {
    if (!recipeUser || !user) return
    const followRef = doc(db, 'followers', recipeUser.trim())
    const userRef = doc(db, 'users', user.uid)
    const followUserRef = doc(db, 'users', recipeUser.trim())

    try {
        const userDoc = await getDoc(userRef)
        const username = userDoc.exists() ? (userDoc.data().username || user.displayName || user.email) : user.email
        const profileImage = userDoc.exists() ? (userDoc.data().profileImage || user.photoURL || '') : (user.photoURL || '')

        if (isFollowing) {
            await updateDoc(followRef, {
                followers: arrayRemove(user.uid)
            })
            await updateFollowingCollection(user.uid, recipeUser, false)
            await addFollowNotification(followUserRef, `Utilizatorul ${username} nu te mai urmareste.`, profileImage)
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
            await updateFollowingCollection(user.uid, recipeUser, true)
            await addFollowNotification(followUserRef, `Utilizatorul ${username} a inceput sa te urmareasca.`, profileImage)
        }
        setIsFollowing(!isFollowing)
    } catch (error) {
        console.error("Error updating followers: ", error)
    }
}

const updateFollowingCollection = async (currentUserId, recipeUserId, isAdding) => {
    const followingRef = doc(db, 'following', currentUserId.trim())
    try {
        const followingSnap = await getDoc(followingRef)
        if (isAdding) {
            if (followingSnap.exists()) {
                await updateDoc(followingRef, {
                    followedUsers: arrayUnion(recipeUserId)
                })
            } else {
                await setDoc(followingRef, {
                    followedUsers: [recipeUserId]
                })
            }
        } else {
            if (followingSnap.exists()) {
                await updateDoc(followingRef, {
                    followedUsers: arrayRemove(recipeUserId)
                })
            }
        }
    } catch (error) {
        console.error("Error updating following collection: ", error)
    }
}

const addFollowNotification = async (followUserRef, message, profileImage) => {
    const notification = {
        message,
        profileImage,
        timestamp: Timestamp.now(),
    }

    try {
        await updateDoc(followUserRef, {
            notifications: arrayUnion(notification),
        })
    } catch (error) {
        console.error("Error adding notification: ", error)
    }
}

if (!user) {
    return null
}

  return (
       <button
            onClick={toggleFollow}
            className={`px-4 py-2 bg-ff-btn border  border-ff-btn font-semibold rounded-xl hover:bg-transparent dark:hover:text-white
              ${isFollowing ? 'bg-transparent border-white text-white' : 'text-black'} transition duration-150`}
        >
            {isFollowing ? 'Urmaresti' : 'Urmareste'}
        </button>
  )
}
