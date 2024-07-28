import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Navigation from "../Navigation";
import { faBasketShopping } from "@fortawesome/free-solid-svg-icons";
import UserRecipe from "../myProfile/UserRecipe";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "@firebase/firestore";
import { db } from "../../firebase-config";
import FollowBtn from "../content/FollowBtn";
import ViewRecipe from "../ViewRecipe";
import UserDetails from "../myProfile/UserDetails";


export default function ViewUserProfile() {
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [view, setView] = useState('postari')
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  useEffect(() => {
    const fetchUserData = async () => {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        setUser(userSnap.data())
      }
    }
    fetchUserData()
  }, [userId])

  const handleRecipeClick = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleClose = () => {
    setSelectedRecipe(null);
  };
  

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col bg-ff-bg dark:bg-dark-bg h-screen w-screen overflow-x-hidden">
      <Navigation />
      <div className="flex flex-col items-center justify-between gap-4 sm:gap-8 mt-4">
        <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-10 items-center">
          <img 
              src={user.profileImage} 
              alt="Profile" 
              className="w-32 h-32 rounded-full shadow-md object-cover"
          />

          <div className="flex md:flex-row flex-col gap-4 items-center sm:items-start">
            <div className="flex flex-col items-center md:items-start gap-2">
              <p className="text-2xl sm:text-xl dark:text-dark-border font-semibold italic">{user.username}</p>
                    
              <p className="italic opacity-70 text-sm dark:text-dark-border dark:opacity-100 w-[300px]">{user.userDescription}</p>
              
              {user.socialProfiles && user.socialProfiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  {user.socialProfiles.map((profile, index) => (
                    <a key={index} href={profile} className="dark:text-dark-border opacity-60">{profile}</a>
                  ))}
                </div>
              )}

              <UserDetails username={user.username} userId={userId} />
            </div>

              <FollowBtn recipeUser={userId} />
          </div>
        </div>


        <div className="flex flex-col items-center w-full">
          <div className="h-[1px] bg-black dark:bg-dark-border dark:opacity-30 w-full opacity-10 sm:w-[600px]"></div>

          <div className="flex justify-center w-[240px] sm:w-[300px]">
              <button className={`flex gap-2 items-center uppercase font-semibold pt-2 italic opacity-70 hover:opacity-100 duration-150 relative dark:text-dark-border 
              ${view === 'postari' ? 
                  'opacity-100 before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-black dark:before:bg-dark-border' 
                  : ''}`}
                  onClick={() => setView('postari')} 
              >
                  <FontAwesomeIcon icon={faBasketShopping} />
                  Postări
              </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center sm:w-[80%] 2xl:w-[1600px] mb-8">
          {view === 'postari' && (
              <UserRecipe userId={userId} onRecipeClick={handleRecipeClick} />
          )}
        </div>
      </div>

      {selectedRecipe && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 z-10 flex items-center justify-center">
          <ViewRecipe recipe={selectedRecipe} onClose={handleClose} />
        </div>
      )}
    </div>
  )
}
