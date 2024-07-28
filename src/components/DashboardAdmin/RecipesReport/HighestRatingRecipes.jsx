import { collection, getDocs } from "@firebase/firestore";
import jsPDF from "jspdf";
import 'jspdf-autotable';
import { useEffect, useState } from "react";
import { db } from "../../../firebase-config";
import FlavorFolioLogo from '../../../assets/FlavorFolio_logo1.png';

export default function HighestRatingRecipes() {
  const [highestRatingRecipes, setHighestRatingRecipes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const recipesSnapshot = await getDocs(collection(db, 'recipes'))
        let maxAverageRating = 0
        let topRecipes = []

        recipesSnapshot.forEach(doc => {
          const data = doc.data()
          if (data.rating && data.rating.length > 0) {
            const averageRating = data.rating.reduce((acc, val) => acc + val, 0) / data.rating.length
            if (averageRating > maxAverageRating) {
              maxAverageRating = averageRating
              topRecipes = [data]
            } else if (averageRating === maxAverageRating) {
              topRecipes.push(data)
            }
          }
        })

        setHighestRatingRecipes(topRecipes.map(recipe => ({
          ...recipe,
          averageRating: recipe.rating.reduce((acc, val) => acc + val, 0) / recipe.rating.length,
          ratingCount: recipe.rating.length
        })))
      } catch (error) {
        console.error("Error fetching data: ", error);
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
    doc.text('Raport Cele Mai Apreciate Retete', 130, 15)

    const tableData = highestRatingRecipes.map((recipe, index) => [
      index + 1,
      recipe.title,
      recipe.user,
      recipe.averageRating.toFixed(2),
      recipe.ratingCount
    ])

    doc.autoTable({
      startY: 30,
      head: [['#', 'Title', 'User', 'Average Rating', 'Total Ratings']],
      body: tableData,
    })

    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(12)
    doc.text(`Data: ${currentDate}`, 14, pageHeight - 10)

    doc.save('highest_rating_recipes_report.pdf')
  }

  return (
    <div className="flex flex-col gap-4">
    <div className="flex flex-row items-center">
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-xl dark:text-dark-border">Cele mai Apreciate Retete</h2>
        <span className="opacity-60 italic text-sm dark:text-dark-border">Rating-ul maxim este de 3.00</span>
      </div>
      <button onClick={generatePDF} className="ml-auto font-semibold bg-ff-btn rounded-xl py-2 px-3 hover:bg-ff-content duration-100">PDF</button>
    </div>

    <div className="overflow-x-auto">
      {highestRatingRecipes.length > 0 ? (
        <table className="min-w-full bg-ff-content dark:bg-dark-elements rounded-t-lg">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">#</th>
              <th className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">Titlu</th>
              <th className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">Utilizator</th>
              <th className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">Rating</th>
              <th className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">Total Rating-uri</th>
            </tr>
          </thead>
          <tbody>
            {highestRatingRecipes.map((recipe, index) => (
              <tr key={index}>
                <td className="py-2 px-4 border-b text-center border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{index + 1}</td>
                <td className="py-2 px-4 border-b border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.title}</td>
                <td className="py-2 px-4 border-b border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.user}</td>
                <td className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.averageRating.toFixed(2)}</td>
                <td className="py-2 px-4 border-b text-center border-l border-black dark:border-dark-border dark:border-opacity-40 border-opacity-20 dark:text-dark-border">{recipe.ratingCount}</td>
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
