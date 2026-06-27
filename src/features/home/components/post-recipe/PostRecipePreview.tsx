import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded"
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
        <div className="min-h-full bg-[#16181d] text-white">
        <div className="relative h-[340px] overflow-hidden bg-[#0b0b0c]">
            {imagePreview ? (
                <img src={imagePreview} alt={title || "Recipe preview"} className="h-full w-full object-cover" />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-[#a8b3cf]">
                    No image selected
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] via-[#16181d]/20 to-black/30" />

            <button
                type="button"
                onClick={onBack}
                className="absolute left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#16181d]/90 text-[#a8b3cf] backdrop-blur-xl transition hover:bg-[#0b0b0c] hover:text-white active:scale-95"
            >
                <ChevronLeftRoundedIcon sx={{ fontSize: 26 }} />
            </button>
        </div>
        
        <div className="relative z-10 -mt-10 rounded-t-[2.8rem] bg-[#16181d] px-7 pb-8 pt-10">
            <div className="flex flex-wrap gap-3 text-sm text-[#c4cbdb]">
                {cuisine && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl text-xs border border-orange-400/15 bg-orange-500/10 px-3 py-2 text-orange-200 capitalize">
                        <RestaurantRoundedIcon sx={{ fontSize: 17 }} />
                        <span>{cuisine}</span>
                    </div>
                )}

                <div className="mb-3 flex items-center gap-2 rounded-xl text-xs border border-orange-400/15 bg-orange-500/10 px-3 py-2  text-orange-200 capitalize">
                    <span>{meal}</span>
                </div>

                <div className="mb-3 flex items-center gap-2 rounded-xl text-xs border border-orange-400/15 bg-orange-500/10 px-3 py-2  text-orange-200 capitalize">
                    <span>{visibility}</span>
                </div>
            </div>
            
            <h1 className="text-[1.6rem] font-bold leading-[2.35rem] text-white capitalize">
                {title || "Untitled recipe"}
            </h1>

            <div className="mt-10 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#0b0b0c] border border-white/[0.10] px-4 py-5 text-center">
                    <div className="flex justify-center text-white">
                        <AccessTimeOutlinedIcon sx={{ fontSize: 22 }} />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-white">duration</p>
                </div>

                <div className="rounded-xl bg-[#0b0b0c] border border-white/[0.10] px-4 py-5 text-center">
                    <div className="flex justify-center text-white">
                        <SignalCellularAltRoundedIcon sx={{ fontSize: 22 }} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">difficulty</p>
                </div>

                <div className="rounded-xl bg-[#0b0b0c] border border-white/[0.10] px-4 py-5 text-center">
                    <div className="flex justify-center text-white">
                        <GroupsRoundedIcon sx={{ fontSize: 22 }} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">servings</p>
                </div>

                <div className="flex justify-center">
                    <span className="rounded-lg bg-[#0b0b0c]/60 border border-white/[0.10] px-5 py-2 text-sm font-semibold text-white">
                        {formattedDuration || "-"}
                    </span>
                </div>

                <div className="flex justify-center">
                    <span className="rounded-lg bg-[#0b0b0c]/60 border border-white/[0.10] px-5 py-2 text-sm font-semibold text-white">
                        {difficulty}
                    </span>
                </div>

                <div className="flex justify-center">
                    <span className="rounded-lg bg-[#0b0b0c]/60 border border-white/[0.10] px-5 py-2 text-sm font-semibold text-white">
                        {servings || "-"}
                    </span>
                </div>
            </div>

            <section className="mt-8">
                <h2 className="text-lg font-semibold text-white">Description</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#7f89a6]">
                    {description || "No description added yet."}
                </p>
            </section>

            <section className="mt-8">
                {previewIngredients.length ? (
                    <ViewRecipeIngredients ingredients={previewIngredients} />
                ) : (
                    <div>
                    <h2 className="text-[1.2rem] font-bold text-white">Ingredients</h2>
                    <p className="mt-3 text-sm text-[#7f89a6]">
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
                        <h2 className="text-[1.2rem] font-bold text-white">Steps</h2>
                        <p className="mt-3 text-sm text-[#7f89a6]">
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
