/* eslint-disable react/prop-types */
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function FeedbackCard({ feedback, onDelete }) {
    const getFormattedDate = (timestamp) => {
        const date = timestamp.toDate()
        const options = {weekday: 'long', hour: '2-digit', minute: '2-digit'}
        return date.toLocaleDateString('ro-RO', options)
    }

  return (
    <div className="flex flex-col gap-2 bg-ff-content dark:bg-dark-elements p-4 rounded-lg hover:shadow-md dark:shadow-none
    dark:hover:bg-dark-highlight relative cursor-pointer group"
    >
      <button className="absolute top-2 right-4 text-gray-500 hover:text-red-500
      dark:text-dark-border dark:hover:text-dark-btn transition duration-150 hidden group-hover:block"
        onClick={onDelete}
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>

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
        {feedback.feedback}
      </p>
    </div>
  )
}
