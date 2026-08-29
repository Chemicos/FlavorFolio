import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded"
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

import { useMemo, useState } from "react"
import PostRecipeSteps from "./PostRecipeSteps"
import { PostRecipeStep, PostRecipeIngredient } from "../../types/postRecipe.types"
import PostRecipeIngredients from "./PostRecipeIngredients"
import { AnimatePresence, motion } from "motion/react"
import PostRecipePreview from "./PostRecipePreview"
import PostRecipeActionBar from "./PostRecipeActionBar"
import PostRecipeSelectDropdown from "./PostRecipeSelectDropdown"
import { formatDurationFromMinutes } from "../../utils/recipeDuration"
import PostRecipeCuisineSelect from "./PostRecipeCuisineSelect"
import { CurrentUserCardData } from "../../types/recipeCard.types"
import { createPendingRecipe, updateRecipe } from "../../services/recipes.service"
import { Recipe } from "../../types"


interface PostRecipeFormProps {
  onClose: () => void
  currentUser: CurrentUserCardData | null
  onSubmitSuccess: () => void
  mode?: "create" | "edit"
  recipeToEdit?: Recipe | null
  onUpdateSuccess?: (recipe?: Recipe) => void
  updateMode?: "default" | "revision_draft"
  onRevisionDraftUpdate?: (data: {
    recipeId: string
    payload: Record<string, any>
  }) => Promise<Recipe>
}

export default function PostRecipeForm({
  onClose, 
  currentUser, 
  onSubmitSuccess, 
  mode = "create", 
  recipeToEdit = null, 
  onUpdateSuccess,
  updateMode = "default",
  onRevisionDraftUpdate,
}: PostRecipeFormProps) {
  const MIN_TITLE_LENGTH = 5
  const MIN_DESCRIPTION_LENGTH = 30  

  const isEditMode = mode === "edit" && Boolean(recipeToEdit)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(recipeToEdit?.title || "")
  const [description, setDescription] = useState(recipeToEdit?.description || "")
  const [cuisine, setCuisine] = useState(recipeToEdit?.cuisine || "")
  const [duration, setDuration] = useState(recipeToEdit?.durationMinutes ? String(recipeToEdit.durationMinutes) : "")
  const [servings, setServings] = useState(recipeToEdit?.servings ? String(recipeToEdit.servings) : "")
  const [difficulty, setDifficulty] = useState(recipeToEdit?.difficulty || "easy")
  const [meal, setMeal] = useState(recipeToEdit?.meal || "lunch")
  const [visibility, setVisibility] = useState<"public" | "private">(recipeToEdit?.visibility === "private" ? "private" : "public")

  const editSubmitLabel = updateMode === "revision_draft" ? "Save changes" : "Save draft"

  const difficultyOptions = [
    {label: "Easy", value: "easy"},
    {label: "Medium", value: "medium"},
    {label: "Hard", value: "hard"},
  ]

  const mealOptions = [
    { label: "Breakfast", value: "breakfast" },
    { label: "Lunch", value: "lunch" },
    { label: "Dinner", value: "dinner" },
    { label: "Dessert", value: "dessert" },
    { label: "Snack", value: "snack" },
  ]

  const visibilityOptions = [
    { label: "Public", value: "public" },
    { label: "Private", value: "private" },
  ]

  const cuisineOptions =["American", "Chinese", "French", "Greek", "Indian", "Italian", "Japanese", "Korean", "Lebanese", "Mexican", "Moroccan", "Romanian", "Spanish", "Thai", "Turkish", "Vietnamese"]
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const fieldClass = "w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--input-placeholder)] hover:border-[var(--border-strong)] hover:bg-[var(--input-bg-hover)] focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]"
  const labelClass = "mb-2 block text-xs font-medium text-[var(--text-secondary)]"

  const titleTooShort = title.trim().length > 0 && title.trim().length < MIN_TITLE_LENGTH
  const descriptionTooShort =
    description.trim().length > 0 &&
    description.trim().length < MIN_DESCRIPTION_LENGTH

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(recipeToEdit?.image || "")

  const [ingredients, setIngredients] = useState<PostRecipeIngredient[]>(
    recipeToEdit?.ingredients?.map((ingredient, index) => ({
      id: crypto.randomUUID(),
      ingredient: ingredient.ingredient || "",
      quantity: String(ingredient.quantity || ""),
      unit: ingredient.unit || "g",
    })) || []
  )
  const [steps, setSteps] = useState<PostRecipeStep[]>(
    recipeToEdit?.cookingSteps?.map((step, index) => ({
      id: crypto.randomUUID(),
      title: step.title || "",
      description: step.description || "",
      image: null,
      imagePreview: step.image || step.imageUrl || "",
      existingImageUrl: step.image || step.imageUrl || "",
    })) || []
  )

  const completionItems = [
    { done: Boolean(imageFile || imagePreview), weight: 15 },

    { done: title.trim().length >= 5, weight: 10 },
    { done: description.trim().length >= 30, weight: 15 },

    { done: !!cuisine, weight: 5 },
    { done: !!duration, weight: 5 },
    { done: !!servings, weight: 5 },

    { done: !!difficulty, weight: 5 },
    { done: !!meal, weight: 5 },

    { done: ingredients.length > 0, weight: 15 },
    { done: steps.length > 0, weight: 20 },
  ]

  const completionPercentage = useMemo(() => {
    const totalWeight = completionItems.reduce(
      (acc, item) => acc + item.weight,
      0
    )

    const completedWeight = completionItems.reduce(
      (acc, item) => acc + (item.done ? item.weight : 0),
      0
    )

    return Math.round((completedWeight / totalWeight) * 100)
  }, [imageFile, title, description, cuisine, duration, servings, difficulty, meal, ingredients, steps ])

  const handleDurationChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, "")
    setDuration(numbersOnly)
  }

  const formattedDuration = formatDurationFromMinutes(duration)

  const handleServingsChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, "")
    setServings(numbersOnly)
  }

  const handleMainImageChange = (file?: File) => {
      if (!file) return

      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
  }

  const handlePostRecipe = async () => {
    if (completionPercentage !== 100 || isSubmitting || !currentUser) return

    setIsSubmitting(true)

    try {
      if (isEditMode && recipeToEdit?.recipeId) {
        if(updateMode === "revision_draft") {
            const updatedRecipe = await onRevisionDraftUpdate?.({
              recipeId: recipeToEdit.recipeId,
              payload: {
                title,
                description,
                cuisine,
                duration,
                servings,
                difficulty,
                meal,
                visibility,
                imageFile,
                existingImageUrl: recipeToEdit.image || "",
                existingImageFileName: recipeToEdit.imageFileName || "",
                ingredients,
                steps,
              },
          })

          onUpdateSuccess?.(updatedRecipe)
          return
        }

        const updatedRecipe = await updateRecipe({
          recipeId: recipeToEdit.recipeId,
          title,
          description,
          cuisine,
          duration,
          servings,
          difficulty,
          meal,
          visibility,
          imageFile,
          existingImageUrl: recipeToEdit.image || "",
          existingImageFileName: recipeToEdit.imageFileName || "",
          ingredients,
          steps,
          currentUser,
        })

        onUpdateSuccess?.(updatedRecipe)
        return
      }

      await createPendingRecipe({
        title,
        description,
        cuisine,
        duration,
        servings,
        difficulty,
        meal,
        visibility,
        imageFile: imageFile!,
        ingredients,
        steps,
        currentUser,
      })

      onSubmitSuccess()
      // onClose()
    } catch (error) {
      console.error(
        isEditMode ? "Failed to update recipe:" : "Failed to create recipe:", error
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isPreviewOpen) {
    return (
      <PostRecipePreview
        title={title}
        description={description}
        cuisine={cuisine}
        duration={duration}
        servings={servings}
        difficulty={difficulty}
        meal={meal}
        visibility={visibility}
        imagePreview={imagePreview}
        ingredients={ingredients}
        steps={steps}
        completionPercentage={completionPercentage}
        isSubmitting={isSubmitting}
        onPost={handlePostRecipe}
        onBack={() => setIsPreviewOpen(false)}
        mode={mode}
        submitLabel={isEditMode ? editSubmitLabel : "Post"}
      />
    )
  }

    return (
    <form className="min-h-full">
      <div className="relative">
        <label className="group relative flex h-[340px] w-full cursor-pointer items-center justify-center overflow-hidden bg-[var(--recipe-upload-bg)]">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Recipe preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-[var(--text-muted)] group-hover:text-[var(--accent-text)]">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-subtle)] transition group-hover:scale-105 group-active:scale-95 group-hover:border-[var(--focus-border)] group-hover:bg-[var(--accent-soft-hover)]">
                <CameraAltRoundedIcon sx={{ fontSize: 32 }} />
              </div>

              <span className="mt-4 text-sm font-medium ">Upload recipe image</span>
            </div>
          )}

          {imagePreview && (
            <div className="absolute inset-0 bg-black/0 transition duration-200 group-hover:bg-black/25" />
          )}

          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[var(--recipe-form-bg)] to-transparent" />

          {imagePreview && (
            <div 
              className="absolute bottom-16 right-6 z-20 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--dropdown-bg)] px-4 py-2 text-sm text-[var(--text-primary)] backdrop-blur-xl transition group-hover:border-[var(--accent-border)] group-hover:bg-[var(--accent-soft-hover)] group-hover:text-[var(--accent-text)]"
            >
              <CameraAltRoundedIcon sx={{ fontSize: 16 }} />
              <span>Change image</span>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleMainImageChange(event.target.files?.[0])}
          />
        </label>

        <button
          type="button"
          onClick={onClose}
          className="absolute left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--recipe-form-bg)] text-[var(--text-secondary)] backdrop-blur-xl transition hover:bg-[var(--button-secondary-hover)] hover:text-[var(--text-primary)] active:scale-95"
        >
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </button>
      </div>

      <div className="relative z-10 -mt-10 rounded-t-[2.8rem] bg-[var(--bg-secondary)] px-7 pb-8 pt-10">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {isEditMode ? "Edit recipe" : "Create recipe"}
        </p>
        <h2 className="mt-1 text-[1.5rem] font-medium text-[var(--text-primary)]">
          {isEditMode ? "Update post" : "New post"}
        </h2>

        <div className="mt-8 flex flex-col gap-5">
          <div className="relative">
            <label className={labelClass}>Title *</label>
            <input 
              value={title} 
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Recipe title"
              className={fieldClass}
            />

          <AnimatePresence>
            {titleTooShort && (
              <motion.p 
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute left-0 -top-5 rounded-lg border border-[var(--danger-border)] bg-[var(--button-danger-bg)] px-3 py-2 text-xs text-[var(--danger-text)] shadow-[var(--shadow-card)]"
              >
                Title must be at least {MIN_TITLE_LENGTH} characters.
              </motion.p>
            )}
          </AnimatePresence>
          </div>

          <div className="relative">
            <label className={labelClass}>Description *</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe your recipe..."
              rows={5}
              className={`${fieldClass} resize-y leading-7`}
            />

            <AnimatePresence>
              {descriptionTooShort && (
                <motion.p 
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-none absolute left-0 -top-5 rounded-lg border border-[var(--danger-border)] bg-[var(--button-danger-bg)] px-3 py-2 text-xs text-[var(--danger-text)] shadow-[var(--shadow-card)]"
                >
                  Description must be at least {MIN_DESCRIPTION_LENGTH} characters.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Cuisine</label>
              <PostRecipeCuisineSelect 
                value={cuisine}
                options={cuisineOptions}
                onChange={setCuisine}
                placeholder="Cuisine"
              />
            </div>

            <div>
              <label className={labelClass}>Duration</label>
              <input
                value={duration}
                onChange={(event) => handleDurationChange(event.target.value)}
                placeholder="60"
                className={fieldClass}
              />

              {formattedDuration && (
                <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
                  Displayed as{" "}
                  <span className="font-medium text-[var(--accent-text)]">
                    {formattedDuration}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Servings</label>
              <input
                value={servings}
                onChange={(event) => handleServingsChange(event.target.value)}
                placeholder="4"
                inputMode="numeric"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Difficulty</label>
              <PostRecipeSelectDropdown 
                value={difficulty}
                options={difficultyOptions}
                onChange={setDifficulty}
              />
            </div>

            <div>
              <label className={labelClass}>Meal type</label>
              <PostRecipeSelectDropdown 
                value={meal}
                options={mealOptions}
                onChange={setMeal}
              />
            </div>

            <div>
              <label className={labelClass}>Visibility</label>
              <PostRecipeSelectDropdown 
                value={visibility}
                options={visibilityOptions}
                onChange={(value) => setVisibility(value as "public" | "private")}
              />
            </div>
          </div>

          <PostRecipeIngredients ingredients={ingredients} onChange={setIngredients} />
          <PostRecipeSteps steps={steps} onChange={setSteps} />
        </div>

        <PostRecipeActionBar
          mode="form"
          completionPercentage={completionPercentage}
          isSubmitting={isSubmitting}
          onPreview={() => setIsPreviewOpen(true)}
          onPost={handlePostRecipe}
          submitLabel={isEditMode ? editSubmitLabel : "Post"}
        />
      </div>
    </form>
  )
}
