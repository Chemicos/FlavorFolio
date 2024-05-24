// import { getAuth, onAuthStateChanged } from "firebase/auth"
 import { useState } from "react"
// import { useNavigate } from "react-router-dom"
// import { db } from "../firebase-config"
// import { doc, getDoc } from "@firebase/firestore"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Navigation from "./Navigation"
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import Content from "./Content"
import PostForm from "./PostForm"

// TODO: FIX navigation bar
export default function Home() {
  const [isPostFormVisible, setIsPostFormVisible] = useState(false)

  const handlePostClick = () => {
    setIsPostFormVisible(true)
  }

  const handleClose = () => {
    setIsPostFormVisible(false)
  }

  return (
    <div className="h-screen w-screen overflow-x-hidden">
      <Navigation />

      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-6 mt-4">
          <h1 className="font-base italic text-2xl">Search and cook</h1> 
          <div className="relative">
            <input type="search" 
              placeholder="Search..."
              className="rounded-2xl w-80 bg-ff-search py-2 pl-10 pr-4
              placeholder:text-ff-placeholder shadow-md duration-150 opacity-70 hover:opacity-100 focus:opacity-100"
            />

            <FontAwesomeIcon 
              icon={faMagnifyingGlass} 
              className="absolute inset-y-0 left-0 my-auto ml-2 opacity-80" 
            />
          </div>
        </div>
      
        <Content handlePostClick={handlePostClick} />

        {isPostFormVisible && 
          <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 z-10 flex items-center justify-center">
            <PostForm handleClose={handleClose} />
          </div>
        }
      </div>
    </div>
  )
}
