
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "@firebase/firestore";
import { db } from "../../firebase-config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

export default function EditGoogleProfile() {
    const [profileImage, setProfileImage] = useState('')
    const [username, setUsername] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [userDescription, setUserDescription] = useState('')
    const [socialProfiles, setSocialProfiles] = useState([])
    const [isFormValid, setIsFormValid] = useState(false)
    const auth = getAuth()

    // Retrieve data from users <<
    useEffect(() => {
        const fetchUserProfile = async (user) => {
            const userRef = doc(db, 'users', user.uid)
            const docSnap = await getDoc(userRef)

            if (docSnap.exists()) {
                const userData = docSnap.data()
                setFirstName(userData.firstName || '')
                setLastName(userData.lastName || '')
                setUserDescription(userData.userDescription || '')
                setSocialProfiles(userData.socialProfiles || []);
                setProfileImage(userData.profileImage || user.photoURL || '')
                setUsername(userData.username || user.displayName || '')
            } else {
                setProfileImage(user.photoURL || '')
                setUsername(user.displayName || '')
            }
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUserProfile(user)
            } else {
                setUsername('')
                setProfileImage('')
                setFirstName('')
                setLastName('')
                setUserDescription('')
                setSocialProfiles([])
            }
        });

        return () => unsubscribe();
    }, [auth])

    useEffect(() => {
        setIsFormValid(
            firstName.trim() !== '' ||
            lastName.trim() !== '' ||
            userDescription.trim() !== '' ||
            socialProfiles.some(profile => profile.trim() !== '')
        )
    }, [firstName, lastName, userDescription, socialProfiles])

    const handleAddProfile = () => {
        setSocialProfiles([...socialProfiles, ""])
    }

    const handleRemoveProfile = (index) => {
        const updatedProfiles = socialProfiles.filter((_, i) => i !== index)
        setSocialProfiles(updatedProfiles)
    }

    const handleProfileChange = (index, value) => {
        const updatedProfiles = socialProfiles.map((profile, i) => i === index ? value : profile)
        setSocialProfiles(updatedProfiles);
    }

    const handleSave = async (e) => {
        e.preventDefault()
        const user = auth.currentUser
        const userRef = doc(db, 'users', user.uid)
        
        try {
            const docSnap = await getDoc(userRef)
            if (docSnap.exists()) {
                await updateDoc(userRef, {
                    firstName,
                    lastName,
                    userDescription,
                    socialProfiles
                })
            } else {
                await setDoc(userRef, {
                    firstName,
                    lastName,
                    userDescription,
                    socialProfiles,
                    profileImage: user.photoURL || '',
                    username: user.displayName || ''
                })
            }
            alert('Profil actualizat cu succes!')
        } catch (error) {
            console.error('Eroare la actualizarea profilului: ', error)
            alert('Eroare la actualizarea profilului.')
        }
    }

    return (
        <div className="w-[600px] flex flex-col gap-6 px-4">
            <div className="flex flex-col items-center sm:items-start sm:flex-row gap-4">
                {profileImage ? (
                    <div className="relative w-[150px] flex justify-center">
                        <img 
                            src={profileImage} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full object-cover"
                        />
                    </div>
                ) : (
                    <label className="relative flex flex-col justify-center w-32 h-32 rounded-full border 
                        border-black">
                        <FontAwesomeIcon icon={faUser} className="text-4xl" />
                    </label>
                )}

                <div className="flex flex-col items-center sm:items-start gap-4">
                    <span className="font-semibold text-xl dark:text-dark-border">{username}</span>

                    <p className="italic opacity-80 md:w-[400px] text-sm dark:text-dark-border dark:opacity-100">{userDescription}</p>
                </div>
            </div>

            <form className="flex flex-col gap-8" onSubmit={handleSave}>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                        className="bg-transparent w-full border border-black rounded-2xl px-3 py-3 
                            placeholder:text-black placeholder:opacity-50 placeholder:italic dark:border-dark-border dark:text-dark-border" 
                        type="text"
                        placeholder="Nume"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    <input 
                        className="bg-transparent w-full border border-black rounded-2xl px-3 py-3 
                            placeholder:text-black placeholder:opacity-50 placeholder:italic dark:border-dark-border dark:text-dark-border" 
                        type="text" 
                        placeholder="Prenume"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>

                <textarea 
                    className="bg-transparent border border-black rounded-2xl px-3 py-3 
                        placeholder:text-black placeholder:opacity-50 placeholder:italic dark:border-dark-border dark:text-dark-border" 
                    type="text"
                    placeholder="Despre"
                    value={userDescription}
                    onChange={(e) => setUserDescription(e.target.value)} 
                />

                <div className="flex flex-col gap-8">
                    <h1 className="text-xl font-semibold dark:text-dark-border">
                        Profiluri sociale
                    </h1>

                    {socialProfiles.map((profile, index) => (
                        <div key={index} className="flex flex-row gap-2 items-center">
                            <input 
                                className="bg-transparent w-full border border-black rounded-2xl px-3 py-3 
                                placeholder:text-black placeholder:opacity-50 placeholder:italic dark:border-dark-border dark:text-dark-border dark:placeholder:text-dark-border" 
                                type="text"
                                placeholder="Ex: Profil Instagram"
                                value={profile}
                                onChange={(e) => handleProfileChange(index, e.target.value)}
                            />
                            <button
                                type="button"
                                className="flex items-center justify-center h-[30px] w-[30px] rounded-full
                                hover:bg-ff-btn dark:hover:bg-dark-elements duration-200"
                                onClick={() => handleRemoveProfile(index)}
                            >
                                <FontAwesomeIcon className="dark:text-dark-border" icon={faTrash} />
                            </button>
                        </div>
                    ))}

                    <div className="flex flex-col w-full gap-2">
                        <div className="flex flex-row justify-between">
                            <span className="text-lg dark:text-dark-border">Adauga</span>

                            <button className="flex items-center justify-center h-[30px] w-[30px] borde rounded-full
                                hover:bg-ff-btn dark:hover:bg-dark-elements duration-200"
                                onClick={handleAddProfile}
                                type="button"
                            >
                                <FontAwesomeIcon className="dark:text-dark-border" icon={faPlus} />
                            </button>
                        </div>

                        <span className="bg-black dark:bg-dark-border opacity-20 h-[1px]"></span>
                    </div>
                </div>

                <button
                    type="submit"
                    className={`bg-ff-btn text-black border border-ff-btn hover:border-black font-semibold rounded-lg py-2 px-4 mb-6 duration-150 
                        dark:hover:bg-transparent dark:hover:border dark:hover:border-dark-border dark:hover:text-dark-border
                        ${isFormValid ? 'hover:bg-black hover:text-white' : 'opacity-50 cursor-not-allowed'}`}
                    disabled={!isFormValid}
                >
                    Salveaza
                </button>
            </form>
        </div>
    );
}