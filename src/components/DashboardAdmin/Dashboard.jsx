import { useState } from "react"
import Navigation from "../Navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faBasketShopping, faChevronDown, faChevronUp, faComment, faEye, faHeart, faHeartCrack, faThumbsDown, faThumbsUp, faUser } from "@fortawesome/free-solid-svg-icons";
import MostSavedRecipes from "./RecipesReport/MostSavedRecipes";
import LeastSavedRecipes from "./RecipesReport/LeastSavedRecipes";
import HighestRatingRecipes from "./RecipesReport/HighestRatingRecipes";
import LowestRatingRecipes from "./RecipesReport/LowestRatingRecipes";
import MostCommentedRecipes from "./RecipesReport/MostCommentedRecipes";
import MostActiveUsers from "./UsersReport/MostActiveUsers";
import FollowersReport from "./UsersReport/FollowersReport";
import TotalRecipes from "./RecipesReport/TotalRecipes";
import Feedback from "../Feedback/Feedback";

export default function Dashboard() {
    const [activeComponent, setActiveComponent] = useState(null)
    const [showRecipeDropdown, setShowRecipeDropdown] = useState(false)
    const [showUserDropdown, setShowUserDropdown] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isFeedbackVisible, setIsFeedbackVisible] = useState(false)

    const handleFeedbackClick = () => {
      setIsFeedbackVisible(true)
    }

    const handleFeedbackClose = () => {
        setIsFeedbackVisible(false)
    }

    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen)
    }

  return (
    <div className="flex flex-col relative bg-ff-bg dark:bg-dark-bg h-screen w-screen overflow-x-hidden">
      <Navigation onFeedbackClick={handleFeedbackClick} />
      
      <div className="flex h-full">
        <button 
          className="md:hidden absolute top-4 right-32 z-10 text-2xl dark:text-dark-border"
          onClick={toggleSidebar}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>

        <div className={`fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden ${isSidebarOpen ? "block" : "hidden"}`} onClick={toggleSidebar}></div>

        <div className={`fixed top-0 left-0 h-full w-[300px] bg-ff-bg dark:bg-dark-bg p-4 border-r border-black dark:border-dark-border dark:border-opacity-20 border-opacity-20 z-20 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform md:relative md:translate-x-0`}>
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
                    setIsSidebarOpen(false)
                  }}
                >
                  <FontAwesomeIcon icon={faHeart} />
                  Cele mai Salvate 
                </button>

                <button
                  className="flex items-center gap-2 w-full py-2 px-4 text-sm hover:bg-ff-content rounded-lg text-black 
                  dark:text-dark-border dark:hover:bg-dark-highlight"
                  onClick={() => {
                    setActiveComponent(<TotalRecipes />)
                    setIsSidebarOpen(false)
                  }}
                >
                  Toate Retetele
                </button>

                <button
                  className="flex items-center gap-2 w-full py-2 px-4 text-sm hover:bg-ff-content rounded-lg text-black 
                  dark:text-dark-border dark:hover:bg-dark-highlight"
                  onClick={() => {
                    setActiveComponent(<LeastSavedRecipes />)
                    setIsSidebarOpen(false)
                  }}
                >
                  <FontAwesomeIcon icon={faHeartCrack} />
                  Cele mai Putin Salvate 
                </button>
                <button
                  className="flex items-center gap-2 w-full py-2 px-4 text-sm hover:bg-ff-content rounded-lg text-black 
                  dark:text-dark-border dark:hover:bg-dark-highlight"
                  onClick={() => {
                    setActiveComponent(<HighestRatingRecipes />);
                    setIsSidebarOpen(false)
                  }}
                >
                  <FontAwesomeIcon icon={faThumbsUp} />
                  Cel mai Mare Rating
                </button>
                <button
                  className="flex items-center gap-2 w-full py-2 px-4 text-sm hover:bg-ff-content rounded-lg text-black 
                  dark:text-dark-border dark:hover:bg-dark-highlight"
                  onClick={() => {
                    setActiveComponent(<LowestRatingRecipes />);
                    setIsSidebarOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faThumbsDown} />
                  Cel mai Mic Rating 
                </button>
                <button
                  className="flex items-center gap-2 w-full py-2 px-4 text-sm hover:bg-ff-content rounded-lg text-black 
                  dark:text-dark-border dark:hover:bg-dark-highlight"
                  onClick={() => {
                    setActiveComponent(<MostCommentedRecipes />);
                    setIsSidebarOpen(false);
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
                    onClick={() => {
                      setActiveComponent(<FollowersReport />)
                    }}
                  >
                    <FontAwesomeIcon icon={faEye} />
                    Urmaritori
                  </button>
                </div>
              )}
          </div>
        </div>

        <div className="flex-grow overflow-x-auto p-4">
          {activeComponent ? (
            activeComponent
          ) : (
            <p className="dark:text-dark-border">Alege o optiune din meniu <FontAwesomeIcon className="md:hidden" icon={faBars} /></p>
          )}
        </div>
      </div>
      
      {isFeedbackVisible && (
        <Feedback onClose={handleFeedbackClose} />
      )}
    </div>
  )
}
