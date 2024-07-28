import { collection, getDocs } from "@firebase/firestore"
import jsPDF from "jspdf"
import 'jspdf-autotable'
import { useEffect, useState } from "react"
import { db } from "../../../firebase-config"
import FlavorFolioLogo from '../../../assets/FlavorFolio_logo1.png'

export default function MostCommentedRecipes() {
  const [mostCommentedRecipes, setMostCommentedRecipes] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const recipesSnapshot = await getDocs(collection(db, 'recipes'))
        let maxComments = 0
        let topRecipes = []

        recipesSnapshot.forEach(doc => {
          const data = doc.data()
          const commentsCount = data.comments ? data.comments.length : 0
          if (commentsCount > maxComments) {
            maxComments = commentsCount
            topRecipes = [data]
          } else if (commentsCount === maxComments) {
            topRecipes.push(data)
          }
        })

        setMostCommentedRecipes(topRecipes.map(recipe => ({
          ...recipe,
          commentsCount: recipe.comments ? recipe.comments.length : 0
        })))
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
    doc.text('Raport Cele Mai Comentate Retete', 130, 15)

    const tableData = mostCommentedRecipes.map((recipe, index) => [
      index + 1,
      recipe.title,
      recipe.user,
      recipe.commentsCount
    ])

    doc.autoTable({
      startY: 30,
      head: [['#', 'Title', 'User', 'Total Comments']],
      body: tableData,
    })

    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(12)
    doc.text(`Data: ${currentDate}`, 14, pageHeight - 10)

    doc.save('most_commented_recipes_report.pdf')
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center">
        <h2 className="font-semibold text-xl dark:text-dark-border">Cele mai Comentate Retete</h2>
        <button onClick={generatePDF} className="ml-auto font-semibold bg-ff-btn rounded-xl py-2 px-3 hover:bg-ff-content duration-100">PDF</button>
      </div>

      <div>
        {mostCommentedRecipes.length > 0 ? (
          <table className="min-w-full bg-ff-content dark:bg-dark-elements rounded-t-lg">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">#</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">Titlu</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">Utilizator</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">Total Comentarii</th>
              </tr>
            </thead>
            <tbody>
              {mostCommentedRecipes.map((recipe, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border-b text-center border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">{index + 1}</td>
                  <td className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">{recipe.title}</td>
                  <td className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">{recipe.user}</td>
                  <td className="py-2 px-4 border-b text-center border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">{recipe.commentsCount}</td>
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
