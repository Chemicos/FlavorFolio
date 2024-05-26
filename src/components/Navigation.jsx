import { useEffect, useRef, useState } from 'react'
import FlavorFolioLogo from '../assets/FlavorFolio_logo1.png'
import { Link, useNavigate } from 'react-router-dom'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, doc, getDoc, getDocs } from '@firebase/firestore'
import { db } from "../firebase-config"

export default function Navigation() {
    const navigate = useNavigate()
    const auth = getAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [username, setUsername] = useState('')
    const [userPhoto, setUserPhoto] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)
    const dropdownRef = useRef(null)
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
      const fetchPendingCount = async () => {
        const pendingCollection = collection(db, 'pendingRecipes')
        const pendingSnapshot = await getDocs(pendingCollection)
        setPendingCount(pendingSnapshot.size)
      }

      if (isAdmin) {
        fetchPendingCount()
      }
    }, [isAdmin])
    
  // Retrieving username & avatar from users or google and remaining connected >>
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserPhoto(user.photoURL || '');
          const uid = user.uid;
          const userRef = doc(db, 'users', uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUsername(userData.username || user.displayName);
            setIsAdmin(userData.admin);
          } else {
            setUsername(user.displayName)
          } 
        } else {
          setUsername('')
          setUserPhoto('')
          navigate("/")
        }
      })
      return () => unsubscribe()
  }, [navigate])
  // <<

  useEffect(() => {
    const closeDropdown = (e) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
    }
    }
    document.addEventListener('mousedown', closeDropdown);
      return () => document.removeEventListener('mousedown', closeDropdown);
  }, [isOpen])
    
    const handleSignOut = () => {
        signOut(auth).then(() => 
        navigate("/")).catch((error) => 
        console.error("Sign out error", error))
    }
  return (
    <nav className="bg-transparent">
      <div className="px-4 lg:px-10 shadow-sm">
        <div className="flex justify-between h-16">
            <Link to="/home" className="flex items-center gap-4 duration-150 hover:scale-110">
              <img className="block h-12 w-10" src={FlavorFolioLogo} alt="FlavorFolioLogo" />
              <p className='text-ff-flavor font-semibold italic text-xl'>
                Flavor
                <span className='text-ff-folio'>Folio</span>
              </p>
            </Link>
            
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div>
                <button type="button" 
                  className="max-w-xs flex gap-4 items-center text-sm focus:outline-none" 
                  id="user-menu-button" 
                  aria-expanded="false" 
                  aria-haspopup="true" 
                  onClick={() => setIsOpen(!isOpen)}
                  >
                  <span className='text-base duration-150 hover:font-semibold hover:scale-110'>
                    {username}
                  </span>

                  {userPhoto && 
                    <img src={userPhoto} className='w-10 h-10 rounded-full' alt="Profile" />  
                  }
                </button>
              </div>

              {isOpen && (
                <div ref={dropdownRef} 
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md z-10
                  shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none
                  " 
                  role="menu" 
                  aria-labelledby="user-menu-button"
                >
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                    role="menuitem">My Profile
                  </a>

                  {isAdmin && (
                    <a
                      href="#"
                      className="flex flex-row gap-4 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => navigate('/pending')}
                    >
                      Pending
                      {pendingCount > 0 && (
                        <span className='bg-red-600 text-white rounded-full font-semibold px-2 py-1 my-auto text-xs'>
                          {pendingCount}
                        </span>  
                      )}
                    </a>
                  )}

                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                    role="menuitem">Settings
                  </a>
                  
                  <a href="#" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                    role="menuitem" 
                    onClick={handleSignOut}>
                      Sign Out
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
