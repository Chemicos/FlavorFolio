import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded"
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import SignalCellularAltRoundedIcon from "@mui/icons-material/SignalCellularAltRounded"
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded"
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded"
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded"

import { useNavigate } from "react-router-dom"
import { formatDurationFromMinutes } from "../../home/utils/recipeDuration"
import { AdminRecipeRow } from "../types/adminRecipes.types"
import { motion } from "motion/react"
import { useEffect, useMemo, useState } from "react"
import RecipeReviewIngredientsSection from "../../recipe-review/components/RecipeReviewIngredientsSection"
import RecipeReviewStepsSection from "../../recipe-review/components/RecipeReviewStepsSection"

interface AdminRecipeDetailsDrawerProps {
  recipe: AdminRecipeRow
  width: number
  onClose: () => void
  onResizeStart: (event: React.MouseEvent<HTMLDivElement>) => void
}

function getStatusLabel(status: string) {
  if (status === "needs_revision") return "Needs Revision"
  if (status === "pending") return "Pending Review"
  return "Published"
}

export default function AdminRecipeDetailsDrawer({
    recipe,
    width,
    onClose,
    onResizeStart,
}: AdminRecipeDetailsDrawerProps) {
    const navigate = useNavigate()

    const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({})
    const ingredients = useMemo(() => recipe.ingredients || [], [recipe.ingredients])

    const formattedDuration = formatDurationFromMinutes(
        String(recipe.durationMinutes || "")
    )

    const steps = useMemo(() => {
        return (recipe.cookingSteps || []).map((step) => ({
            title: step.title,
            description: step.description,
            imageUrl: step.imageUrl || step.image || "",
        }))
    }, [recipe.cookingSteps])

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
  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 260, damping: 32 }}
      style={{ width }}
      className="fixed right-0 top-16 z-40 flex h-[calc(100vh-64px)] flex-col overflow-hidden border-l border-white/10 bg-[#16181d] shadow-[-24px_0_80px_rgba(0,0,0,0.42)]"
    >
      <div
        onMouseDown={onResizeStart}
        className="absolute left-0 top-0 z-50 h-full w-3 -translate-x-1/2 cursor-col-resize before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:bg-white/10 hover:before:bg-orange-400/60"
      />

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
        <div className="relative h-[320px] overflow-hidden bg-[#0b0b0c]">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[#8f97b1]">
              No image available
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] via-[#16181d]/20 to-black/30" />

          <button
            type="button"
            onClick={onClose}
            className="absolute left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#16181d]/90 text-[#a8b3cf] backdrop-blur-xl transition hover:bg-[#0b0b0c] hover:text-white active:scale-95"
          >
            <ChevronLeftRoundedIcon sx={{ fontSize: 26 }} />
          </button>
        </div>

        <div className="relative z-10 -mt-10 rounded-t-[2.8rem] bg-[#16181d] px-7 pb-10 pt-10">
          <div className="flex flex-wrap gap-3">
            <Badge icon={<RestaurantRoundedIcon sx={{ fontSize: 16 }} />} label={recipe.cuisine} />
            <Badge label={recipe.meal} />
            <Badge label={recipe.visibility} />
            <Badge label={getStatusLabel(recipe.status)} />
          </div>

          <h1 className="mt-4 text-[1.5rem] font-bold leading-[2.35rem] text-white">
            {recipe.title}
          </h1>

            <div className="mt-4 flex items-center gap-3">
                <div className="h-9 w-9 overflow-hidden rounded-lg bg-white/10">
                    {recipe.authorProfileImage ? (
                    <img
                        src={recipe.authorProfileImage}
                        alt={recipe.authorUsername}
                        className="h-full w-full object-cover"
                    />
                    ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
                        {(recipe.authorUsername || "U").charAt(0).toUpperCase()}
                    </div>
                    )}
                </div>

                <div className="min-w-0">
                    <p className="text-xs text-[#7f89a6]">Made by</p>
                    <p className="truncate text-sm font-medium text-[#d7def0]">
                    {recipe.authorUsername || "Unknown"}
                    </p>
                </div>
            </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <InfoBox icon={<AccessTimeOutlinedIcon sx={{ fontSize: 22 }} />} label="duration" />
            <InfoBox icon={<SignalCellularAltRoundedIcon sx={{ fontSize: 22 }} />} label="difficulty" />
            <InfoBox icon={<GroupsRoundedIcon sx={{ fontSize: 22 }} />} label="servings" />

            <InfoValue value={recipe.durationMinutes ? formattedDuration : "-"} />
            <InfoValue value={recipe.difficulty || "-"} />
            <InfoValue value={recipe.servings ? String(recipe.servings) : "-"} />
          </div>

          <section className="mt-8">
            <h2 className="text-base font-bold text-white">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#8f97b1]">
              {recipe.description || "No description added."}
            </p>
          </section>

            <section className="mt-8">
                <h2 className="text-base font-bold text-white">
                    Ingredients ({ingredients.length})
                </h2>

                <RecipeReviewIngredientsSection ingredients={ingredients} />
            </section>

            <section className="mt-8">
            <h2 className="text-base font-bold text-white">
                Steps ({steps.length})
            </h2>

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

      {recipe.status === "pending" && (
        <div className="shrink-0 border-t border-white/10 bg-[#16181d]/95 px-6 py-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => navigate(`/pending?recipeId=${recipe.recipeId}`)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-orange-400/10 bg-orange-500/10 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/15 active:scale-[0.98]"
          >
            <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
            Open in moderation
          </button>
        </div>
      )}
    </motion.aside>
  )
}

function Badge({ icon, label }: { icon?: React.ReactNode; label: string }) {
  if (!label) return null

  return (
    <div className="flex items-center gap-2 rounded-xl border border-orange-400/15 bg-orange-500/10 px-3 py-2 text-xs capitalize text-orange-200">
      {icon}
      {label.replace("_", " ")}
    </div>
  )
}

function InfoBox({ icon, label }: { icon: React.ReactNode; label: string }) {
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
      <span className="rounded-lg border border-white/[0.10] bg-[#0b0b0c]/60 px-5 py-2 text-xs font-semibold text-white">
        {value}
      </span>
    </div>
  )
}
