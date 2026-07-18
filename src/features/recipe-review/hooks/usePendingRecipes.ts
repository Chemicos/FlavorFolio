import { useEffect, useState } from "react";
import { ReviewRecipe } from "../types/recipeReview.types";
import { approveRecipes, denyRecipes, ReviewSectionKey, subscribeToPendingRecipes } from "../services/recipeReview.service";
import { ReviewSectionFeedback } from "../components/RecipeReviewSectionHeader";

export function usePendingRecipes() {
    const [recipes, setRecipes] = useState<ReviewRecipe[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isReviewActionLoading, setIsReviewActionLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // useEffect(() => {
    //     let isMounted = true

    //     async function loadRecipes() {
    //         try {
    //             setIsLoading(true)
    //             setError(null)

    //             const result = await fetchPendingRecipes()

    //             if (isMounted) {setRecipes(result)}
    //         } catch (err) {
    //             console.error("Failed to fetch pending recipes:", err)

    //             if (isMounted) {setError("Failed to load pending recipes.")}
    //         } finally {
    //             if (isMounted) {setIsLoading(false)}
    //         }
    //     }

    //     loadRecipes()

    //     return () => {
    //         isMounted = false
    //     }
    // }, [])

    useEffect(() => {
        setIsLoading(true)

        const unsubscribe = subscribeToPendingRecipes({
            onChange: (recipes) => {
                setRecipes(recipes)
                setIsLoading(false)
            },

            onError: (error) => {
                console.error(error)
                setError("Failed to load pending recipes.")
                setIsLoading(false)
            },
        })

        return () => unsubscribe()
    }, [])

    const handleReviewFeedbackStateChange = (
        recipeId: string,
        section: ReviewSectionKey,
        feedback: ReviewSectionFeedback
    ) => {
        setRecipes((prev) =>
        prev.map((recipe) =>
            recipe.recipeId === recipeId
            ? {
                ...recipe,
                reviewFeedback: {
                    ...recipe.reviewFeedback,
                    [section]: feedback,
                },
            }
            : recipe
        )
        )
    }

    const approveSelectedRecipes = async (recipeIds: string[]) => {
        setIsReviewActionLoading(true)

        try {
        await approveRecipes(recipeIds)

        setRecipes((prev) =>
            prev.filter((recipe) => !recipeIds.includes(recipe.recipeId))
        )
        } finally {
        setIsReviewActionLoading(false)
        }
    }

    const denySelectedRecipes = async ({
        recipeIds,
        reason,
        message,
    }: {
        recipeIds: string[]
        reason: string
        message: string
    }) => {
        setIsReviewActionLoading(true)

        try {
        await denyRecipes({ recipeIds, reason, message })

        setRecipes((prev) =>
            prev.filter((recipe) => !recipeIds.includes(recipe.recipeId))
        )
        } finally {
        setIsReviewActionLoading(false)
        }
    }

    return {
        recipes,
        isLoading,
        isReviewActionLoading,
        error,
        handleReviewFeedbackStateChange,
        approveSelectedRecipes,
        denySelectedRecipes,
    }
}