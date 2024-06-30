import { arrayRemove, doc, getDoc, updateDoc } from "@firebase/firestore"
import { faBell, faClose } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useEffect, useRef, useState } from "react"
import { db } from "../firebase-config"

function timeAgo(timestamp) {
    const now = new Date()
    const secondsPast = Math.floor((now - timestamp.toDate()) / 1000)
  
    if (secondsPast < 60) {
      return `acum ${secondsPast} secunde`
    }
    if (secondsPast < 3600) {
      const minutes = Math.floor(secondsPast / 60)
      return `acum ${minutes} minute`
    }
    if (secondsPast < 86400) {
      const hours = Math.floor(secondsPast / 3600)
      return `acum ${hours} ore`
    }
    if (secondsPast < 604800) {
      const days = Math.floor(secondsPast / 86400)
      return `acum ${days} zile`
    }
  
    if (secondsPast < 2419200) {
      const weeks = Math.floor(secondsPast / 604800)
      return `acum ${weeks} săptămâni`
    }
    if (secondsPast < 29030400) {
      const months = Math.floor(secondsPast / 2419200)
      return `acum ${months} luni`
    }
    const years = Math.floor(secondsPast / 29030400)
    return `acum ${years} ani`
}

export default function Notifications() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const dropdownRef = useRef(null)
    const auth = getAuth()

    const fetchNotifications = async (userId) => {
        if (!userId) return;
        const userRef = doc(db, 'users', userId)
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setNotifications(userData.notifications || [])
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                fetchNotifications(currentUser.uid)
            }
        })
        return () => unsubscribe()
    }, [auth])

    const toggleDropdown = () => {
        setIsOpen(!isOpen)
    }

    useEffect(() => {
        const closeDropdown = (e) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', closeDropdown)
        return () => document.removeEventListener('mousedown', closeDropdown)
    }, [isOpen])

    const handleDeleteNotification = async (notification) => {
        const user = auth.currentUser
        if (!user) return 
        const userRef = doc(db, 'users', user.uid)

        try {
            await updateDoc(userRef, {
                notifications: arrayRemove(notification)
            })
            setNotifications((prevNotifications) => 
                prevNotifications.filter((n) => n.timestamp !== notification.timestamp)
            )
        } catch (error) {
            console.error("Error deleting notification: ", error)
        }
    }

  return (
    <div className="relative">
        <button 
            className="text-xl dark:text-dark-border dark:hover:text-dark-btn relative"
            onClick={toggleDropdown}
        >
            <FontAwesomeIcon icon={faBell} />
            {notifications.length > 0 && (
                <span
                    className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center"
                    style={{transform: "translate(50%, -50%)"}}
                >
                    {notifications.length}
                </span>
            )}
      </button>

      {isOpen && (
        <div 
            ref={dropdownRef} 
            className="absolute right-0 mt-2 w-60 rounded-md shadow-lg py-1 bg-white 
            dark:bg-dark-bg dark:border dark:border-dark-border ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
        >
            {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                    <div
                        key={index}
                        className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-border"
                    >
                        <div className="flex flex-col">
                            <span>{notification.message}</span>
                            <time className="text-xs text-gray-500 dark:text-dark-border">
                                {timeAgo(notification.timestamp)}
                            </time>
                        </div>

                        <button
                            onClick={() => handleDeleteNotification(notification)}
                            className="text-gray-400 hover:text-gray-600 dark:text-dark-border dark:hover:text-dark-btn"
                        >
                            <FontAwesomeIcon icon={faClose} />
                        </button>
                    </div>
                ))
            ) : (
                <p className="px-4 py-2 text-sm text-gray-700 dark:text-dark-border">
                    Momentan, nu aveti notificari
                </p>
            )}
        </div>
      )}
    </div>
  )
}
