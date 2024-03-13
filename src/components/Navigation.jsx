import { useEffect, useState } from 'react'
import FlavorFolioLogo from '../assets/FlavorFolio_logo1.png'
import { useNavigate } from 'react-router-dom'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from '@firebase/firestore'
import { db } from "../firebase-config"

export default function Navigation() {
    const navigate = useNavigate()
    const auth = getAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [username, setUsername] = useState('')
    const [userPhoto, setUserPhoto] = useState('')
    
  // Retrieving username from users or google and remaining connected >>
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserPhoto(user.photoURL || '')
          if (user.displayName) {
            setUsername(user.displayName)
          } else {
            const uid = user.uid
            const userRef = doc(db, "users", uid)
            const docSnap = await getDoc(userRef)
            if (docSnap.exists()) {
              setUsername(docSnap.data().username)
            } else {
              console.log("No such document!")
            }
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
    
    const handleSignOut = () => {
        signOut(auth).then(() => 
        navigate("/")).catch((error) => 
        console.error("Sign out error", error))
    }
  return (
    <nav className="bg-transparent shadow">
      <div className="mx-auto px-4 lg:px-10">
        <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <img className="block h-12 w-10" src={FlavorFolioLogo} alt="FlavorFolioLogo" />
              <p className='text-ff-flavor font-semibold italic text-xl'>
                Flavor
                <span className='text-ff-folio'>Folio</span>
              </p>
            </div>
            
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
                  <span className='text-base '>
                    {username}
                  </span>

                  {userPhoto && 
                    <img src={userPhoto} className='w-10 h-10 rounded-full' alt="Profile" />  
                  }
                </button>
              </div>

              {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" 
                  role="menu" 
                  aria-labelledby="user-menu-button"
                >
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700" 
                    role="menuitem">My Profile
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700" 
                    role="menuitem">Settings
                  </a>
                  <a href="#" 
                    className="block px-4 py-2 text-sm text-gray-700" 
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
