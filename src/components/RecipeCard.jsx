/* eslint-disable react/prop-types */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from '@firebase/firestore'
import { db } from '../firebase-config'
import Rating from './Rating'
import { getAuth } from 'firebase/auth'

export default function RecipeCard({ recipe, onClick, currentUserId, savedRecipes }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [username, setUsername] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const auth = getAuth()

  useEffect(() => {
      const checkIfFavorite = () => {
          if (currentUserId) {
              const isFav = savedRecipes.some(savedRecipe => savedRecipe.id === recipe.id && savedRecipe.userIds.includes(currentUserId))
              setIsFavorite(isFav)
          }
      }
      checkIfFavorite()
  }, [recipe.id, currentUserId, savedRecipes])

  useEffect(() => {
      const fetchUserData = async () => {
          const user = auth.currentUser
          if (user) {
              const userRef = doc(db, 'users', user.uid)
              const docSnap = await getDoc(userRef)
              if (docSnap.exists()) {
                  const userData = docSnap.data()
                  setUsername(userData.username || user.displayName || user.email)
                  setProfileImage(userData.profileImage || user.photoURL || '')
              } else {
                  setUsername(user.displayName || user.email)
                  setProfileImage(user.photoURL || '')
              }
          }
      }
      fetchUserData()
  }, [auth])

  const addFavoriteNotification = async (message) => {
      if (!recipe.userId) return
      const userRef = doc(db, 'users', recipe.userId)
      const notification = {
          message,
          profileImage,
          timestamp: new Date()
      }
      try {
          await updateDoc(userRef, {
              notifications: arrayUnion(notification)
          })
      } catch (error) {
          console.error("Error adding notification: ", error)
      }
  }

  const toggleFavorite = async () => {
      if (currentUserId) {
          const recipeRef = doc(db, "savedRecipes", recipe.id)
          const recipeSnap = await getDoc(recipeRef)
          if (recipeSnap.exists()) {
              const recipeData = recipeSnap.data()
              const userIds = recipeData.userIds || []
              if (isFavorite) {
                  await updateDoc(recipeRef, {
                      userIds: userIds.filter(id => id !== currentUserId)
                  })
                  await addFavoriteNotification(`Utilizatorul ${username} a scos reteta ${recipe.title} de la favorite.`)
              } else {
                  await updateDoc(recipeRef, {
                      userIds: arrayUnion(currentUserId)
                  })
                  await addFavoriteNotification(`Utilizatorul ${username} a adaugat reteta ${recipe.title} la favorite.`)
              }
          } else {
              await setDoc(recipeRef, { 
                  ...recipe, 
                  userIds: [currentUserId] 
              })
              await addFavoriteNotification(`Utilizatorul ${username} a adaugat reteta ${recipe.title} la favorite.`)
          }
          setIsFavorite(!isFavorite)
      }
  }
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

            <Rating recipeId={recipe.id} initialRating={recipe.rating} />
        </div>
     
    </div>
  )
}
