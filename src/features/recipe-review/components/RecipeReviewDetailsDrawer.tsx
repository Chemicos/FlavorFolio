import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import SignalCellularAltRoundedIcon from "@mui/icons-material/SignalCellularAltRounded"
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded"
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded"

import { motion } from "motion/react"

import { ReviewRecipe } from "../types/recipeReview.types"
import { useEffect, useMemo, useState } from "react"
import ViewRecipeIngredients from "../../home/components/recipe-view-drawer/ViewRecipeIngredients"
import RecipeReviewStepsSection from "./RecipeReviewStepsSection"
import RecipeReviewSectionHeader, { ReviewIssueSeverity, ReviewSectionFeedback } from "./RecipeReviewSectionHeader"
import { ReviewSectionKey, saveRecipeReviewFeedback } from "../services/recipeReview.service"
import RecipeReviewIngredientsSection from "./RecipeReviewIngredientsSection"

interface RecipeReviewDetailsDrawerProps {
  recipe: ReviewRecipe
  width: number
  onClose: () => void
  onResizeStart: (event: React.MouseEvent<HTMLDivElement>) => void
  onFeedbackSaved?: (
    recipeId: string,
    section: ReviewSectionKey,
    feedback: ReviewSectionFeedback
  ) => void
}

export default function RecipeReviewDetailsDrawer({
  recipe,
  width,
  onClose,
  onResizeStart,
  onFeedbackSaved,
}:RecipeReviewDetailsDrawerProps) {
  type ReviewSectionKey = "description" | "ingredients" | "steps"

  const getInitialReviewFeedback = (recipe: ReviewRecipe) => ({
    description: recipe.reviewFeedback?.description || defaultSectionFeedback,
    ingredients: recipe.reviewFeedback?.ingredients || defaultSectionFeedback,
    steps: recipe.reviewFeedback?.steps || defaultSectionFeedback,
  })
  const [reviewFeedback, setReviewFeedback] = useState(() =>
    getInitialReviewFeedback(recipe)
  )
  const defaultSectionFeedback = {
    message: "",
    severity: null,
  }

  const [isSavingFeedback, setIsSavingFeedback] = useState(false)
  const [editingSection, setEditingSection] = useState<ReviewSectionKey | null>(null)
  const [draftMessage, setDraftMessage] = useState("")
  const [draftSeverity, setDraftSeverity] = useState<ReviewIssueSeverity>("warning")

  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({})

  const ingredients = useMemo(() => recipe.ingredients || [], [recipe.ingredients])

  const steps = useMemo(() => {
    return (recipe.cookingSteps || []).map((step) => ({
      title: step.title,
      description: step.description,
      imageUrl: step.imageUrl || step.image || "",
    }))
  }, [recipe.cookingSteps])

  useEffect(() => {
    setReviewFeedback(getInitialReviewFeedback(recipe))
    setEditingSection(null)
    setDraftMessage("")
    setDraftSeverity("warning")
    setIsSavingFeedback(false)
  }, [recipe.recipeId])

  useEffect(() => {
    setExpandedSteps(
      Object.fromEntries(steps.map((_step, index) => [index + 1, true]))
    )
  }, [steps])

  const handleToggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }))
  }

  const handleStartFeedback = (section: ReviewSectionKey) => {
    setEditingSection(section)
    setDraftMessage(reviewFeedback[section]?.message || "")
    setDraftSeverity(reviewFeedback[section]?.severity || "warning")
  }

  const handleCancelFeedback = () => {
    setEditingSection(null)
    setDraftMessage("")
    setDraftSeverity("warning")
  }

  const handleSaveFeedback = async (section: ReviewSectionKey) => {
    const nextFeedback = {
      message: draftMessage.trim(),
      severity: draftMessage.trim() ? draftSeverity : null,
    }

    try {
      setIsSavingFeedback(true)

      await saveRecipeReviewFeedback({
        recipeId: recipe.recipeId,
        section,
        feedback: nextFeedback,
      })

      setReviewFeedback((prev) => ({
        ...prev,
        [section]: nextFeedback,
      }))
      onFeedbackSaved?.(recipe.recipeId, section, nextFeedback)

      handleCancelFeedback()
    } catch (error) {
      console.error("Failed to save review feedback:", error)
    } finally {
      setIsSavingFeedback(false)
    }
  }

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 260, damping: 32 }}
      style={{ width }}
      className="fixed right-0 top-0 z-[60] flex h-screen flex-col overflow-hidden border-l border-white/10 bg-[#16181d] shadow-[-24px_0_80px_rgba(0,0,0,0.42)]"
    >
      <div
        onMouseDown={onResizeStart}
        className="absolute left-0 top-0 z-50 h-full w-3 -translate-x-1/2 cursor-col-resize before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:bg-white/10 hover:before:bg-orange-400/60"
      />

      <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
        <div className="relative h-[340px] overflow-hidden bg-[#0b0b0c]">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title || "Recipe preview"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[#a8b3cf]">
              No image selected
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] via-[#16181d]/20 to-black/30" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-orange-500/20 hover:backdrop-blur-xl active:scale-90"
          >
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        <div className="relative z-10 -mt-10 rounded-t-[2.8rem] bg-[#16181d] px-7 pb-10 pt-10">
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#c4cbdb]">
            {recipe.cuisine && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-orange-400/15 bg-orange-500/10 px-3 py-2 text-xs text-orange-200 capitalize">
                <RestaurantRoundedIcon sx={{ fontSize: 17 }} />
                <span>{recipe.cuisine}</span>
              </div>
            )}

            {recipe.meal && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-orange-400/15 bg-orange-500/10 px-3 py-2 text-xs text-orange-200 capitalize">
                <span>{recipe.meal}</span>
              </div>
            )}

            {recipe.visibility && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-orange-400/15 bg-orange-500/10 px-3 py-2 text-xs text-orange-200 capitalize">
                <span>{recipe.visibility}</span>
              </div>
            )}
          </div>

          <h1 className="text-[1.5rem] font-bold leading-[2.35rem] text-white capitalize">
            {recipe.title || "Untitled recipe"}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-lg bg-white/10">
              {recipe.author?.profileImage ? (
                <img
                  src={recipe.author.profileImage}
                  alt={recipe.author?.username || recipe.user || "Author"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
                  {(recipe.author?.username || recipe.user || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs text-[#7f89a6]">Made by</p>
              <p className="truncate text-sm font-medium text-[#d7def0]">
                {recipe.author?.username || recipe.user || "Unknown"}
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <InfoBox icon={<AccessTimeOutlinedIcon sx={{ fontSize: 22 }} />} label="duration" />
            <InfoBox icon={<SignalCellularAltRoundedIcon sx={{ fontSize: 22 }} />} label="difficulty" />
            <InfoBox icon={<GroupsRoundedIcon sx={{ fontSize: 22 }} />} label="servings" />

            <InfoValue value={recipe.durationMinutes ? `${recipe.durationMinutes} min` : "-"} />
            <InfoValue value={recipe.difficulty || "-"} />
            <InfoValue value={recipe.servings ? String(recipe.servings) : "-"} />
          </div>

          <section className="mt-8">
            <RecipeReviewSectionHeader 
              title="Description"
              feedback={reviewFeedback.description}
              isEditing={editingSection === "description"}
              draftMessage={draftMessage}
              draftSeverity={draftSeverity}
              isSaving={isSavingFeedback}
              onStartEdit={() => handleStartFeedback("description")}
              onCancelEdit={handleCancelFeedback}
              onSave={() => handleSaveFeedback("description")}
              onMessageChange={setDraftMessage}
              onSeverityChange={setDraftSeverity}
            />

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#7f89a6]">
              {recipe.description || "No description added yet."}
            </p>
          </section>

          <section className="mt-8">
            <RecipeReviewSectionHeader 
              title={`Ingredients (${ingredients.length})`}
              feedback={reviewFeedback.ingredients}
              isEditing={editingSection === "ingredients"}
              draftMessage={draftMessage}
              draftSeverity={draftSeverity}
              isSaving={isSavingFeedback}
              onStartEdit={() => handleStartFeedback("ingredients")}
              onCancelEdit={handleCancelFeedback}
              onSave={() => handleSaveFeedback("ingredients")}
              onMessageChange={setDraftMessage}
              onSeverityChange={setDraftSeverity}
            />
            
            <RecipeReviewIngredientsSection ingredients={ingredients} />
          </section>

          <section className="mt-8">
            <RecipeReviewSectionHeader
              title="Steps"
              feedback={reviewFeedback.steps}
              isEditing={editingSection === "steps"}
              draftMessage={draftMessage}
              draftSeverity={draftSeverity}
              isSaving={isSavingFeedback}
              onStartEdit={() => handleStartFeedback("steps")}
              onCancelEdit={handleCancelFeedback}
              onSave={() => handleSaveFeedback("steps")}
              onMessageChange={setDraftMessage}
              onSeverityChange={setDraftSeverity}
            />

            {steps.length ? (
              <RecipeReviewStepsSection 
                steps={steps}
                expandedSteps={expandedSteps}
                onToggleStep={handleToggleStep}
              />
            ) : (
              <p className="mt-3 text-sm text-[#7f89a6]">No steps added yet.</p>
            )}
          </section>
        </div>
      </div>
    </motion.aside>
  )
}

function InfoBox({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.10] bg-[#0b0b0c] px-4 py-5 text-center">
      <div className="flex justify-center text-white">{icon}</div>
      <p className="mt-3 text-xs font-semibold text-white">{label}</p>
    </div>
  )
}

function InfoValue({ value }: { value: string }) {
  return (
    <div className="flex justify-center">
      <span className="rounded-lg border border-white/[0.10] bg-[#0b0b0c]/60 px-5 py-2 text-xs font-semibold text-white capitalize">
        {value}
      </span>
    </div>
  )
}
