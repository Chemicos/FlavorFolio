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

export default function ProfilePage() {
    const [ user, setUser ] = useState(null)
    const [username, setUsername] = useState('')
    const [ profileImage, setProfileImage ] = useState('')
    const [ imageFile, setImageFile ] = useState(null)
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
// >>

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

                        <button className="absolute inset-0 top-0 right-0 shadow-md duration-150 bg-ff-close hover:bg-red-700 text-white rounded-full w-8 h-8"
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
                    <button className="uppercase font-semibold pt-2 italic opacity-70 hover:opacity-100
                     duration-150">
                        Postari
                    </button>

                    <button className="uppercase font-semibold py-2 italic opacity-70 hover:opacity-100
                     duration-150">
                        Salvari
                    </button>
                </div>
            </div>
            
            <div className="flex flex-wrap sm:w-[80%] 2xl:w-[1600px] mb-8">
                <UserRecipe username={username} />
            </div>
        </div>
    </div>
  )
}
