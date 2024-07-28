/* eslint-disable react/prop-types */
export default function ViewFeedback({ feedback, onDelete }) {
    const getFormattedDate = (timestamp) => {
        const date = timestamp.toDate()
        const options = {weekday: 'long', hour: '2-digit', minute: '2-digit'}
        return date.toLocaleDateString('ro-RO', options)
    }

  return (
    <div className="bg-ff-content dark:bg-dark-elements p-4 rounded-lg 
        shadow-md dark:shadow-none flex flex-col gap-4">

      <div className="flex items-center gap-4">
        <img 
            src={feedback.profileImage} 
            alt="profileimg" 
            className="w-16 h-16 rounded-full"
        />

        <div className="flex flex-col">
            <h3 className="text-2xl font-bold dark:text-dark-border">
                {feedback.username}
            </h3>

            <span className="text-sm text-gray-600 dark:text-dark-border dark:text-opacity-50">
                {getFormattedDate(feedback.timestamp)}
            </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 items-start">
        <p className="text-sm dark:text-dark-border">
            <strong>Rating: </strong>
            {feedback.rating}
        </p>

        <p className="dark:text-dark-border">
            {feedback.feedback}
        </p>
        
        <button className="dark:hover:bg-ff-btn rounded-lg hover:bg-ff-btn px-3 py-2 dark:border dark:border-dark-border dark:hover:border-ff-btn
        font-semibold dark:bg-transparent dark:text-dark-border dark:hover:text-black transition duration-150"
            onClick={() => onDelete(feedback.id)}
        >
            Sterge
        </button>
      </div>
    </div>
  )
}
