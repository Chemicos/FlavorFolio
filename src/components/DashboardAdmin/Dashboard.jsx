import { useState } from "react"
import Navigation from "../Navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBasketShopping, faChevronDown, faChevronUp, faComment, faEye, faHeart, faHeartCrack, faThumbsDown, faThumbsUp, faUser } from "@fortawesome/free-solid-svg-icons";
import MostSavedRecipes from "./RecipesReport/MostSavedRecipes";
import LeastSavedRecipes from "./RecipesReport/LeastSavedRecipes";
import HighestRatingRecipes from "./RecipesReport/HighestRatingRecipes";
import LowestRatingRecipes from "./RecipesReport/LowestRatingRecipes";
import MostCommentedRecipes from "./RecipesReport/MostCommentedRecipes";
import MostActiveUsers from "./UsersReport/MostActiveUsers";

export default function Dashboard() {
    const [activeComponent, setActiveComponent] = useState(null)
    const [showRecipeDropdown, setShowRecipeDropdown] = useState(false)
    const [showUserDropdown, setShowUserDropdown] = useState(false)

  return (
    <div className="flex flex-col bg-ff-bg dark:bg-dark-bg h-screen w-screen overflow-x-hidden">
      <Navigation />

      
      <div className="flex h-full">
        <div className="w-[300px] bg-ff-sidebar dark:bg-dark-sidebar p-4 border-r border-black border-opacity-20">
          <h2 className="text-xl font-bold mb-4 dark:text-dark-border">Meniu Raport</h2>

          <div className="relative">
            <button
              className="flex gap-2 items-center w-full py-2 px-4 mb-2 hover:bg-ff-content text-black font-semibold rounded-lg 
              dark:text-dark-border dark:hover:bg-dark-highlight"
              onClick={() => setShowRecipeDropdown(!showRecipeDropdown)}
            >
              <FontAwesomeIcon icon={faBasketShopping} />
              Retete

              <FontAwesomeIcon className="ml-auto" icon={showRecipeDropdown ? faChevronUp : faChevronDown} />
            </button>
            {showRecipeDropdown && (
              <div className="flex flex-col transition-all duration-300 ease-in-out transform">
                <button
                  className="flex items-center gap-2 w-full py-2 px-4 text-sm hover:bg-ff-content rounded-lg text-black 
                  dark:text-dark-border dark:hover:bg-dark-highlight"
                  onClick={() => {
                    setActiveComponent(<MostSavedRecipes />)
                  }}
                >
                  <FontAwesomeIcon icon={faHeart} />
                  Cele mai Salvate 
                </button>
                <button
                  className="flex items-center gap-2 w-full py-2 px-4 text-sm hover:bg-ff-content rounded-lg text-black 
                  dark:text-dark-border dark:hover:bg-dark-highlight"
                  onClick={() => {
                    setActiveComponent(<LeastSavedRecipes />)
                  }}
                >
                  <FontAwesomeIcon icon={faHeartCrack} />
                  Cele mai Putin Salvate 
                </button>
                <button
                  className="flex items-center gap-2 w-full py-2 px-4 text-sm hover:bg-ff-content rounded-lg text-black 
                  dark:text-dark-border dark:hover:bg-dark-highlight"
                  onClick={() => {
                    setActiveComponent(<HighestRatingRecipes />)
                  }}
                >
                  <FontAwesomeIcon icon={faThumbsUp} />
                  Cel mai Mare Rating
                </button>
                <button
                  className="flex items-center gap-2 w-full py-2 px-4 text-sm hover:bg-ff-content rounded-lg text-black 
                  dark:text-dark-border dark:hover:bg-dark-highlight"
                  onClick={() => {
                    setActiveComponent(<LowestRatingRecipes />)
                  }}
                >
                  <FontAwesomeIcon icon={faThumbsDown} />
                  Cel mai Mic Rating 
                </button>
                <button
                  className="flex items-center gap-2 w-full py-2 px-4 text-sm hover:bg-ff-content rounded-lg text-black 
                  dark:text-dark-border dark:hover:bg-dark-highlight"
                  onClick={() => {
                    setActiveComponent(<MostCommentedRecipes />)
                  }}
                >
                  <FontAwesomeIcon icon={faComment} />
                  Cele mai Comentate 
                </button>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button
              className="flex gap-2 items-center w-full py-2 px-4 mb-2 hover:bg-ff-content text-black font-semibold rounded-lg 
              dark:text-dark-border dark:hover:bg-dark-highlight"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <FontAwesomeIcon icon={faUser} />
              Utilizatori
              <FontAwesomeIcon className="ml-auto" icon={showUserDropdown ? faChevronUp : faChevronDown} />
            </button>

            {showUserDropdown && (
                <div className="flex flex-col transition-all duration-300 ease-in-out transform">
                  <button
                    className="flex items-center gap-2 w-full py-2 px-4 text-sm hover:bg-ff-content rounded-lg text-black 
                    dark:text-dark-border dark:hover:bg-dark-highlight"
                    onClick={() => {
                      setActiveComponent(<MostActiveUsers />)
                    }}
                  >
                    <FontAwesomeIcon icon={faUser} />
                    Activitate
                  </button>
                  
                  <button
                    className="flex items-center gap-2 w-full py-2 px-4 text-sm hover:bg-ff-content rounded-lg text-black 
                    dark:text-dark-border dark:hover:bg-dark-highlight"
                    // onClick={() => {
                    //   setActiveComponent(<MostActiveUsers />)
                    // }}
                  >
                    <FontAwesomeIcon icon={faEye} />
                    Urmaritori
                  </button>
                </div>
              )}
          </div>
        </div>

        <div className="flex-grow p-4">
          {activeComponent ? (
            activeComponent
          ) : (
            <p className="dark:text-dark-border">Alege o optiune din meniu.</p>
          )}
        </div>
      </div>

    </div>
  )
}
