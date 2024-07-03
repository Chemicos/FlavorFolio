import { useState } from "react"

export default function Feedback({ onClose }) {
    const [feedback, setFeedback] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()

        onClose()
    }

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 z-20 flex items-center justify-center">
      <div className="bg-white dark:bg-dark-elements p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold mb-4 dark:text-dark-border">Feedback</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full h-40 p-2 border border-gray-300 dark:border-dark-border rounded-md mb-4 dark:bg-dark-bg dark:text-dark-border"
            placeholder="Enter your feedback..."
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-ff-btn text-white rounded-md hover:bg-ff-content"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
