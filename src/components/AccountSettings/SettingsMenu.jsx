/* eslint-disable react/prop-types */
import { faChevronLeft, faGear, faPencil } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"

export default function SettingsMenu({ onProfileEdit, onAccountManagement, onBack, isGoogleAccount, activeView }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

  return (
    <div className="relative">
            <div className="md:hidden flex items-center justify-end p-4">
                <button onClick={toggleMenu}>
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xl dark:text-dark-border" />
                </button>
            </div>

            <div className={`fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden ${isMenuOpen ? 'block' : 'hidden'}`} onClick={toggleMenu}></div>

            <div className={`fixed inset-0 bg-black z-10 transition-transform transform 
                ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:relative md:translate-x-0 flex flex-col items-start gap-2 w-[300px] bg-ff-bg md:bg-transparent md:border-none p-4 md:p-0
                ${isMenuOpen ? 'dark:bg-dark-bg dark:border-r-[1px] dark:border-dark-border dark:border-opacity-20' : ''}`}
            >
                <button className="md:hidden mb-4 text-left px-4 py-2 hover:bg-gray-100 rounded-full" onClick={toggleMenu}>
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xl dark:text-dark-border" />
                </button>

                <button 
                    className={`mb-2 flex flex-row gap-3 items-center md:hover:bg-ff-content md:rounded-lg md:p-2
                        dark:text-dark-border dark:md:hover:bg-dark-highlight dark:md:rounded-lg dark:md:p-2
                        ${activeView === 'editProfile' ? 'underline font-bold' : ''}`} 
                    onClick={() => { onProfileEdit(); toggleMenu(); }}
                    >
                        Editează profilul
                        <FontAwesomeIcon icon={faPencil} />
                </button>

                {!isGoogleAccount && (
                    <button 
                        className={`mb-2 flex flex-row gap-3 items-center md:hover:bg-ff-content md:rounded-lg md:p-2
                            dark:text-dark-border dark:md:hover:bg-dark-highlight dark:md:rounded-lg dark:md:p-2
                            ${activeView === 'accountManagement' ? 'underline font-bold' : ''}`} 
                        onClick={() => { onAccountManagement(); toggleMenu(); }}
                    >
                            Gestionarea contului
                            <FontAwesomeIcon icon={faGear} />
                    </button>
                )}

                <button 
                    className="mt-10 md:hover:bg-ff-content md:rounded-lg md:p-2 dark:text-dark-border dark:md:hover:bg-dark-highlight dark:md:rounded-lg dark:md:p-2" 
                    onClick={() => { onBack(); toggleMenu(); }}
                >
                    Înapoi
                </button>
            </div>
        </div>
  )
}
