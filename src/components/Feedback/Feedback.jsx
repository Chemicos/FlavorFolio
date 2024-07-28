/* eslint-disable react/prop-types */
import { addDoc, collection, doc, getDoc } from "@firebase/firestore"
import { faStar } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { getAuth } from "firebase/auth"
import { useEffect, useState } from "react"
import { db } from "../../firebase-config"

export default function Feedback({ onClose }) {
    const [feedback, setFeedback] = useState('')
    const [subject, setSubject] = useState('')
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [userId, setUserId] = useState(null)
    const [username, setUsername] = useState('')
    const [profileImage, setProfileImage] = useState('')

    useEffect(() => {
      const fetchUserData = async (user) => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUsername(userData.username)
            setProfileImage(userData.profileImage || user.photoURL || '')
          } else {
            setUsername(user.displayName || user.email)
            setProfileImage(user.photoURL || '')
          }
        } catch (error) {
          console.error("Error fetching user data: ", error)
          setUsername(user.displayName || user.email)
          setProfileImage(user.photoURL || '')
        }
      }
  
      const auth = getAuth()
      const user = auth.currentUser
      if (user) {
        setUserId(user.uid)
        fetchUserData(user)
      }
    }, [])

    const handleSubmit = async (e) => {
      e.preventDefault()

      if (subject && feedback && rating) {
        try {
          await addDoc(collection(db, 'feedbacks'), {
            userId,
            username,
            profileImage,
            rating,
            subject,
            feedback,
            timestamp: new Date()
          })
          onClose()
        } catch (error) {
          console.error('Eroare la trimiterea feedback-ului: ', error)
        }
      } else {
        alert('Va rugam sa completati toate campurile.')
      }
    }

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 z-20 flex items-center justify-center">
      <div className="bg-ff-bg dark:bg-dark-elements p-6 rounded-lg shadow-lg md:w-96 md:h-auto h-screen w-screen">
        <h2 className="text-2xl font-semibold mb-4 dark:text-dark-border">Feedback</h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesomeIcon 
                key={star}
                icon={faStar}
                className={`text-2xl cursor-pointer ${
                  (hoverRating || rating) >= star
                    ? 'text-yellow-500'
                    : 'text-gray-400 dark:text-dark-border dark:border-opacity-40'
                }`} 
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-gray-700 dark:text-dark-border italic" htmlFor="subject">
              Subiect
            </label>

            <select 
              value={subject} 
              id="subject"
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-lg py-2 px-3 bg-ff-search border border-black border-opacity-20 hover:border-opacity-100
              dark:bg-dark-bg dark:border dark:border-dark-border dark:border-opacity-40 dark:hover:border-opacity-100 dark:text-dark-border"
            >
              <option value="" disabled>Alege un subiect</option>
              <option value="performanta aplicatiei">Performanta Aplicatiei</option>
              <option value="retete">Retete</option>
              <option value="probleme cu contul">Probleme cu contul</option>
              <option value="altele">Altele</option>
            </select>
          </div>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full h-40 p-2 border border-gray-300 dark:border-dark-border dark:border-opacity-40 rounded-md mb-4 dark:bg-dark-bg dark:text-dark-border
            outline-none"
            placeholder="Ajută-ne sa îmbunătățim aplicația..."
            required
          />
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 dark:hover:bg-dark-highlight font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-400 dark:bg-transparent"
            >
              Închide
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-ff-btn text-white rounded-md font-semibold hover:bg-ff-form dark:text-black"
            >
              Trimite
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
