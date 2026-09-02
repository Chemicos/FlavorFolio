import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded"
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded"
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import SignalCellularAltRoundedIcon from "@mui/icons-material/SignalCellularAltRounded"

import { PostRecipeIngredient, PostRecipeStep } from "../../types/postRecipe.types"
import { useEffect, useMemo, useState } from "react"
import ViewRecipeIngredients from "../recipe-view-drawer/ViewRecipeIngredients"
import ViewRecipeStepsSection from "../recipe-view-drawer/ViewRecipeStepsSection"
import PostRecipeActionBar from "./PostRecipeActionBar"
import { formatDurationFromMinutes } from "../../utils/recipeDuration"

interface PostRecipePreviewProps {
    title: string
    description: string
    cuisine: string
    duration: string
    servings: string
    difficulty: string
    meal: string
    visibility: "public" | "private"
    imagePreview: string
    ingredients: PostRecipeIngredient[]
    steps: PostRecipeStep[]
    completionPercentage: number
    isSubmitting: boolean
    onPost: () => void
    onBack: () => void
    mode?: "create" | "edit"
    submitLabel?: string
}

export default function PostRecipePreview({
    title,
    description,
    cuisine,
    duration,
    servings,
    difficulty,
    meal,
    visibility,
    imagePreview,
    ingredients,
    steps,
    completionPercentage,
    isSubmitting,
    onPost,
    onBack,
    mode = "create",
    submitLabel = "Post"
}: PostRecipePreviewProps) {
    const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({})

    const formattedDuration = formatDurationFromMinutes(duration)

    const previewSteps = useMemo(() => {
        return steps.map((step) => ({
            title: step.title,
            description: step.description,
            imageUrl: step.imagePreview || "",
        }))
    }, [steps])
    
    const areAllStepsExpanded = previewSteps.length > 0 && previewSteps.every((_step, index) => expandedSteps[index + 1])
    
    const handleToggleStep = (stepNumber: number) => {
        setExpandedSteps((prev) => ({
            ...prev,
            [stepNumber]: !prev[stepNumber],
        }))
    }
    
    const handleToggleAllSteps = () => {
        if (areAllStepsExpanded) {
            setExpandedSteps({})
            return
        }
        
        setExpandedSteps(
            Object.fromEntries(steps.map((_step, index) => [index + 1, true]))
        )
    }
    
    const previewIngredients = useMemo(() => {
        return ingredients.map((ingredient) => ({
            ingredient: ingredient.ingredient,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
        }))
    }, [ingredients])
    
    
    useEffect(() => {
        setExpandedSteps(
            Object.fromEntries(
                previewSteps.map((_step, index) => [index + 1, true])
            )
        )
    }, [previewSteps])

    return (
        <div className="min-h-full  bg-[var(--bg-secondary)] text-[var(--text-primary)]">
        <div className="relative h-[340px] overflow-hidden bg-[var(--recipe-upload-bg)]">
            {imagePreview ? (
                <img src={imagePreview} alt={title || "Recipe preview"} className="h-full w-full object-cover" />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-[var(--text-secondary)]">
                    No image selected
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[var(--recipe-form-bg)] via-transparent to-black/30" />

            <button
                type="button"
                onClick={onBack}
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
                <CloseRoundedIcon sx={{ fontSize: 20 }} />
            </button>
        </div>
        
        <div className="relative z-10 -mt-10 rounded-t-[2.8rem] border-[var(--recipe-form-border)] bg-[var(--bg-secondary)] px-7 pb-8 pt-10 shadow-[var(--recipe-form-shadow)]">
            <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                {cuisine && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl text-xs border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-2 text-[var(--accent-text)] capitalize">
                        <RestaurantRoundedIcon sx={{ fontSize: 17 }} />
                        <span>{cuisine}</span>
                    </div>
                )}

                <div className="mb-3 flex items-center gap-2 rounded-xl text-xs border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-2 text-[var(--accent-text)] capitalize">
                    <span>{meal}</span>
                </div>

                <div className="mb-3 flex items-center gap-2 rounded-xl text-xs border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-2 text-[var(--accent-text)] capitalize">
                    <span>{visibility}</span>
                </div>
            </div>
            
            <h1 className="text-[1.6rem] font-bold leading-[2.35rem] text-[var(--text-primary)] capitalize">
                {title || "Untitled recipe"}
            </h1>

            <div className="mt-10 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-4 py-5 text-center">
                    <div className="flex justify-center text-[var(--text-primary)]">
                        <AccessTimeOutlinedIcon sx={{ fontSize: 22 }} />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">duration</p>
                </div>

                <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-4 py-5 text-center">
                    <div className="flex justify-center text-[var(--text-primary)]">
                        <SignalCellularAltRoundedIcon sx={{ fontSize: 22 }} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">difficulty</p>
                </div>

                <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-4 py-5 text-center">
                    <div className="flex justify-center text-[var(--text-primary)]">
                        <GroupsRoundedIcon sx={{ fontSize: 22 }} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">servings</p>
                </div>

                <div className="flex justify-center">
                    <span className="rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)]">
                        {formattedDuration || "-"}
                    </span>
                </div>

                <div className="flex justify-center">
                    <span className="rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)]">
                        {difficulty}
                    </span>
                </div>

                <div className="flex justify-center">
                    <span className="rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)]">
                        {servings || "-"}
                    </span>
                </div>
            </div>

            <section className="mt-8">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Description</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--text-muted)]">
                    {description || "No description added yet."}
                </p>
            </section>

            <section className="mt-8">
                {previewIngredients.length ? (
                    <ViewRecipeIngredients ingredients={previewIngredients} />
                ) : (
                    <div>
                    <h2 className="text-[1.2rem] font-bold text-[var(--text-primary)]">Ingredients</h2>
                    <p className="mt-3 text-sm text-[var(--text-muted)]">
                        No ingredients added yet.
                    </p>
                    </div>
                )}
            </section>

            <section className="mt-8">
                {previewSteps.length ? (
                    <ViewRecipeStepsSection
                        steps={previewSteps}
                        expandedSteps={expandedSteps}
                        areAllStepsExpanded={areAllStepsExpanded}
                        onToggleStep={handleToggleStep}
                        onToggleAllSteps={handleToggleAllSteps}
                    />
                ) : (
                    <div>
                        <h2 className="text-[1.2rem] font-bold text-[var(--text-primary)]">Steps</h2>
                        <p className="mt-3 text-sm text-[var(--text-muted)]">
                            No steps added yet.
                        </p>
                    </div>
                )}
            </section>

            <PostRecipeActionBar
                mode="preview"
                completionPercentage={completionPercentage}
                isSubmitting={isSubmitting}
                submitLabel={submitLabel}
                onEdit={onBack}
                onPost={onPost}
            />
        </div>
    </div>
  )
}
