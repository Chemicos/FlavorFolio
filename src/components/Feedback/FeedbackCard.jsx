/* eslint-disable react/prop-types */
import { faThumbTack, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export default function FeedbackCard({ feedback, onDelete, onClick, onTogglePin }) {
  const [isPinned, setIsPinned] = useState(feedback.isPinned || false)
  const MAX_CHARACTERS = 40

    const getFormattedDate = (timestamp) => {
        const date = timestamp.toDate()
        const options = {weekday: 'long', hour: '2-digit', minute: '2-digit'}
        return date.toLocaleDateString('ro-RO', options)
    }

    const handlePinClick = (e) => {
      e.stopPropagation()
      setIsPinned(!isPinned)
      onTogglePin(feedback.id, !isPinned)
    }

    const truncateText = (text, maxLength) => {
      if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...'
      }
      return text
    }

  return (
    <div className="flex flex-col gap-2 bg-ff-content dark:bg-dark-elements p-4 rounded-lg hover:shadow-md dark:shadow-none
    dark:hover:bg-dark-highlight relative cursor-pointer group"
      onClick={onClick}
    >
      <div className={`absolute top-2 right-4 flex-row gap-2 text-gray-500 dark:text-dark-border transition duration-150 ${isPinned ? 'flex' : 'hidden group-hover:flex'}`}>
                <button 
                  className={`hover:text-green-500 dark:text-dark-border dark:hover:text-dark-btn ${isPinned ? 'text-green-500 dark:text-dark-btn' : ''}`} 
                  onClick={handlePinClick}
                >
                    <FontAwesomeIcon icon={faThumbTack} />
                </button>

                <button 
                  className="hover:text-red-500 dark:text-dark-border dark:hover:text-dark-btn" 
                  onClick={onDelete}
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

      <div className="flex flex-row gap-2 items-center">
        <img 
            src={feedback.profileImage} 
            className="w-10 h-10 rounded-full" 
            alt="profileimg" 
        />

        <div className="flex flex-col">
            <h3 className="text-lg font-bold dark:text-dark-border">
                {feedback.username}
            </h3>

            <span className="text-sm text-gray-600 dark:text-dark-border dark:text-opacity-50">
                {getFormattedDate(feedback.timestamp)}
            </span>
        </div>
      </div> 
      
      <p className="text-sm dark:text-dark-border">
        <strong>Subiect: </strong> 
        {feedback.subject}
      </p>

      <p className="text-sm dark:text-dark-border">
        <strong>Rating: </strong> 
        {feedback.rating}
      </p>

      <p className="text-sm dark:text-dark-border">
        <strong>Feedback: </strong> 
        {truncateText(feedback.feedback, MAX_CHARACTERS)}
      </p>
    </div>
  )
}
