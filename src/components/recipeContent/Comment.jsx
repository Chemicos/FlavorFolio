import { Timestamp, arrayUnion, doc, updateDoc } from "@firebase/firestore"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import { db } from "../../firebase-config"

/* eslint-disable react/prop-types */
export default function Comment({ profileImage, userId, username, onClose, addComment, recipe }) {
  const [comment, setComment] = useState("")
  const auth = getAuth()
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
      }
    });
    return () => unsubscribe()
  }, [auth])

  const addCommentNotification = async (message, recipeUserId) => {
    if (!recipeUserId) return;
    const userRef = doc(db, 'users', recipeUserId);
    const notification = {
      message,
      profileImage,
      timestamp: new Date(),
    }
    try {
      await updateDoc(userRef, {
        notifications: arrayUnion(notification),
      })
    } catch (error) {
      console.error("Error adding notification: ", error)
    }
  }

  const handleSaveComment = async () => {
     if (comment.trim()) {
      const newComment = {
        userId,
        username,
        profileImage,
        comment,
        timestamp: Timestamp.now()
      }

      await addComment(newComment)
      await addCommentNotification(`${username} a comentat la reteta ${recipe.title}`, recipe.userId)
      setComment("")
      onClose()
    }
  }
  return (
    <div className="flex flex-col w-full md:w-[580px] mx-auto">
      <span className="flex flex-row gap-3 p-3 border-t border-black border-opacity-20 bg-ff-form
      dark:border-t dark:border-dark-border dark:border-opacity-40 dark:bg-dark-elements ">
        <img className="object-cover w-10 h-10 rounded-xl" 
        src={profileImage} 
        alt="Profile" 
        />

        <textarea className="placeholder:text-ff-placeholder
        dark:text-white dark:placeholder:text-dark-border outline-none w-full bg-transparent" 
        placeholder="Spune-ti parerea"
        value={comment} 
        rows="7"
        onChange={(e) => setComment(e.target.value)}
        >
        </textarea>
      </span>

      <span className="flex flex-row p-3 md:rounded-b-xl border-t border-black border-opacity-20 bg-ff-form
      dark:border-t dark:border-dark-border dark:border-opacity-40 dark:bg-dark-elements">
        <button className="p-2 rounded-xl hover:bg-ff-content
        dark:text-dark-border font-semibold dark:hover:bg-dark-highlight"
          onClick={onClose}
        >
          Inchide
        </button>

        <button className="flex ml-auto p-2 rounded-xl bg-ff-btn hover:bg-transparent border-ff-btn hover:border-black border
        dark:text-black dark:hover:text-white dark:border dark:hover:border-dark-border dark:border-opacity-40 font-semibold
        duration-200"
          onClick={handleSaveComment}
        >
            Comenteaza
        </button>
      </span>
    </div>
  )
}
