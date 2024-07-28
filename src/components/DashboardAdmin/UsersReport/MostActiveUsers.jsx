import { collection, getDocs } from "@firebase/firestore"
import jsPDF from "jspdf"
import 'jspdf-autotable'
import { useEffect, useState } from "react"
import { db } from "../../../firebase-config"
import FlavorFolioLogo from '../../../assets/FlavorFolio_logo1.png'

export default function MostActiveUsers() {
  const [mostActiveUsers, setMostActiveUsers] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const recipesSnapshot = await getDocs(collection(db, 'recipes'));
        const savedRecipesSnapshot = await getDocs(collection(db, 'savedRecipes'));

        let userActivity = {};

        usersSnapshot.forEach(doc => {
          const data = doc.data();
          userActivity[doc.id] = {
            userId: doc.id,
            username: data.username,
            recipesPosted: 0,
            commentsMade: 0,
            recipesSaved: 0
          };
        });

        recipesSnapshot.forEach(doc => {
          const data = doc.data();
          if (userActivity[data.userId]) {
            userActivity[data.userId].recipesPosted += 1;
          }

          if (data.comments) {
            data.comments.forEach(comment => {
              if (userActivity[comment.userId]) {
                userActivity[comment.userId].commentsMade += 1;
              }
            });
          }
        });

        savedRecipesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.userIds) {
            data.userIds.forEach(userId => {
              if (userActivity[userId]) {
                userActivity[userId].recipesSaved += 1;
              }
            });
          }
        });

        const sortedUsers = Object.values(userActivity).sort((a, b) => b.recipesPosted - a.recipesPosted).slice(0, 10)
        setMostActiveUsers(sortedUsers)
      } catch (error) {
        console.error("Error fetching data: ", error)
      }
    }

    fetchData()
  }, [])

  const generatePDF = () => {
    const doc = new jsPDF()
    const currentDate = new Date().toLocaleDateString()

    doc.addImage(FlavorFolioLogo, 'PNG', 14, 5, 15, 15)
    doc.setFontSize(15)
    doc.text('FlavorFolio', 30, 15)
    doc.setFontSize(12)
    doc.text('Activitate Utilizatori', 150, 15)

    const tableData = mostActiveUsers.map((user, index) => [
      index + 1,
      user.userId,
      user.username,
      user.recipesPosted,
      user.commentsMade,
      user.recipesSaved
    ])

    doc.autoTable({
      startY: 30,
      head: [['#', 'ID', 'Nume utilizator', 'Retete postate', 'Comentarii facute', 'Retete salvate']],
      body: tableData,
    })

    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(12)
    doc.text(`Data: ${currentDate}`, 14, pageHeight - 10)

    doc.save('most_active_users_report.pdf')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center">
        <h2 className="font-semibold text-xl dark:text-dark-border">Activitate Utilizatori</h2>
        <button 
          onClick={generatePDF} 
          className="ml-auto font-semibold bg-ff-btn rounded-xl py-2 px-3 hover:bg-ff-content duration-100"
        >
          PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        {mostActiveUsers.length > 0 ? (
          <table className="min-w-full bg-ff-content dark:bg-dark-elements rounded-t-lg">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">#</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">ID</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">Nume Utilizator</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">Retete Postate</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">Comentarii Facute</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">Retete Salvate</th>
              </tr>
            </thead>
            <tbody>
              {mostActiveUsers.map((user, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border-b text-center border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">
                    {index + 1}
                  </td>
                  <td className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">
                    {user.userId}
                  </td>
                  <td className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">
                    {user.username}
                  </td>
                  <td className="py-2 px-4 border-b text-center border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">
                    {user.recipesPosted}
                  </td>
                  <td className="py-2 px-4 border-b text-center border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">
                    {user.commentsMade}
                  </td>
                  <td className="py-2 px-4 border-b text-center border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">
                    {user.recipesSaved}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="dark:text-dark-border">Loading...</p>
        )}
      </div>
    </div>
  )
}
