import { collection, getDocs } from "@firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../../../firebase-config"
import jsPDF from "jspdf"
import 'jspdf-autotable'
import FlavorFolioLogo from '../../../assets/FlavorFolio_logo1.png'

export default function LeastSavedRecipes() {
  const [leastSavedRecipes, setLeastSavedRecipes] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const savedRecipesSnapshot = await getDocs(collection(db, 'savedRecipes'))
        let maxSaves = 0;
        let allRecipes = []

        savedRecipesSnapshot.forEach(doc => {
          const data = doc.data()
          if (data.userIds && data.userIds.length > maxSaves) {
            maxSaves = data.userIds.length
          }
          allRecipes.push(data)
        })

        const leastSavedRecipes = allRecipes.filter(recipe => recipe.userIds.length < maxSaves)
        setLeastSavedRecipes(leastSavedRecipes)
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
    doc.text('Raport Cele Mai Putin Salvate Retete', 130, 15)
    
    const tableData = leastSavedRecipes.map((recipe, index) => [
      index + 1,
      recipe.title,
      recipe.user,
      recipe.userIds.length
    ])

    doc.autoTable({
      startY: 30,
      head: [['#', 'Title', 'User', 'Number of Saves']],
      body: tableData,
    })

    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(12)
    doc.text(`Data: ${currentDate}`, 14, pageHeight - 10)

    doc.save('least_saved_recipes_report.pdf')
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center">
        <h2 className="font-semibold text-xl dark:text-dark-border">Cele mai Putin Salvate Retete</h2>
        <button onClick={generatePDF} className="ml-auto font-semibold bg-ff-btn rounded-xl py-2 px-3 hover:bg-ff-content duration-100">PDF</button>
      </div>

      <div>
        {leastSavedRecipes.length > 0 ? (
          <table className="min-w-full bg-ff-content dark:bg-dark-elements rounded-t-lg">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">#</th>
                <th className="py-2 px-4 border-b border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">Titlu</th>
                <th className="py-2 px-4 border-b border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">Utilizator</th>
                <th className="py-2 px-4 border-b border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">Numar de Salvari</th>
              </tr>
            </thead>
            <tbody>
              {leastSavedRecipes.map((recipe, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border-b text-center border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{index + 1}</td>
                  <td className="py-2 px-4 border-b border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.title}</td>
                  <td className="py-2 px-4 border-b border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.user}</td>
                  <td className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.userIds.length}</td>
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
