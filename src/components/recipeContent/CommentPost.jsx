import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

/* eslint-disable react/prop-types */
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

export default function CommentPost({ profileImage, username, timestamp, comment, userId }) {
  const [timeAgoString, setTimeAgoString] = useState('')
  const navigate = useNavigate()
  const auth = getAuth()
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid)
      }
    })
    return () => unsubscribe()
  }, [auth])

  useEffect(() => {
    setTimeAgoString(timeAgo(timestamp))

    const interval = setInterval(() => {
      setTimeAgoString(timeAgo(timestamp))
    }, 6000)

    return () => clearInterval(interval)
  }, [timestamp])

  const handleProfileClick = () => {
    if (currentUserId === userId) {
      navigate('/profile')
    } else {
      navigate(`/userProfile/${userId}`)
    }
  }
  
  return (
    <article className="flex flex-col w-full md:w-[580px] mx-auto p-3 gap-2 md:border border-black border-opacity-20
    dark:border-opacity-40 rounded-xl dark:border-dark-border dark:bg-transparent">
      <header className="flex flex-row gap-3">
        <a className="cursor-pointer" onClick={handleProfileClick}>
          <img 
          src={profileImage} 
          className="object-cover w-10 h-10 rounded-xl" 
          alt="Profile" 
          />
        </a>

        <div className="flex flex-col">
          <span className="dark:text-white font-semibold">{username}</span>

          <time className="dark:text-dark-border dark:text-opacity-50" dateTime={timestamp.toDate().toString()}>
            {timeAgoString}
          </time>
        </div>
      </header>

      <p className="dark:text-white text-lg">{comment}</p>
    </article>
  )
}
