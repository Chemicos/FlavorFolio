/* eslint-disable no-useless-escape */
/* eslint-disable react/prop-types */
import { faArrowUpFromBracket, faClose, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { db, storage } from "../firebase-config";
import { collection, addDoc, getDoc, doc } from "@firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function PostForm({ handleClose }) {
  // Upload Image functions <<
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const imageUrl = URL.createObjectURL(file)
      setUploadedImage(imageUrl)
    }
  }
  // >>
  
  // Title functions <<
  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState(false)
  
  const handleTitleChange = (e) => {
    const value = e.target.value
    setTitle(value)
    
    const hasInvalidChars = /[\d!@#\$%\^\&*\)\(+=._-]+/.test(value)
    setTitleError(hasInvalidChars || value.trim() === '')
  }
  
  const handleTitleBlur = () => {
    if (title.trim() === '') {
      setTitleError(true)
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
  const unitOptions = ["ceașcă", "lingură", "linguriță", "buc", "cățel", "felie", "g", "kg", "l", "ml"]
  
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
  
  // Filter functions <<
  const [meal, setMeal] = useState('')
  const [mealError, setMealError] = useState(false)
  const [difficulty, setDifficulty] = useState('')
  const [difficultyError, setDifficultyError] = useState(false)
  const [cuisine, setCuisine] = useState('');
  const [cuisineError, setCuisineError] = useState(false);
  const [duration, setDuration] = useState('');
  const [durationError, setDurationError] = useState(false);
  const [servings, setServings] = useState('');
  const [servingsError, setServingsError] = useState(false);
  
  const mealOptions = ["mic dejun", "pranz", "cină", "gustare", "desert"]
  const difficultyOptions = ["ușor", "mediu", "greu"]
  const durationOptions = ["10 min", "20 min", "30 min", "40 min", "50 min", "1 oră", "1+ ore"]
  
  const handleInputChange = (value, setter, setError, isSelect = false, isCuisine = false) => {
    setter(value)
    
    let isError
    if (isSelect) {
      isError = value.trim() === ''
    } else if (isCuisine) {
      const hasInvalidChars = /[^a-zA-Z\s]/.test(value)
      isError = hasInvalidChars || value.trim() === ''
    } else {
      const isNumber = /^[0-9]+$/.test(value)
      isError = !isNumber || value.trim() === ''
    }
    setError(isError)
  }
  
  const handleInputBlur = (value, setError) => {
    setError(value.trim() === '')
  }
  // >>
  
  // Cooking steps functions<<
  const [cookingSteps, setCookingSteps] = useState([])
  const addCookingStep = () => {
    setCookingSteps([...cookingSteps, { description: '', image: null, error: false  }])
  }
  
  const removeCookingStep = index => {
    setCookingSteps(cookingSteps.filter((_, i) => i !== index))
  }
  
  const handleCookingStepChange = (index, field, value) => {
    const newSteps = cookingSteps.map((step, i) => {
      if (i === index) {
        const updatedStep = { ...step, [field]: value }
        
        if(field === 'image') {
          updatedStep.imageUrl = value ? URL.createObjectURL(value) : null
        }
        return updatedStep
      }
      return step
    })
    setCookingSteps(newSteps)
  }
  
  const handleCookingStepBlur = (index) => {
    const newSteps = cookingSteps.map((step, i) => {
      if (i === index) {
        return {...step, error: !step.description.trim()}
      }
      return step
    })
    setCookingSteps(newSteps)
  }
  // >>

  // Get Username <<
  const getUsername = async (user) => {
    if (user.displayName) {
      return user.displayName
    }
    const userDoc = await getDoc(doc(db, "users", user.uid))
    if (userDoc.exists()) {
      return userDoc.data().username
    } else {
      throw new Error("User not found")
    }
  }
  // >>
  // TODO: SETDOC SA SALVEZE SI userId ca atribut in colectia pendingRecipes si din pendingRecipes in recipes 

  // Save recipe Firestore <<
  const saveRecipe = async (recipe) => {
    try {
      const docRef = await addDoc(collection(db, "pendingRecipes"), recipe)
      console.log("Document scris cu ID-ul: ", docRef.id)
    } catch (e) {
      console.error("Eroare la adaugarea documentului: ", e)
    }
  }
  // >>

  // Submit Form Function <<
  const [isFormValid, setIsFormValid] = useState(false)
  
  useEffect(() => {
    const checkFormValidity = () => {
      const isValid = imageFile && 
      title.trim() !== '' && 
      description.trim() !== '' && 
      ingredients.length > 0 && 
      ingredients.every(ingredient => 
        ingredient.quantity.trim() !== '' &&
        ingredient.unit.trim() !== '' &&
        ingredient.ingredient.trim() !== ''
      ) && 
      meal.trim() !== '' && 
      difficulty.trim() !== '' &&
      duration.trim() !== '' && 
      servings.trim() !== '' &&
      cookingSteps.length > 0 && 
      cookingSteps.every(step => step.description.trim() !== '')
      setIsFormValid(isValid)
    }
    checkFormValidity()
  }, [imageFile, title, description, ingredients, meal, difficulty, cuisine, duration, servings, cookingSteps])
  
  const removeFileFields = (obj) => {
    const newObj = { ...obj };
    for (let key in newObj) {
        if (newObj[key] instanceof File) {
            delete newObj[key];
        }
    }
    return newObj;
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if(!isFormValid) {
      return
    }
    
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) {
        throw new Error("No user logged in")
      }

      const username = await getUsername(user)

      const imageFileName = `${Date.now()}_${imageFile.name}`
      const storageRef = ref(storage, `recipe_images/${imageFileName}`)
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef)

      const cookingStepsWithUrls = await Promise.all(
          cookingSteps.map(async (step) => {
              if (step.image) {
                  const stepImageFileName = `${Date.now()}_${step.image.name}`
                  const stepImageRef = ref(storage, `cooking_steps_images/${stepImageFileName}`)
                  await uploadBytes(stepImageRef, step.image)
                  const stepImageUrl = await getDownloadURL(stepImageRef)
                  return removeFileFields({ ...step, imageUrl: stepImageUrl, stepImageFileName: stepImageFileName })
              }
              return removeFileFields({ ...step })
          })
      )

      const recipe = {
        image: imageUrl,
        imageFileName: imageFileName,
        title: title,
        description: description,
        ingredients: ingredients.map((ingredient) => ({
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            ingredient: ingredient.ingredient,
        })),
        meal: meal,
        difficulty: difficulty,
        cuisine: cuisine,
        duration: duration,
        servings: servings,
        cookingSteps: cookingStepsWithUrls,
        createdAt: new Date(),
        user: username,
        userId: user.uid
      }

      await saveRecipe(recipe)

      setUploadedImage(null)
        setTitle("")
        setDescription("")
        setImageFile(null)
        setIngredients([])
        setMeal('')
        setDifficulty('')
        setCuisine('')
        setDuration('')
        setServings('')
        setCookingSteps([])
        handleClose()
    } catch (error) {
      console.error("Eroare la incarcarea retetei: ", error)
    }
  }
  // >>

  return (
    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center 
    justify-center z-10 overflow-hidden">
      <div className="relative bg-ff-form dark:bg-dark-bg rounded-lg h-full sm:h-post-form w-full 
         sm:w-responsive-sm">
            <button 
              onClick={handleClose}
              className="absolute top-3 right-3 sm:-top-2 opacity-70 sm:opacity-100 sm:-right-2 text-2xl bg-ff-close rounded-full h-10 w-10 
              transition duration-150 ease-in-out hover:scale-110 hover:bg-red-700 hover:text-white z-10">
                <FontAwesomeIcon icon={faClose} /> 
            </button>
            
            <form className="lg:w-full mx-auto flex flex-col gap-4 items-center h-full py-4 overflow-y-auto">
              <h1 className="text-xl font-semibold dark:text-dark-border">Postează-ți Rețeta</h1>

              <div className="relative flex flex-col items-center gap-2">
                {uploadedImage ? (
                  <>
                    <img src={uploadedImage} 
                      alt="uploaded" 
                      className="w-full h-32 rounded-lg" 
                      />

                      <div className="absolute bg-black bg-opacity-20 opacity-0 
                        hover:opacity-100 flex items-center rounded-lg justify-center 
                        transition-opacity h-32 w-full duration-150"
                      >
                        <input type="file" id="file-upload" 
                          className="hidden"
                          onChange={handleImageUpload} 
                        />

                        <label htmlFor="file-upload" 
                          className="cursor-pointer hover:scale-125 duration-100">
                              <FontAwesomeIcon icon={faArrowUpFromBracket} 
                              className="text-white text-3xl" 
                              />
                        </label>
                      </div>
                    </>
                ) : (
                  <>
                    <input type="file" id="file-upload" 
                      className="hidden"
                      onChange={handleImageUpload} 
                    />
                    <label htmlFor="file-upload" 
                      className="flex flex-col justify-center cursor-pointer rounded-full w-24 h-24 border border-black dark:border-dark-border
                      hover:bg-ff-btn dark:hover:bg-dark-elements hover:border-ff-btn duration-300"
                      >
                      <FontAwesomeIcon icon={faArrowUpFromBracket} className="text-3xl dark:text-dark-border" />
                    </label>
                    <span className="font-semibold dark:text-dark-border">Încarcă Imagine</span>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-4 w-full px-4 sm:px-8">
                <h1 className="font-semibold text-lg dark:text-dark-border">Informații Generale</h1>

                <input type="text"
                  value={title}
                  onChange={handleTitleChange} 
                  onBlur={handleTitleBlur}
                  placeholder="Titlu" 
                  className={`w-full px-2 py-2 rounded-lg hover:shadow-input dark:hover:shadow-none dark:bg-transparent dark:text-dark-border
                    dark:border dark:border-dark-border placeholder:italic dark:placeholder:text-dark-border dark:border-opacity-40 dark:hover:border-opacity-100 dark:focus:border-opacity-100
                  duration-150 ${titleError ? 'shadow-input-error' : ''}`} 
                />

                <textarea placeholder="Descriere" 
                  value={description}
                  onChange={handleDescriptionChange}
                  onBlur={handleDescriptionBlur}
                  className={`w-full px-2 py-2 rounded-lg hover:shadow-input dark:hover:shadow-none dark:bg-transparent dark:text-dark-border dark:border dark:border-dark-border 
                  dark:placeholder:text-dark-border dark:border-opacity-40 dark:hover:border-opacity-100 dark:focus:border-opacity-100
                  placeholder:italic duration-150 ${descriptionError ? 'shadow-input-error' : ''}`}
                  cols="20" 
                  rows="4" 
                />

                <h1 className="font-semibold text-lg dark:text-dark-border">Ingrediente</h1>
                {ingredients.map((ingredient, index) => (
                  <div key={index} className={`relative flex flex-row justify-between gap-4 bg-ff-bg dark:bg-transparent rounded-lg p-4 dark:border dark:border-dark-border
                  ${ingredient.quantityError || ingredient.unitError || ingredient.ingredientError ? 'shadow-input-error' : 'shadow-md'}`}
                  >
                    <div className="flex flex-col sm:flex-row mx-auto sm:px-4 gap-4">
                      <input
                        type="number"
                        value={ingredient.quantity}
                        onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                        onBlur={() => handleIngredientBlur(index, 'quantity')}
                        placeholder="Cantitate"
                        className="w-full px-2 py-2 rounded-lg placeholder:italic hover:shadow-input duration-150
                        dark:bg-transparent dark:border dark:hover:shadow-none dark:border-dark-border dark:border-opacity-40 dark:hover:border-opacity-100 dark:placeholder:text-dark-border dark:text-dark-border
                        dark:focus:border-opacity-100"
                      />

                      <select value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                        onBlur={() => handleIngredientBlur(index, 'unit')}
                        className="w-full px-2 py-2 bg-white rounded-lg placeholder:italic hover:shadow-input duration-150
                        dark:bg-dark-bg dark:border dark:border-dark-border dark:border-opacity-40 dark:hover:border-opacity-100 dark:text-dark-border dark:hover:shadow-none"
                      >
                        <option value="">U.M.</option>
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
                        className="w-full px-2 py-2 rounded-lg placeholder:italic dark:placeholder:text-dark-border hover:shadow-input dark:hover:shadow-none dark:text-dark-border
                        dark:bg-transparent dark:border dark:border-dark-border dark:border-opacity-40 dark:hover:border-opacity-100 dark:focus:border-opacity-100 duration-150"
                      />
                    </div>

                    <button 
                      type="button"
                      className="text-red-500 dark:text-black hover:text-red-700 absolute -top-3 -right-3 text-xl bg-white dark:bg-ff-btn 
                      bg-opacity-50 dark:bg-opacity-50 hover:bg-opacity-100 dark:hover:bg-opacity-100 duration-150 rounded-full w-9 h-9"
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

                
                  <h1 className="font-semibold text-lg dark:text-dark-border">Filter</h1>                  
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-row gap-2">
                      <select value={meal}
                        onChange={(e) => handleInputChange(e.target.value, setMeal, setMealError, true)}
                        onBlur={() => handleInputBlur(meal, setMealError)}
                        className={`px-2 py-2 bg-white rounded-lg w-full
                        dark:bg-dark-bg dark:border dark:border-dark-border dark:border-opacity-40 dark:hover:border-opacity-100 dark:text-dark-border dark:hover:shadow-none
                        ${mealError ? 'shadow-input-error' : 'hover:shadow-input duration-150'}`}
                      >
                        <option value="">Tipul de Masă</option>
                        {mealOptions.map((option, index) => (
                          <option key={index} value={option}>{option}</option>
                        ))}
                      </select>

                      <select value={difficulty}
                        onChange={(e) => handleInputChange(e.target.value, setDifficulty, setDifficultyError, true)}
                        onBlur={() => handleInputBlur(difficulty, setDifficultyError)}
                        className={`px-2 py-2 bg-white rounded-lg w-full
                        dark:bg-dark-bg dark:border dark:border-dark-border dark:border-opacity-40 dark:hover:border-opacity-100 dark:text-dark-border dark:hover:shadow-none
                        ${difficultyError ? 'shadow-input-error' : 'hover:shadow-input duration-150'}`}
                      >
                        <option value="">Dificultate</option>
                        {difficultyOptions.map((option, index) => (
                          <option key={index} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <input 
                      type="text" 
                      value={cuisine}
                      onChange={(e) => handleInputChange(e.target.value, setCuisine, setCuisineError, false, true)}
                      onBlur={() => handleInputBlur(cuisine, setCuisineError)}
                      placeholder="Bucătărie" 
                      className={`w-full px-2 py-2 rounded-lg placeholder:italic dark:bg-transparent dark:border dark:border-dark-border dark:border-opacity-40 
                        dark:hover:border-opacity-100 dark:focus:border-opacity-100 dark:text-dark-border
                        duration-150 ${cuisineError ? 'shadow-input-error' : 'hover:shadow-input dark:shadow-none'}`}
                    />

                    <select value={duration}
                      onChange={(e) => handleInputChange(e.target.value, setDuration, setDurationError, true)}
                      onBlur={() => handleInputBlur(duration, setDurationError)}
                      className={`w-full px-2 py-2 bg-white rounded-lg duration-150 ${durationError ? 'shadow-input-error': 'hover:shadow-input'}
                      dark:bg-dark-bg dark:border dark:border-dark-border dark:border-opacity-40 dark:hover:border-opacity-100 dark:text-dark-border dark:hover:shadow-none`}
                    >
                      <option value="">Durată</option>
                      {durationOptions.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                    
                    <input 
                      type="number" 
                      value={servings}
                      onChange={(e) => handleInputChange(e.target.value, setServings, setServingsError)}
                      onBlur={() => handleInputBlur(servings, setServingsError)}
                      placeholder="Porții" 
                      className={`w-full px-2 py-2 rounded-lg placeholder:italic duration-150 ${servingsError ? 'shadow-input-error' : 'hover:shadow-input'}
                      dark:bg-dark-bg dark:border dark:border-dark-border dark:border-opacity-40 dark:hover:border-opacity-100 dark:text-dark-border dark:hover:shadow-none
                      dark:focus:border-opacity-100`}
                    />
                  </div>

                  <h1 className="font-semibold text-lg dark:text-dark-border">Pași de Gătit</h1>
                  {cookingSteps.map((step, index) => (
                    <div key={index} className={`relative flex flex-col items-center bg-ff-bg dark:bg-transparent dark:border dark:border-dark-border rounded-lg px-4 py-6 sm:py-4
                    ${step.error ? 'shadow-input-error' : 'shadow-md'}`}
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between w-full">
                        <textarea
                          value={step.description}
                          onChange={(e) => handleCookingStepChange(index, 'description', e.target.value)}
                          onBlur={() => handleCookingStepBlur(index)}
                          placeholder="Descriere Pas"
                          className="w-full sm:w-60 px-2 py-2 rounded-lg hover:shadow-input dark:shadow-none dark:border-opacity-40 dark:hover:border-opacity-100 dark:focus:border-opacity-100 
                          dark:bg-transparent dark:text-dark-border dark:border dark:border-dark-border placeholder:italic duration-150"
                        />

                        <div className="relative w-full flex justify-center">
                          {step.imageUrl ? (
                            <>
                              <img src={step.imageUrl} 
                              alt="demonstration" 
                              className="h-20 w-32 rounded-lg" 
                              />

                              <div className="absolute bg-black bg-opacity-20 opacity-0 
                              hover:opacity-100 flex items-center rounded-lg justify-center 
                              transition-opacity h-20 w-32 duration-150"
                              >
                                <label htmlFor={`step-image-upload-${index}`} 
                                  className="cursor-pointer hover:scale-125 duration-100">
                                     <FontAwesomeIcon icon={faArrowUpFromBracket} 
                                     className="text-white text-2xl" 
                                     />
                                </label>
                              </div>
                            </>
                          ) : (
                            <label htmlFor={`step-image-upload-${index}`} 
                              className="cursor-pointer flex flex-col gap-2 transition duration-150 ease-in-out hover:scale-110"
                            >
                              <FontAwesomeIcon icon={faArrowUpFromBracket} className="text-2xl dark:text-dark-border" />
                              <div className="flex flex-col items-center">
                                <span className="text-sm italic dark:text-dark-border">Incarcă Imagine</span>
                                <span className="text-xs opacity-50 dark:text-dark-border">(opțional)</span>
                              </div>
                            </label>
                          )}
                          <input
                            type="file"
                            onChange={(e) => handleCookingStepChange(index, 'image', e.target.files[0])}
                            className="hidden"
                            id={`step-image-upload-${index}`}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="text-red-500 dark:text-black hover:text-red-700 absolute -top-3 -right-3 text-xl bg-white dark:bg-ff-btn
                          bg-opacity-50 dark:bg-opacity-50 hover:bg-opacity-100 dark:hover:bg-opacity-100 duration-150 rounded-full w-9 h-9"
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
                className={`bg-ff-btn px-6 py-2 rounded-xl uppercase font-semibold 
                transition duration-150 ease-in-out ${isFormValid ? 'hover:scale-110' : 'opacity-50 cursor-not-allowed'}`}
                onClick={handleSubmit}
                disabled={!isFormValid}
              >
                  Trimite
              </button>
            </form>
      </div>
    </div>
  )
}