import { useEffect, useState } from "react";
import Navigation from "../Navigation";
import { collection, deleteDoc, doc, getDocs } from "@firebase/firestore";
import { db } from "../../firebase-config";
import FeedbackCard from "./FeedbackCard";


export default function ManageFeedback() {
  const [feedbacks, setFeedbacks] = useState([])

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const feedbackCollection = collection(db, 'feedbacks')
        const feedbackSnapshot = await getDocs(feedbackCollection)
        const feedbackList = feedbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setFeedbacks(feedbackList)
      } catch (error) {
        console.error('Eroare la recuperarea datelor: ', error)
      }
    }

    fetchFeedbacks()
  }, [])

  const handleDelete = async (id) => {
    if (window.confirm('Doriti sa stergeti acest feedback?')) {
        try {
            await deleteDoc(doc(db, 'feedbacks', id))
            setFeedbacks(feedbacks.filter(feedback => feedback.id !== id))
            alert('Feedback sters cu succes.')
        } catch (error) {
            alert('A aparut o eroare la stergerea feedback-ului.')
        }
    }
}

  return (
    <div className="flex flex-col relative bg-ff-bg dark:bg-dark-bg h-screen w-screen overflow-x-hidden">
        <Navigation />
      
        <div className="flex flex-grow overflow-hidden">
          <div className="top-0 left-0 h-full w-[400px] bg-ff-bg dark:bg-dark-bg p-4 border-r border-black dark:border-dark-border dark:border-opacity-20 border-opacity-20 z-20 transform
          transition-transform md:relative md:translate-x-0 overflow-y-auto"
          >
            <h2 className="text-xl font-bold mb-4 dark:text-dark-border">
              Feedback Inbox
            </h2>

            <div className="flex flex-col h-auto gap-4">
              {feedbacks.map(feedback => (
                <FeedbackCard 
                  key={feedback.id} 
                  feedback={feedback}
                  onDelete={() => handleDelete(feedback.id)}
                />
              ))

              }
            </div>
          </div>

          <div className="flex-grow p-4">

          </div>
        </div>
    </div>
  )
}
