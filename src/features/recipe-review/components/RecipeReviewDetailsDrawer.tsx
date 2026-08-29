import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded"
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import SignalCellularAltRoundedIcon from "@mui/icons-material/SignalCellularAltRounded"
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded"
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded"

import { motion } from "motion/react"

import { ReviewRecipe } from "../types/recipeReview.types"
import { useEffect, useMemo, useState } from "react"
import RecipeReviewStepsSection from "./RecipeReviewStepsSection"
import RecipeReviewSectionHeader, { ReviewIssueSeverity, ReviewSectionFeedback } from "./RecipeReviewSectionHeader"
import { ReviewSectionKey, saveRecipeReviewFeedback } from "../services/recipeReview.service"
import RecipeReviewIngredientsSection from "./RecipeReviewIngredientsSection"
import { CircularProgress } from "@mui/material"
import { formatDurationFromMinutes } from "../../home/utils/recipeDuration"

interface RecipeReviewDetailsDrawerProps {
  recipe: ReviewRecipe
  mode?: "review" | "revision" | "draft"
  width: number
  onClose: () => void
  onResizeStart: (event: React.MouseEvent<HTMLDivElement>) => void
  onFeedbackSaved?: (
    recipeId: string,
    section: ReviewSectionKey,
    feedback: ReviewSectionFeedback
  ) => void
  isReviewActionLoading?: boolean
  onDenyRecipe?: (recipe: ReviewRecipe) => void
  onApproveRecipe?: (recipeId: string) => void
  onEditRecipe?: (recipe: ReviewRecipe) => void
  onDeleteRecipe?: (recipe: ReviewRecipe) => void
  onSubmitRevision?: (recipeId: string) => void
  isRevisionActionLoading?: boolean
}

export default function RecipeReviewDetailsDrawer({
  recipe,
  mode = "review",
  width,
  onClose,
  onResizeStart,
  onFeedbackSaved,
  isReviewActionLoading = false,
  onDenyRecipe,
  onApproveRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onSubmitRevision,
  isRevisionActionLoading = false,
}:RecipeReviewDetailsDrawerProps) {
  type ReviewSectionKey = "description" | "ingredients" | "steps"
  const isReviewMode = mode === "review"
  const isRevisionMode = mode === "revision"
  const isDraftMode = mode === "draft"
  const isCreatorMode = isRevisionMode || isDraftMode

  const defaultSectionFeedback: ReviewSectionFeedback = {
    message: "",
    severity: null,
  }

  const getInitialReviewFeedback = (recipe: ReviewRecipe) => ({
    description: recipe.reviewFeedback?.description || defaultSectionFeedback,
    ingredients: recipe.reviewFeedback?.ingredients || defaultSectionFeedback,
    steps: recipe.reviewFeedback?.steps || defaultSectionFeedback,
  })

  const [reviewFeedback, setReviewFeedback] = useState(() =>
    getInitialReviewFeedback(recipe)
  )

  const [isSavingFeedback, setIsSavingFeedback] = useState(false)
  const [editingSection, setEditingSection] = useState<ReviewSectionKey | null>(null)
  const [draftMessage, setDraftMessage] = useState("")
  const [draftSeverity, setDraftSeverity] = useState<ReviewIssueSeverity>("warning")

  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({})

  const ingredients = useMemo(() => recipe.ingredients || [], [recipe.ingredients])

  const metadataBadgeClassName = [
    "mb-3 flex items-center gap-2 rounded-xl border",
    "border-[var(--accent-border)]",
    "bg-[var(--accent-soft)]",
    "px-3 py-2 text-xs capitalize",
    "text-[var(--accent-text)]",
  ].join(" ")

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

  const formattedDuration = formatDurationFromMinutes(
    String(recipe.durationMinutes || "")
  )

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 260, damping: 32 }}
      style={{ width }}
      className={[
        "fixed right-0 top-16 z-40",
        "flex h-[calc(100vh-64px)] flex-col overflow-hidden",
        "border-l border-[var(--border)]",
        "bg-[var(--bg-secondary)]",
        "shadow-[var(--shadow-panel)]",
        "transition-colors",
      ].join(" ")}
    >
      <div
        onMouseDown={onResizeStart}
        className={[
          "absolute left-0 top-0 z-50 h-full w-3",
          "-translate-x-1/2 cursor-col-resize",
          "before:absolute before:left-1/2 before:top-0",
          "before:h-full before:w-px",
          "before:bg-[var(--border)]",
          "hover:before:w-[2px]",
          "hover:before:bg-[var(--accent)]",
        ].join(" ")}
      />

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
        <div className="relative h-[340px] overflow-hidden bg-[var(--bg-primary)]">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title || "Recipe preview"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[var(--text-secondary)]">
              No image selected
            </div>
          )}

          <div 
            className="absolute inset-0" 
            style={{
              background:
                "linear-gradient(to top, var(--bg-secondary), transparent 58%, rgba(0,0,0,0.28))",
            }}
          />

          <button
            type="button"
            onClick={onClose}
            className={[
              "absolute left-5 top-5 z-20",
              "flex h-11 w-11 items-center justify-center rounded-lg border",
              "border-[var(--drawer-control-border)]",
              "bg-[var(--drawer-control-bg)]",
              "text-[var(--text-secondary)]",
              "shadow-[var(--shadow-card)]",
              "transition",
              "hover:bg-[var(--drawer-control-hover)]",
              "hover:text-[var(--text-primary)]",
              "active:scale-95",
            ].join(" ")}
          >
            <ChevronRightRoundedIcon sx={{ fontSize: 26 }} />
          </button>
        </div>

        <div className="relative z-10 -mt-10 rounded-t-[2.8rem] border-t border-[var(--border)] bg-[var(--bg-secondary)] px-7 pb-10 pt-10">
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
            {recipe.cuisine && (
              <div className={metadataBadgeClassName}>
                <RestaurantRoundedIcon sx={{ fontSize: 17 }} />
                <span>{recipe.cuisine}</span>
              </div>
            )}

            {recipe.meal && (
              <div className={metadataBadgeClassName}>
                <span>{recipe.meal}</span>
              </div>
            )}

            {recipe.visibility && (
              <div className={metadataBadgeClassName}>
                <span>{recipe.visibility}</span>
              </div>
            )}
          </div>

          <h1 className="text-[1.5rem] font-bold leading-[2.35rem] text-[var(--text-primary)] capitalize">
            {recipe.title || "Untitled recipe"}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-lg bg-[var(--surface-muted)]">
              {recipe.author?.profileImage ? (
                <img
                  src={recipe.author.profileImage}
                  alt={recipe.author?.username || recipe.user || "Author"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--text-secondary)]">
                  {(recipe.author?.username || recipe.user || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)]">Made by</p>
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {recipe.author?.username || recipe.user || "Unknown"}
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <InfoBox icon={<AccessTimeOutlinedIcon sx={{ fontSize: 22 }} />} label="duration" />
            <InfoBox icon={<SignalCellularAltRoundedIcon sx={{ fontSize: 22 }} />} label="difficulty" />
            <InfoBox icon={<GroupsRoundedIcon sx={{ fontSize: 22 }} />} label="servings" />

            <InfoValue value={recipe.durationMinutes ? formattedDuration : "-"} />
            <InfoValue value={recipe.difficulty || "-"} />
            <InfoValue value={recipe.servings ? String(recipe.servings) : "-"} />
          </div>

          {mode === "revision" && recipe.denialFeedback?.message && (
            <section className="mt-6 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--warning-text)]">
                Revision message
              </p>

              <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                {recipe.denialFeedback.message}
              </p>
            </section>
          )}

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
              canEdit={isReviewMode}
            />

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--text-secondary)]">
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
              canEdit={isReviewMode}
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
              canEdit={isReviewMode}
            />

            {steps.length ? (
              <RecipeReviewStepsSection 
                steps={steps}
                expandedSteps={expandedSteps}
                onToggleStep={handleToggleStep}
              />
            ) : (
              <p className="mt-3 text-sm text-[var(--text-muted)]">No steps added yet.</p>
            )}
          </section>
        </div>
      </div>
      
      {isReviewMode && (
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-4 shadow-[var(--recipe-form-shadow)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onDenyRecipe?.(recipe)}
              disabled={isReviewActionLoading}
              className={[
                "flex h-11 flex-1 items-center justify-center rounded-lg border",
                "border-[var(--button-danger-border)]",
                "bg-[var(--button-danger-bg)]",
                "text-sm font-semibold text-[var(--button-danger-text)]",
                "transition",
                "hover:bg-[var(--button-danger-hover)]",
                "disabled:cursor-not-allowed disabled:opacity-45",
                "active:scale-[0.98]",
              ].join(" ")}
            >
              Deny
            </button>

            <button
              type="button"
              disabled={isReviewActionLoading}
              onClick={() => onApproveRecipe?.(recipe.recipeId)}
              className={[
                "flex h-11 flex-1 items-center justify-center rounded-lg border",
                "border-[var(--button-success-border)]",
                "bg-[var(--button-success-bg)]",
                "text-sm font-semibold text-[var(--button-success-text)]",
                "transition",
                "hover:bg-[var(--button-success-hover)]",
                "disabled:cursor-not-allowed disabled:opacity-45",
                "active:scale-[0.98]",
              ].join(" ")}
            >
              {isReviewActionLoading ? (
                <CircularProgress size={15} thickness={5} sx={{ color: "var(--success)" }} />
              ) : (
                "Approve"
              )}
            </button>
          </div>
        </div>
      )}

      {isCreatorMode && (
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-4 shadow-[var(--recipe-form-shadow)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onDeleteRecipe?.(recipe)}
              className={[
                "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border",
                "border-[var(--button-danger-border)]",
                "bg-[var(--button-danger-bg)]",
                "text-sm font-semibold text-[var(--button-danger-text)]",
                "transition hover:bg-[var(--button-danger-hover)]",
                "active:scale-[0.98]",
              ].join(" ")}
            >
              <DeleteRoundedIcon sx={{ fontSize: 18 }} />
              Delete
            </button>

            <button
              type="button"
              onClick={() => onEditRecipe?.(recipe)}
              className={[
                "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border",
                "border-[var(--accent-border)]",
                "bg-[var(--accent-soft)]",
                "text-sm font-semibold text-[var(--accent-text)]",
                "transition hover:bg-[var(--accent-soft-hover)]",
                "active:scale-[0.98]",
              ].join(" ")}
            >
              <EditRoundedIcon sx={{ fontSize: 18 }} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => onSubmitRevision?.(recipe.recipeId)}
              disabled={isRevisionActionLoading}
              className={[
                "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border",
                "border-[var(--button-success-border)]",
                "bg-[var(--button-success-bg)]",
                "text-sm font-semibold text-[var(--button-success-text)]",
                "transition hover:bg-[var(--button-success-hover)]",
                "disabled:cursor-not-allowed disabled:opacity-45",
                "active:scale-[0.98]",
              ].join(" ")}
            >
              {isRevisionActionLoading ? (
                <CircularProgress 
                  size={15}
                  thickness={5}
                  sx={{color: "var(--success)"}}
                />
              ): (
                <SendRoundedIcon sx={{ fontSize: 18 }} />
              )}

              Send for Review
            </button>
          </div>
        </div>
      )}
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-5 text-center shadow-[var(--shadow-card)]">
      <div className="flex justify-center text-[var(--text-primary)]">{icon}</div>
      <p className="mt-3 text-xs font-semibold text-[var(--text-primary)]">{label}</p>
    </div>
  )
}

function InfoValue({ value }: { value: string }) {
  return (
    <div className="flex justify-center">
      <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-5 py-2 text-xs font-semibold text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  )
}
