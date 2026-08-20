/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import FlavorFolioLogo from '../../assets/FF_logo.png'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, doc, getCountFromServer, getDoc, getDocs, onSnapshot, query, where } from '@firebase/firestore'
import { db } from "../../firebase-config"

import {motion} from "motion/react"
import SmartDisplayRoundedIcon from "@mui/icons-material/SmartDisplayRounded"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import NotificationsIcon from '@mui/icons-material/Notifications'
import UserDropdownMenu from './UserDropdownMenu'
import { useNotifications } from '../../features/notifications/hooks/useNotifications'
import NotificationsPopover from '../../features/notifications/components/NotificationsPopover'
// import FloatingMessagesButton from '../../features/messages/components/FloatingMessagesButton'
import GlobalSearchBar from '../../features/search/components/GlobalSearchBar'

export default function Navigation() {
    const navigate = useNavigate()
    const location = useLocation()
    const auth = getAuth()
    
    const [username, setUsername] = useState('')
    const [userPhoto, setUserPhoto] = useState('')
    const avatarImageRef = useRef<HTMLImageElement | null>(null)
    const [avatarLoaded, setAvatarLoaded] = useState(false)
    
    const [isAdmin, setIsAdmin] = useState(false)
    const [needsRevisionCount, setNeedsRevisionCount] = useState(0)
    const [pendingCount, setPendingCount] = useState(0)
    // const [isDarkMode, setIsDarkMode] = useState(false)
    
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const menuOpen = Boolean(anchorEl)

    const notificationRef = useRef<HTMLDivElement | null>(null)
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

    const isReelsRoute = location.pathname.startsWith("/reels")

    const {
      notifications,
      unreadCount,
      isLoading: isLoadingNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    } = useNotifications(20)
    
    useEffect(() => {
      const fetchPendingCount = async () => {
        if (!isAdmin) {
          setPendingCount(0)
          return
        }

        try {
          const pendingQuery = query(
            collection(db, "recipes"),
            where("status", "==", "pending")
          )

          const snapshot = await getCountFromServer(pendingQuery)

          setPendingCount(snapshot.data().count)
        } catch (error) {
          console.error("Failed to fetch pending recipes count:", error)
          setPendingCount(0)
        }
      }

      fetchPendingCount()
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

  useEffect(() => {
    if (!isNotificationsOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!notificationRef.current) return

      if (!notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [isNotificationsOpen])

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
  return (
    <>
      <div className='fixed left-0 top-0 z-50 w-full'>
          <nav className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)] px-6 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors duration-200">    
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

            <div className="hidden flex-1 items-center justify-center gap-3 lg:flex">
              <button
                type="button"
                onClick={() => navigate("/reels")}
                className={[
                "flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold backdrop-blur-xl transition active:scale-95",
                isReelsRoute
                  ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                  : "border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)]",
              ].join(" ")}
              >
                <SmartDisplayRoundedIcon sx={{ fontSize: 18 }} />
                Reels
              </button>

              <GlobalSearchBar />
            </div>

            <div className='flex items-center gap-2'>
              <div ref={notificationRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((prev) => !prev)}
                  className={[
                    "relative flex h-10 w-10 items-center justify-center rounded-lg",
                    "text-[var(--text-secondary)] transition active:scale-95",
                    "hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
                    isNotificationsOpen ? "bg-[var(--surface-active)] text-[var(--text-primary)]" : "",
                  ].join(" ")}
                  aria-label="Notifications"
                  aria-expanded={isNotificationsOpen}
                >
                  <NotificationsIcon sx={{ fontSize: 25 }} />

                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-[var(--text-on-accent)] shadow-[0_0_14px_var(--accent-soft-hover)]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationsPopover
                  isOpen={isNotificationsOpen}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  isLoading={isLoadingNotifications}
                  onClose={() => setIsNotificationsOpen(false)}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onDelete={deleteNotification}
                  onNotificationClick={(notification) => {
                    if (notification.recipeId) {
                      setIsNotificationsOpen(false)
                    }
                  }}
                />
              </div>

              <div className='relative'>
                <button
                  type='button'
                  id='user-menu-button'
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  onClick={handleMenuOpen}
                  className={[
                    "flex items-center gap-3 rounded-xl border border-transparent px-3 py-1 pr-4",
                    "text-[var(--text-secondary)] transition",
                    "hover:border-[var(--border)] hover:bg-[var(--surface-hover)]",
                    menuOpen ? "border-[var(--border)] bg-[var(--surface-active)]" : "",
                  ].join(" ")}
                >
                  <div className='relative h-8 w-8 overflow-hidden rounded-md bg-[var(--surface-muted)]'>
                    {userPhoto ? (
                      <img
                        ref={avatarImageRef}
                        src={userPhoto}
                        alt="profile"
                        onLoad={() => setAvatarLoaded(true)}
                        onError={() => setAvatarLoaded(true)}
                        className={[
                          'h-full w-full rounded-md object-cover transition-opacity duration-300',
                          avatarLoaded ? 'opacity-100' : 'opacity-0',
                        ].join(' ')}
                      />
                    ) : (
                      <div className='absolute inset-0 animate-pulse bg-[var(--surface-muted)]' />
                    )}
                  </div>

                  <div className='hidden min-w-[110px] text-left md:flex flex-col gap-[2px]'>
                    <p className='truncate text-sm font-semibold text-[var(--text-primary)]'>{username}</p>
                    <p className='text-[11px] text-[var(--text-muted)]'>
                      {isAdmin ? "Admin" : "Member"}
                    </p>
                  </div>
                  
                  <motion.div
                    animate={{rotate: menuOpen ? 180 : 0}}
                    transition={{
                      duration: 0.22,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    className='flex items-center justify-center text-[var(--text-secondary)]'
                  >
                    <ExpandMoreIcon sx={{fontSize: 24}} />
                  </motion.div>
                </button>

                <UserDropdownMenu
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={handleMenuClose}
                  onProfile={() => handleNavigate("/profile")}
                  onPending={() => handleNavigate("/pending")}
                  onNeedsRevision={() => handleNavigate("/needs-revision")}
                  onDashboard={() => handleNavigate("/admin/dashboard")}
                  onSettings={() => handleNavigate("/settings")}
                  onSignOut={handleSignOut}
                  isAdmin={isAdmin}
                  pendingCount={pendingCount}
                  needsRevisionCount={needsRevisionCount}
                />
              </div>
            </div>
          </nav>
      </div>

      {/* <FloatingMessagesButton rightOffset={floatingMessagesRightOffset} /> */}
    </>

  )
}
