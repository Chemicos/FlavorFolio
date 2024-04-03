/* eslint-disable no-useless-escape */
/* eslint-disable react/prop-types */
import { faArrowUpFromBracket, faClose, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export default function PostForm({ handleClose }) {
  // Title functions <<
  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState(false)

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    if (e.target.value.trim() !== '') {
      setTitleError(false)
    }
  }

  const handleTitleBlur = () => {
    if (title.trim() === '') {
      setTitleError(true)
    }
  }
  // >>

  // Calories functions <<
  const [calories, setCalories] = useState('')
  const [caloriesError, setCaloriesError] = useState(false)

  const handleCaloriesChange = (e) => {
    const value = e.target.value
    setCalories(value)
    const isValidNumber = /^[0-9]*$/.test(value)
    setCaloriesError(!isValidNumber || value.trim() === '')
  }

  const handleCaloriesBlur = () => {
    if (calories.trim() === '') {
      setCaloriesError(true)
    }
  }
  // >>

  // Description functions <<
  const [description, setDescription] = useState('')
  const [descriptionError, setDescriptionError] = useState(false)

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value)
    if (e.target.value.trim() !== '') {
      setDescriptionError(false)
    }
  }

  const handleDescriptionBlur = () => {
    if (description.trim() === '') {
      setDescriptionError(true)
    }
  }
  // >>

  // Ingredient functions <<
  const [ingredients, setIngredients] = useState([])
  const unitOptions = ["cup", "tablespoon", "teaspoon", "g", "kg", "l", "ml"]

  const addIngredient = (e) => {
    setIngredients([...ingredients, { 
      quantity: '',
      unit:'',
      ingredient:'',
      quantityError: false,
      unitError: false,
      ingredientError: false
    }])
    e.preventDefault()
  }
  
  const handleIngredientChange = (index, field, value) => {
    const newIngredients = ingredients.map((ingredient, i) => {
      if (i === index) {
        let isError = false

        if (field === 'quantity') {
          const isValidNumber = /^[0-9]*$/.test(value)
          isError = !isValidNumber || value.trim() === ''
        }
        if (field === 'unit') {
            isError = value.trim() === ''
        }
        if (field === 'ingredient') {
            isError = /[\d!@#\$%\^\&*\)\(+=._-]+/.test(value)
        }

        return {
            ...ingredient,
            [field]: value,
            [`${field}Error`]: isError
        }
      }
      return ingredient
    })
    setIngredients(newIngredients)
  }
  
  const handleIngredientBlur = (index, field) => {
    const newIngredients = ingredients.map((ingredient, i) => {
      if (i === index) {
        const isError = field === 'unit' ? ingredient[field].trim() === '' : ingredient[field].trim() === ''
            return { ...ingredient, [`${field}Error`]: isError }
      }
      return ingredient
    })
    setIngredients(newIngredients)
  }

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }
  // >>
  
  // Cooking steps functions<<
  const [cookingSteps, setCookingSteps] = useState([])
  const addCookingStep = () => {
    setCookingSteps([...cookingSteps, { description: '', image: null }])
  }

  const removeCookingStep = index => {
    setCookingSteps(cookingSteps.filter((_, i) => i !== index))
  }

  const handleCookingStepChange = (index, field, value) => {
    const newSteps = cookingSteps.map((step, i) => {
      if (i === index) {
        return { ...step, [field]: value }
      }
      return step
    })
    setCookingSteps(newSteps)
  }
  // >>

  return (
    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center 
        justify-center z-10 overflow-hidden">
      <div className="relative bg-ff-form rounded-lg h-5/6 sm:h-post-form w-5/6 
         sm:w-responsive-sm">
            <button 
              onClick={handleClose}
              className="absolute -top-2 -right-2 text-2xl bg-ff-close rounded-full h-10 w-10 
              transition duration-150 ease-in-out hover:scale-110 z-10">
                <FontAwesomeIcon icon={faClose} /> 
            </button>
            
            <form className="lg:w-full mx-auto flex flex-col gap-4 items-center h-full py-4 overflow-y-auto">
              <h1 className="text-xl font-semibold">Post Your Recipe</h1>

              <div className="flex flex-col items-center gap-2">
                <input type="file" id="file-upload" className="hidden" />
                <label htmlFor="file-upload" 
                  className="flex flex-col justify-center cursor-pointer rounded-full w-24 h-24 border border-black
                hover:bg-ff-btn hover:border-ff-btn duration-300"
                >
                  <FontAwesomeIcon icon={faArrowUpFromBracket} className="text-3xl" />
                </label>
                  <span className="font-semibold">Upload Image</span>
              </div>

              <div className="flex flex-col gap-4 w-full px-4 sm:px-8">
                <h1 className="font-semibold text-lg">General Info</h1>

                <div className="flex flex-col sm:flex-row gap-4">
                    <input type="text"
                      value={title}
                      onChange={handleTitleChange} 
                      onBlur={handleTitleBlur}
                      placeholder="Title" 
                      className={`w-full px-2 py-2 rounded-lg hover:shadow-input placeholder:italic 
                      duration-150 ${titleError ? 'shadow-input-error' : ''}`} 
                    />
                    <input type="number" 
                      placeholder="Calories"
                      value={calories}
                      onChange={handleCaloriesChange}
                      onBlur={handleCaloriesBlur} 
                      className={`w-full px-2 py-2 rounded-lg hover:shadow-input 
                      placeholder:italic duration-150 ${caloriesError ? 'shadow-input-error' : ''}`}
                    />
                </div>

                <textarea placeholder="Description" 
                  value={description}
                  onChange={handleDescriptionChange}
                  onBlur={handleDescriptionBlur}
                  className={`w-full px-2 py-2 rounded-lg hover:shadow-input 
                  placeholder:italic duration-150 ${descriptionError ? 'shadow-input-error' : ''}`}
                  cols="20" 
                  rows="1" 
                />

                <h1 className="font-semibold text-lg">Ingredients</h1>
                {ingredients.map((ingredient, index) => (
                  <div key={index} className={`relative flex flex-row justify-between gap-4 bg-ff-bg rounded-lg p-4 
                  ${ingredient.quantityError || ingredient.unitError || ingredient.ingredientError ? 'shadow-input-error' : 'shadow-md'}`}
                  >
                    <div className="flex flex-col sm:flex-row mx-auto sm:px-4 gap-4">
                      <input
                        type="number"
                        value={ingredient.quantity}
                        onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                        onBlur={() => handleIngredientBlur(index, 'quantity')}
                        placeholder="Quantity"
                        className="w-full px-2 py-2 rounded-lg placeholder:italic hover:shadow-input duration-150"
                      />

                      <select value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                        onBlur={() => handleIngredientBlur(index, 'unit')}
                        className="w-full px-2 py-2 bg-white rounded-lg placeholder:italic hover:shadow-input duration-150"
                      >
                        <option value="">Select unit</option>
                        {unitOptions.map((unit, i) => (
                          <option key={i} value={unit}>{unit}</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={ingredient.ingredient}
                        onChange={(e) => handleIngredientChange(index, 'ingredient', e.target.value)}
                        onBlur={() => handleIngredientBlur(index, 'ingredient')}
                        placeholder="Ingredient"
                        className="w-full px-2 py-2 rounded-lg placeholder:italic hover:shadow-input duration-150"
                      />
                    </div>

                    <button 
                      type="button"
                      className="text-red-500 hover:text-red-700 absolute -top-3 -right-3 text-xl bg-white 
                      bg-opacity-50 hover:bg-opacity-100 duration-150 rounded-full w-9 h-9"
                      onClick={() => removeIngredient(index)}
                      >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
                    <button 
                      className="bg-ff-btn w-8 h-8 rounded-lg transition duration-150 ease-in-out hover:scale-110"
                      onClick={addIngredient}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>

                
                  <h1 className="font-semibold text-lg">Filter</h1>                  
                  <div className="flex flex-col gap-4">
                    <select className="px-2 bg-white py-2 rounded-lg w-full sm:w-auto" name="meal" id="meal-select">
                      <option value="">Select Meal Type</option>
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>

                    <input 
                      type="text" 
                      placeholder="Cuisine" 
                      className="w-full px-2 py-2 rounded-lg hover:shadow-input placeholder:italic duration-150" 
                    />

                    <input 
                      type="text" 
                      placeholder="Duration" 
                      className="w-full px-2 py-2 rounded-lg hover:shadow-input placeholder:italic duration-150" 
                    />
                    
                    <input 
                      type="text" 
                      placeholder="Servings" 
                      className="w-full px-2 py-2 rounded-lg hover:shadow-input placeholder:italic duration-150" 
                    />
                  </div>

                  <h1 className="font-semibold text-lg">Cooking Steps</h1>
                  {cookingSteps.map((step, index) => (
                    <div key={index} className="relative flex flex-col items-center bg-ff-bg rounded-lg shadow-md px-4 py-6 sm:py-4">
                      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between w-full">
                        <textarea
                          value={step.description}
                          onChange={(e) => handleCookingStepChange(index, 'description', e.target.value)}
                          placeholder="Step description"
                          className="w-full sm:w-60 px-2 py-2 rounded-lg hover:shadow-input placeholder:italic duration-150"
                        />

                        <div className="w-full flex justify-center">
                          <input
                            type="file"
                            onChange={(e) => handleCookingStepChange(index, 'image', e.target.files[0])}
                            className="hidden"
                            id={`step-image-upload-${index}`}
                          />
                          <label htmlFor={`step-image-upload-${index}`} 
                            className="cursor-pointer flex flex-col gap-2 transition duration-150 ease-in-out hover:scale-110"
                          >
                            <FontAwesomeIcon icon={faArrowUpFromBracket} className="text-2xl" />
                            <span className="text-sm italic">Upload Image</span>
                          </label>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 absolute -top-3 -right-3 text-xl bg-white 
                          bg-opacity-50 hover:bg-opacity-100 duration-150 rounded-full w-9 h-9"
                        onClick={() => removeCookingStep(index)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="bg-ff-btn w-8 h-8 rounded-lg transition duration-150 ease-in-out hover:scale-110"
                    onClick={addCookingStep}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
              </div>

              <button 
                className="bg-ff-btn px-3 py-2 rounded-xl font-semibold transition duration-150 ease-in-out hover:scale-110"
              >
                  Submit
              </button>
            </form>
      </div>
    </div>
  )
}