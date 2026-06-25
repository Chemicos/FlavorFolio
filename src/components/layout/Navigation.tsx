/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import FlavorFolioLogo from '../../assets/FF_logo.png'
import { Link, useNavigate } from 'react-router-dom'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, doc, getCountFromServer, getDoc, getDocs, onSnapshot, query, where } from '@firebase/firestore'
import { db } from "../../firebase-config"
// import Notifications from './Notifications'

import {motion} from "motion/react"
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import NotificationsIcon from '@mui/icons-material/Notifications'
import UserDropdownMenu from './UserDropdownMenu'

interface NavigationProps {
  onFeedbackClick?: () => void
  variant?: "transparent" | "solid"
}

// interface FirestoreUser {
//   username?: string
//   admin?: boolean
//   profileImage?: string
// }

export default function Navigation({ onFeedbackClick, variant = "transparent" }: NavigationProps) {
    const navigate = useNavigate()
    const auth = getAuth()
    
    const [username, setUsername] = useState('')
    const [userPhoto, setUserPhoto] = useState('')
    const avatarImageRef = useRef<HTMLImageElement | null>(null)
    const [avatarLoaded, setAvatarLoaded] = useState(false)
    
    const [isAdmin, setIsAdmin] = useState(false)
    const [needsRevisionCount, setNeedsRevisionCount] = useState(0)
    const [pendingCount, setPendingCount] = useState(0)
    const [feedbackCount, setFeedbackCount] = useState(0)
    const [isDarkMode, setIsDarkMode] = useState(false)
    
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const menuOpen = Boolean(anchorEl)
    const [isScrolled, setIsScrolled] = useState(false)
    const shouldUseSolidNav = variant === "solid" || isScrolled
    
    useEffect(() => {
      const fetchPendingCount = async () => {
        const pendingCollection = collection(db, 'pendingRecipes')
        const pendingSnapshot = await getDocs(pendingCollection)
        setPendingCount(pendingSnapshot.size)
      }

      const fetchFeedbackCount = async () => {
        const feedbackCollection = collection(db, 'feedbacks')
        const feedbackSnapshot = await getDocs(feedbackCollection)
        setFeedbackCount(feedbackSnapshot.size)
      }

      if (isAdmin) {
        fetchPendingCount()
        fetchFeedbackCount()
      }
    }, [isAdmin])

    useEffect(() => {
      if (avatarImageRef.current?.complete && avatarImageRef.current.naturalWidth > 0) {
        setAvatarLoaded(true)
      }
    }, [userPhoto])
    
  // Retrieving username & avatar from users or google and remaining connected >>
    useEffect(() => {
      let unsubscribeUserDoc: (() => void) | undefined

      const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeUserDoc?.()

      if (!user) {
        setUsername("")
        setUserPhoto("")
        navigate("/")
        return
      }

      const userRef = doc(db, "users", user.uid)

      unsubscribeUserDoc = onSnapshot(userRef, (docSnap) => {  
        if (docSnap.exists()) {
          const userData = docSnap.data()
          const nextPhoto = userData.profileImage || user.photoURL || ""

          setUsername(userData.username || user.displayName || "")
          setIsAdmin(Boolean(userData.admin))
          setUserPhoto((prevPhoto) => {
            if (prevPhoto !== nextPhoto) {
              setAvatarLoaded(false)
            }
            return nextPhoto
          })
        } else {
          const nextPhoto = user.photoURL || ""
          setUsername(user.displayName || "")

          setUserPhoto((prevPhoto) => {
            if (prevPhoto !== nextPhoto) {
              setAvatarLoaded(false)
            }

            return nextPhoto
          })
        }
      })
    })

    return () => {
      unsubscribeAuth()
      unsubscribeUserDoc?.()
    }
  }, [navigate, auth])
  // <<

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY !== 0)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    const fetchNeedsRevisionCount = async () => {
      const user = auth.currentUser
      if (!user) return

      const needsRevisionQuery = query(
        collection(db, "recipes"),
        where("userId", "==", user.uid),
        where("status", "==", "needs_revision")
      )

      const snapshot = await getCountFromServer(needsRevisionQuery)
      setNeedsRevisionCount(snapshot.data().count)
    }

    fetchNeedsRevisionCount()
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))

    if (newDarkMode) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNavigate = (path: string) => {
    handleMenuClose()
    navigate(path)
  }
    
  const handleSignOut = async () => {
    try {
      handleMenuClose()
      await signOut(auth)
      navigate("/")
    } catch (error) {
      console.error("Sign out error", error)
    }
  }

  const handleFeedbackMenuClick = () => {
    handleMenuClose()

    if(isAdmin) {
      navigate("/manage-feedback")
      return
    }

    onFeedbackClick?.()
  }
  return (
    <div className='fixed left-0 top-0 z-50 w-full'>
        <motion.nav 
          initial={false}
          animate={
            shouldUseSolidNav
            ? {
              width: "100%",
              marginTop: 0,
              borderRadius: "0px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }
            : {
              width: "90%",
              marginTop: 16,
            }
          }
          transition={{
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={[
            "mx-auto flex h-20 items-center justify-between px-6 transition-colors duration-200",
            shouldUseSolidNav
              ? "bg-[#0b0b0c]/80 backdrop-blur-md border-b border-white/10"
              : "",
          ].join(" ")}
        >
          
            <Link
              to="/home"
              className='flex items-center transition duration-200 hover:scale-105'
            >
              <img 
                className='h-9 w-auto object-contain'
                src={FlavorFolioLogo}
                alt='FlavorFolioLogo'
              />
            </Link>

            <div className='flex items-center gap-4 lg:gap-6'>
              <button className='text-[#a8b3cf] hover:text-white'>
                <NotificationsIcon sx={{fontSize: 25}} />
              </button>

              <div className='relative'>
                <button
                  type='button'
                  id='user-menu-button'
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  onClick={handleMenuOpen}
                  className='flex items-center gap-3 rounded-2xl px-3 py-2 pr-4 transition hover:bg-[#202429]/80'
                >
                  <div className='relative h-10 w-10 overflow-hidden rounded-lg bg-white/10'>
                    {userPhoto ? (
                      <img
                        ref={avatarImageRef}
                        src={userPhoto}
                        alt="profile"
                        onLoad={() => setAvatarLoaded(true)}
                        onError={() => setAvatarLoaded(true)}
                        className={[
                          'h-full w-full rounded-lg object-cover transition-opacity duration-300',
                          avatarLoaded ? 'opacity-100' : 'opacity-0',
                        ].join(' ')}
                      />
                    ) : (
                      <div className='absolute inset-0 animate-pulse bg-white/10' />
                    )}
                  </div>

                  <div className='hidden min-w-[110px] text-left md:flex flex-col gap-[2px]'>
                    <p className='truncate text-sm font-semibold text-[#a8b3cf]'>{username}</p>
                    <p className='text-[12px] text-[#a8b3cf]/50'>
                      {isAdmin ? "Admin" : "Member"}
                    </p>
                  </div>
                  
                  <motion.div
                    animate={{rotate: menuOpen ? 180 : 0}}
                    transition={{
                      duration: 0.22,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    className='flex items-center justify-center'
                  >
                    <ExpandMoreIcon sx={{fontSize: 30, color: "#a8b3cf"}} />
                  </motion.div>
                </button>

                <UserDropdownMenu
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={handleMenuClose}
                  onProfile={() => handleNavigate("/profile")}
                  onPending={() => handleNavigate("/pending")}
                  onNeedsRevision={() => handleNavigate("/needs-revision")}
                  onDashboard={() => handleNavigate("/dashboard")}
                  onFeedbacks={handleFeedbackMenuClick}
                  onSettings={() => handleNavigate("/settings")}
                  onSignOut={handleSignOut}
                  isAdmin={isAdmin}
                  pendingCount={pendingCount}
                  feedbackCount={feedbackCount}
                  needsRevisionCount={needsRevisionCount}
                />
              </div>
            </div>
          
        </motion.nav>
    </div>
  )
}
