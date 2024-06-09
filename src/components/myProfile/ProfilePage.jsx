import { useEffect, useState } from "react";
import Navigation from "../Navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "@firebase/firestore";
import { db, storage } from "../../firebase-config";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import UserDetails from "./UserDetails";
import UserRecipe from "./UserRecipe";
import SavedRecipe from "./SavedRecipe";
import ViewRecipe from "../ViewRecipe";

export default function ProfilePage() {
    const [ user, setUser ] = useState(null)
    const [username, setUsername] = useState('')
    const [ profileImage, setProfileImage ] = useState('')
    const [ imageFile, setImageFile ] = useState(null)
    const [view, setView] = useState('postari')
    const [selectedRecipe, setSelectedRecipe] = useState(null)
    const auth = getAuth() 

// Fetching profileImage and username functions
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user)
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data()
                    setProfileImage(userData.profileImage || user.photoURL || '')
                    setUsername(userData.username || user.displayName || '')
                } else {
                    setProfileImage(user.photoURL || '')
                    setUsername(user.displayName || '')
                }
            }
        })
        return () => unsubscribe()
    }, [auth])

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            const imageUrl = URL.createObjectURL(file)
            setProfileImage(imageUrl)

            const storageRef = ref(storage, `user_images/${auth.currentUser.uid}`)
            await uploadBytes(storageRef, file)
            const downloadURL = await getDownloadURL(storageRef)

            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                profileImage: downloadURL,
            })
        }
    }

    const handleImageDelete = async () => {
        if (profileImage) {
            const storageRef = ref(storage, `user_images/${auth.currentUser.uid}`)
            await deleteObject(storageRef)
    
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                profileImage: ''
            })
            setProfileImage('')
        }
    }
// >>

    const handleRecipeClick = (recipe) => {
        setSelectedRecipe(recipe)
    }

    const handleClose = () => {
        setSelectedRecipe(null)
    }

  return (
    <div className="flex flex-col h-screen w-screen overflow-x-hidden">
        <Navigation />

        <div className="flex flex-col items-center justify-between gap-4 sm:gap-8 mt-4">
            <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-10 items-center">
                {profileImage ? (
                    <div className="relative">
                        <img 
                            src={profileImage} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full shadow-md object-cover"
                        />

                        <button className="absolute inset-0 top-0 right-0 shadow-md duration-150 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8"
                            onClick={handleImageDelete}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                    
                ): (
                    <label className="relative flex flex-col justify-center cursor-pointer w-32 h-32 rounded-full border 
                    border-black hover:bg-ff-btn hover:border-ff-btn duration-300">
                        <FontAwesomeIcon icon={faUser} className="text-4xl" />
                        
                        <input 
                        type="file" 
                        onChange={handleImageUpload} 
                        className="hidden"
                        />
                    </label>
                )}

                <div className="flex flex-col gap-4">
                    <p className="text-xl font-semibold italic">{username}</p>
                    <UserDetails username={username} />
                </div>
            </div>

            <div className="flex flex-col items-center w-full">
                <div className="h-[1px] bg-black w-full opacity-10 sm:w-[600px]"></div>

                <div className="flex justify-between w-[240px] sm:w-[300px]">
                    <button className={`uppercase font-semibold pt-2 italic opacity-70 hover:opacity-100 duration-150 relative 
                    ${view === 'postari' ? 
                        'opacity-100 before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-black' 
                        : ''}`}
                        onClick={() => setView('postari')} 
                    >
                        Postari
                    </button>

                    <button className={`uppercase font-semibold py-2 italic opacity-70 hover:opacity-100 duration-150 relative 
                        ${view === 'salvari' ? 'opacity-100 before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-black' : ''}`}
                        onClick={() => setView('salvari')} 
                    >
                        Salvari
                    </button>
                </div>
            </div>
            
            <div className="flex flex-wrap justify-center sm:w-[80%] 2xl:w-[1600px] mb-8">
                {view === 'postari' ? (
                    <UserRecipe username={username} onRecipeClick={handleRecipeClick} />
                ) : (
                    <SavedRecipe username={username} onRecipeClick={handleRecipeClick} />
                )}
            </div>
        </div>

        {selectedRecipe && (
            <div
            className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 z-10 flex items-center justify-center"
            >
                <ViewRecipe recipe={selectedRecipe} onClose={handleClose} />
            </div>
        )}
    </div>
  )
}
