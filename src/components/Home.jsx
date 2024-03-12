import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { db } from "../firebase-config"
import { doc, getDoc } from "@firebase/firestore"

const auth = getAuth()

export default function Home() {
  let navigate = useNavigate()
  const [username, setUsername] = useState("")

// Retrieving username from users and remaining connected >>
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid
        const userRef = doc(db, "users", uid)
        getDoc(userRef).then((docSnap) => {
          if(docSnap.exists()) {
            setUsername(docSnap.data().username)
          }
        })
      } else {
        console.log("No user is signed in.")
        navigate("/")
      }
    })
    return () => unsubscribe()
  }, [navigate])
// Retrieving username from users <<

  const signOutUser = () => {
    signOut(auth).then(() => {
      navigate("/")
    }).catch((error) => {
      console.error("Sign out error", error)
    })
  }

  return (
    <div>
      <h1>Welcome to FlavorFolio, {username}</h1> 
      <button onClick={signOutUser}>Sign out</button>
    </div>
  )
}
