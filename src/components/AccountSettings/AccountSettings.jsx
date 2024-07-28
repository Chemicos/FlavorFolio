import { useEffect, useState } from "react";
import Navigation from "../Navigation";
import SettingsMenu from "./SettingsMenu";
import EditProfile from "./EditProfile";
import AccountManagement from "./AccountManagement";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import EditGoogleProfile from "./EditGoogleProfile";
import Feedback from "../Feedback/Feedback";

export default function AccountSettings() {
    const [view, setView] = useState('editProfile')
    const [isGoogleAccount, setIsGoogleAccount] = useState(false)
    const navigate = useNavigate()
    const auth = getAuth()
    const [isFeedbackVisible, setIsFeedbackVisible] = useState(false)

    const handleFeedbackClick = () => {
        setIsFeedbackVisible(true)
    }
    
    const handleClose = () => {
        setIsFeedbackVisible(false)
    }

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
            setIsGoogleAccount(user.providerData.some(provider => provider.providerId === 'google.com'));
        }
    });
    return () => unsubscribe();
    }, [auth])

    const handleProfileEdit = () => {
        setView('editProfile')
    }

    const handleAccountManagement = () => {
        setView('accountManagement')
    }

    const handleBack = () => {
        navigate('/profile')
    }

  return (
    <div className="flex flex-col bg-ff-bg dark:bg-dark-bg h-screen w-screen overflow-x-hidden gap-8">
      <Navigation onFeedbackClick={handleFeedbackClick} />

      <div className="flex flex-row justify-center">
            <SettingsMenu 
                onProfileEdit={handleProfileEdit} 
                onAccountManagement={handleAccountManagement} 
                onBack={handleBack} 
                isGoogleAccount={isGoogleAccount}
                activeView={view}
            />
            
            {view === 'editProfile' && (isGoogleAccount ? <EditGoogleProfile /> : <EditProfile />)}
            {view === 'accountManagement' && <AccountManagement />}

            {isFeedbackVisible && (
              <Feedback onClose={handleClose} />
            )}
      </div>
    </div>
  )
}