import { collection, getDocs } from "@firebase/firestore"
import jsPDF from "jspdf"
import 'jspdf-autotable'
import { useEffect, useState } from "react"
import { db } from "../../../firebase-config"
import FlavorFolioLogo from '../../../assets/FlavorFolio_logo1.png'

export default function TotalRecipes() {
    const [totalRecipes, setTotalRecipes] = useState([])
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const recipesSnapshot = await getDocs(collection(db, 'recipes'))
                const savedRecipesSnapshot = await getDocs(collection(db, 'savedRecipes'))

                const savedRecipesCount = {}
                savedRecipesSnapshot.forEach(doc => {
                  const data = doc.data()
                  if (data.userIds) {
                    savedRecipesCount[doc.id] = data.userIds.length
                  }
                })

                const recipesList = recipesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    user: doc.data().user || 'Necunoscut',
                    commentsCount: doc.data().comments ? doc.data().comments.length : 0,
                    ratingCount: doc.data().rating ? doc.data().rating.length : 0,
                    totalSaves: savedRecipesCount[doc.id] || 0
                }))
                setTotalRecipes(recipesList)
            } catch (error) {
                console.error("Eroare recuperare date: ", error)
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
        doc.text('Raport Retete', 160, 15)

        const tableData = totalRecipes.map((recipe, index) => [
        index + 1,
        recipe.title,
        recipe.userId,
        recipe.user,
        recipe.commentsCount,
        recipe.ratingCount,
        recipe.totalSaves
        ])

        doc.autoTable({
        startY: 30,
        head: [['#', 'Titlu', 'User ID', 'Utilizator', 'Comentarii', 'Rating-uri', 'Total Salvari']],
        body: tableData,
        })

        const pageHeight = doc.internal.pageSize.height
        doc.setFontSize(12)
        doc.text(`Data: ${currentDate}`, 14, pageHeight - 10)

        doc.save('all_recipes_report.pdf')
    }
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-row items-center">
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl dark:text-dark-border">Toate Retetele</h2>
          <span className="opacity-60 italic text-sm dark:text-dark-border">Raportul total al retetelor</span>
        </div>
        
        <button onClick={generatePDF} className="ml-auto font-semibold bg-ff-btn rounded-xl py-2 px-3 hover:bg-ff-content duration-100">PDF</button>
      </div>

      <div className="overflow-x-auto">
        {totalRecipes.length > 0 ? (
          <table className="bg-ff-content dark:bg-dark-elements rounded-t-lg">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">#</th>
                <th className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">Titlu</th>
                <th className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">User ID</th>
                <th className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">Utilizator</th>
                <th className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">Comentarii</th>
                <th className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">Rating-uri</th>
                <th className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">Total Salvări</th>
              </tr>
            </thead>
            <tbody>
              {totalRecipes.map((recipe, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border-b text-center border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{index + 1}</td>
                  <td className="py-2 px-4 border-b border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.title}</td>
                  <td className="py-2 px-4 border-b border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.userId}</td>
                  <td className="py-2 px-4 border-b border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.user}</td>
                  <td className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.commentsCount}</td>
                  <td className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.ratingCount}</td>
                  <td className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.totalSaves}</td>
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
