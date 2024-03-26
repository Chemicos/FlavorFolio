/* eslint-disable react/prop-types */
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function PostForm({ handleClose }) {
  return (
    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center 
        justify-center z-10">
      <div className="relative bg-ff-form p-5 rounded-lg h-content w-3/4 md:w-1/2 lg:w-1/3">
            <div className="flex justify-center items-center">
                <button 
                    onClick={handleClose}
                    className="absolute top-0 right-0 text-2xl bg-ff-btn rounded-full px-2">
                    <FontAwesomeIcon icon={faClose} /> 
                </button>
                <h1 className="text-xl font-semibold mb-4">Post Your Recipe</h1>
            </div>

            <form className="w-4/5 mx-auto flex flex-col gap-4 items-center">
              <input type="file" />
                <div className="flex flex-row gap-4">
                    <input type="text" placeholder="Title" className="w-full" />
                    <input type="number" placeholder="Calories" className="w-full" />
                </div>

                <textarea placeholder="Description" className="w-full"></textarea>

                <div className="flex flex-col">
                  <label>Ingredients</label>

                  <div className="flex flex-row gap-4">
                    <span className="bg-ff-bg p-2 rounded-lg shadow">2 Onions</span>
                    <button className="bg-ff-btn p-2 rounded-lg font-semibold">
                      Add 
                    </button>
                  </div>
                </div>

                <div>
                  <input type="number" placeholder="Duration" />

                  <select name="meals" id="meals">
                    <option value="breakfast">Breakfast</option>
                    <option value="brunch">Brunch</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>

                  <select name="difficulty" id="difficulty">
                    <option value="easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>

                  <input type="text" placeholder="Cuisine" />
                </div>

                <h1>Cooking steps</h1>

                <div>
                  <label>1st Step</label>
                  <input type="text" />
                  
                  <input type="file" />

                  <button className="bg-ff-btn font-semibold">Add</button>
                </div>
        
                <button type="submit" className="bg-ff-btn px-3 py-2 rounded-xl font-semibold">
                    Submit
                </button>
            </form>
      </div>

    </div>
  )
}