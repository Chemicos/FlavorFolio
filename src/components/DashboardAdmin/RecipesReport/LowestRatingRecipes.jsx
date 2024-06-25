import { collection, getDocs } from "@firebase/firestore";
import jsPDF from "jspdf";
import 'jspdf-autotable';
import { useEffect, useState } from "react";
import { db } from "../../../firebase-config";

export default function LowestRatingRecipes() {
  const [lowestRatingRecipes, setLowestRatingRecipes] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const recipesSnapshot = await getDocs(collection(db, 'recipes'));
        let minAverageRating = Infinity;
        let bottomRecipes = [];

        recipesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.rating && data.rating.length > 0) {
            const averageRating = data.rating.reduce((acc, val) => acc + val, 0) / data.rating.length;
            if (averageRating < minAverageRating) {
              minAverageRating = averageRating;
              bottomRecipes = [data];
            } else if (averageRating === minAverageRating) {
              bottomRecipes.push(data);
            }
          }
        });

        setLowestRatingRecipes(bottomRecipes.map(recipe => ({
          ...recipe,
          averageRating: recipe.rating.reduce((acc, val) => acc + val, 0) / recipe.rating.length,
          ratingCount: recipe.rating.length
        })));
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Lowest Rating Recipes Report', 14, 16);
    const tableData = lowestRatingRecipes.map((recipe, index) => [
      index + 1,
      recipe.title,
      recipe.user,
      recipe.averageRating.toFixed(2),
      recipe.ratingCount
    ]);

    doc.autoTable({
      startY: 30,
      head: [['#', 'Title', 'User', 'Average Rating', 'Total Ratings']],
      body: tableData,
    });
    doc.save('lowest_rating_recipes_report.pdf');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center">
        <h2 className="font-semibold text-xl">Lowest Rating Recipes</h2>
        <button onClick={generatePDF} className="ml-auto font-semibold bg-ff-btn rounded-xl py-2 px-3 hover:bg-ff-content duration-100">PDF</button>
      </div>

      <div>
        {lowestRatingRecipes.length > 0 ? (
          <table className="min-w-full bg-ff-content rounded-t-lg">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-black border-opacity-20">#</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20">Title</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20">User</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20">Average Rating</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20">Total Ratings</th>
              </tr>
            </thead>
            <tbody>
              {lowestRatingRecipes.map((recipe, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border-b text-center border-black border-opacity-20">{index + 1}</td>
                  <td className="py-2 px-4 border-b border-l border-black border-opacity-20">{recipe.title}</td>
                  <td className="py-2 px-4 border-b border-l border-black border-opacity-20">{recipe.user}</td>
                  <td className="py-2 px-4 border-b text-center border-l border-black border-opacity-20">{recipe.averageRating.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b text-center border-l border-black border-opacity-20">{recipe.ratingCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  )
}
