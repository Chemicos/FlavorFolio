// import { getAuth, onAuthStateChanged } from "firebase/auth"
// import { useEffect, useState } from "react"
// import { useNavigate } from "react-router-dom"
// import { db } from "../firebase-config"
// import { doc, getDoc } from "@firebase/firestore"
import Navigation from "./Navigation"


export default function Home() {
  // let navigate = useNavigate()

  // const signOutUser = () => {
  //   signOut(auth).then(() => {
  //     navigate("/")
  //   }).catch((error) => {
  //     console.error("Sign out error", error)
  //   })
  // }

  return (
    <div className="h-screen w-screen">
      <Navigation />
      <div className="flex flex-col items-center justify-center">
        <h1>Search and cook</h1> 
      </div>
    </div>
  )
}
