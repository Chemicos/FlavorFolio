import { useState } from "react";
import Navigation from "../Navigation";

import SettingsMenu from "./SettingsMenu";
import EditProfile from "./EditProfile";
import AccountManagement from "./AccountManagement";
import { useNavigate } from "react-router-dom";



export default function AccountSettings() {
    const [view, setView] = useState('editProfile')
    const navigate = useNavigate()

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
    <div className="flex flex-col h-screen w-screen overflow-x-hidden gap-8">
      <Navigation />

      <div className="flex flex-row justify-center">
            <SettingsMenu 
                onProfileEdit={handleProfileEdit} 
                onAccountManagement={handleAccountManagement} 
                onBack={handleBack} 
            />
            
            {view === 'editProfile' && <EditProfile />}
            {view === 'accountManagement' && <AccountManagement />}
      </div>
    </div>
  )
}