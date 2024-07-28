import { useEffect, useState } from "react";
import Navigation from "../Navigation";
import { collection, deleteDoc, doc, getDocs, updateDoc } from "@firebase/firestore";
import { db } from "../../firebase-config";
import FeedbackCard from "./FeedbackCard";
import ViewFeedback from "./ViewFeedback";


export default function ManageFeedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [initialOrder, setInitialOrder] = useState([])

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const feedbackCollection = collection(db, "feedbacks")
        const feedbackSnapshot = await getDocs(feedbackCollection)
        const feedbackList = feedbackSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setInitialOrder(feedbackList.map(feedback => feedback.id))
        sortAndSetFeedbacks(feedbackList)
      } catch (error) {
        console.error("Eroare la recuperarea datelor: ", error)
      }
    }

    fetchFeedbacks()
  }, [])

  // Pinning and deleting functions for feedback <<
  const sortAndSetFeedbacks = (feedbackList) => {
    const pinnedFeedbacks = feedbackList.filter(feedback => feedback.isPinned)
    const unpinnedFeedbacks = feedbackList.filter(feedback => !feedback.isPinned)
    
    unpinnedFeedbacks.sort((a, b) => initialOrder.indexOf(a.id) - initialOrder.indexOf(b.id))

    setFeedbacks([...pinnedFeedbacks, ...unpinnedFeedbacks])
  }

  const handleDelete = async (id) => {
    if (window.confirm("Doriti sa stergeti acest feedback?")) {
      try {
        await deleteDoc(doc(db, "feedbacks", id))
        setFeedbacks(feedbacks.filter((feedback) => feedback.id !== id))
        setSelectedFeedback(null)
        alert("Feedback sters cu succes.")
      } catch (error) {
        alert("A aparut o eroare la stergerea feedback-ului.")
      }
    }
  }

  const handleTogglePin = async (id, isPinned) => {
    try {
      const feedbackDoc = doc(db, "feedbacks", id)
      await updateDoc(feedbackDoc, { isPinned })

      setFeedbacks((prevFeedbacks) => {
        const updatedFeedbacks = prevFeedbacks.map((feedback) => {
          if (feedback.id === id) {
            return { ...feedback, isPinned }
          }
          return feedback
        })

        const pinnedFeedbacks = updatedFeedbacks.filter(feedback => feedback.isPinned)
        const unpinnedFeedbacks = updatedFeedbacks.filter(feedback => !feedback.isPinned)
        
        unpinnedFeedbacks.sort((a, b) => initialOrder.indexOf(a.id) - initialOrder.indexOf(b.id))
        
        return [...pinnedFeedbacks, ...unpinnedFeedbacks]
      })
    } catch (error) {
      alert("A apărut o eroare la actualizarea feedback-ului.")
    }
  }
  // >>

  return (
    <div className="flex flex-col relative bg-ff-bg dark:bg-dark-bg h-screen w-screen overflow-x-hidden">
      <Navigation />

      <div className="flex flex-grow overflow-hidden">
        <div className="top-0 left-0 h-full w-[400px] flex-shrink-0 bg-ff-bg dark:bg-dark-bg p-4 border-r border-black dark:border-dark-border dark:border-opacity-20 border-opacity-20 z-20 transform transition-transform md:relative md:translate-x-0 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 dark:text-dark-border">Feedback Inbox</h2>

          <div className="flex flex-col h-auto gap-4">
            {feedbacks.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                onDelete={() => handleDelete(feedback.id)}
                onClick={() => setSelectedFeedback(feedback)}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        </div>

        <div className="flex-grow p-4">
          {selectedFeedback && (
            <ViewFeedback feedback={selectedFeedback} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </div>
  )
}
