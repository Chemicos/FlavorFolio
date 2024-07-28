import { useEffect, useState } from "react";
import Navigation from "../Navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "@firebase/firestore";
import { db } from "../../firebase-config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faUser } from "@fortawesome/free-regular-svg-icons";
import { faBasketShopping, faPencil } from "@fortawesome/free-solid-svg-icons";
import UserDetails from "./UserDetails";
import UserRecipe from "./UserRecipe";
import SavedRecipe from "./SavedRecipe";
import ViewRecipe from "../ViewRecipe";
import { useNavigate } from "react-router-dom";
import Feedback from "../Feedback/Feedback";

export default function ProfilePage() {
    const [ user, setUser ] = useState(null)
    const [username, setUsername] = useState('')
    const [userDescription, setUserDescription] = useState('')
    const [ profileImage, setProfileImage ] = useState('')
    const [socialProfiles, setSocialProfiles] = useState([])
    const [view, setView] = useState('postari')
    const [selectedRecipe, setSelectedRecipe] = useState(null)
    const auth = getAuth() 
    const navigate = useNavigate()
    const [isFeedbackVisible, setIsFeedbackVisible] = useState(false)

    const handleFeedbackClick = () => {
        setIsFeedbackVisible(true)
    }

    const handleFeedbackClose = () => {
        setIsFeedbackVisible(false)
    }

// Fetching profileImage and username functions
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser)
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
                if (userDoc.exists()) {
                    const userData = userDoc.data()
                    setProfileImage(userData.profileImage || currentUser.photoURL || '')
                    setUsername(userData.username || currentUser.displayName || '')
                    setUserDescription(userData.userDescription || '')
                    setSocialProfiles(userData.socialProfiles || [])
                } else {
                    setProfileImage(currentUser.photoURL || '')
                    setUsername(currentUser.displayName || '')
                }
            }
        })
        return () => unsubscribe()
    }, [auth])
// >>

    const handleRecipeClick = (recipe) => {
        setSelectedRecipe(recipe)
    }

    const handleClose = () => {
        setSelectedRecipe(null)
    }

    const handleEditProfile = () => {
        navigate('/settings')
    }

  return (
    <div className="flex flex-col bg-ff-bg dark:bg-dark-bg h-screen w-screen overflow-x-hidden">
        <Navigation onFeedbackClick={handleFeedbackClick} />

        <div className="flex flex-col items-center justify-between gap-4 sm:gap-8 mt-4">
            <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-10 items-center">
                {profileImage ? (
                    <div className="relative">
                        <img 
                            src={profileImage} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full shadow-md object-cover"
                        />

                        <button className="absolute inset-0 top-0 right-0 shadow-md duration-150 bg-ff-btn hover:bg-ff-form text-black rounded-full w-8 h-8"
                            onClick={handleEditProfile}
                        >
                            <FontAwesomeIcon icon={faPencil} />
                        </button>
                    </div>
                    
                ) : (
                    <label className="relative flex flex-col justify-center w-32 h-32 rounded-full border 
                    border-black">
                        <FontAwesomeIcon icon={faUser} className="text-4xl" />
                    </label>
                )}

                <div className="flex flex-col gap-4 items-center sm:items-start">
                    <p className="text-2xl sm:text-xl dark:text-dark-border font-semibold italic">{username}</p>
                    
                    <p className="italic opacity-70 text-sm dark:text-dark-border dark:opacity-100 w-[300px]">{userDescription}</p>

                    {socialProfiles && socialProfiles.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {socialProfiles.map((profile, index) => (
                                <a key={index} href={profile} className="dark:text-dark-border opacity-60">{profile}</a>
                            ))}
                        </div>
                    )}

                    {user && <UserDetails username={username} userId={user.uid.trim()} />}
                </div>
            </div>

            <div className="flex flex-col items-center w-full">
                <div className="h-[1px] bg-black dark:bg-dark-border dark:opacity-30 w-full opacity-10 sm:w-[600px]"></div>

                <div className="flex justify-between w-[240px] sm:w-[300px]">
                    <button className={`uppercase font-semibold pt-2 italic opacity-70 hover:opacity-100 duration-150 relative dark:text-dark-border 
                    ${view === 'postari' ? 
                        'opacity-100 before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-black dark:before:bg-dark-border' 
                        : ''}`}
                        onClick={() => setView('postari')} 
                    >
                        <FontAwesomeIcon icon={faBasketShopping} className="mr-2" />
                        Postări
                    </button>

                    <button className={`uppercase font-semibold py-2 italic opacity-70 hover:opacity-100 duration-150 relative dark:text-dark-border
                        ${view === 'salvari' ? 
                            'opacity-100 before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-black dark:before:bg-dark-border' 
                            : ''}`}
                        onClick={() => setView('salvari')} 
                    >
                        <FontAwesomeIcon icon={faBookmark} className="mr-2" />
                        Salvări
                    </button>
                </div>
            </div>
            
            <div className="flex flex-wrap justify-center sm:w-[80%] 2xl:w-[1600px] mb-8">
                {view === 'postari' ? (
                    <UserRecipe userId={user ? user.uid.trim() : null} username={username} onRecipeClick={handleRecipeClick} />
                ) : (
                    <SavedRecipe username={username} currentUserId={user ? user.uid.trim() : null} />
                )}
            </div>
        </div>

        {selectedRecipe && (
            <div
            className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 z-10 flex items-center justify-center"
            >
                <ViewRecipe recipe={selectedRecipe} onClose={handleClose} currentUserId={user ? user.uid.trim() : null} />
            </div>
        )}

        {isFeedbackVisible && (
            <Feedback onClose={handleFeedbackClose} />
        )}
    </div>
  )
}
