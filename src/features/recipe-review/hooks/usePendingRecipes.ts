import { useEffect, useState } from "react";
import { ReviewRecipe } from "../types/recipeReview.types";
import { fetchPendingRecipes, ReviewSectionKey } from "../services/recipeReview.service";
import { ReviewSectionFeedback } from "../components/RecipeReviewSectionHeader";

export function usePendingRecipes() {
    const [recipes, setRecipes] = useState<ReviewRecipe[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        async function loadRecipes() {
            try {
                setIsLoading(true)
                setError(null)

                const result = await fetchPendingRecipes()

                if (isMounted) {
                setRecipes(result)
                }
            } catch (err) {
                console.error("Failed to fetch pending recipes:", err)

                if (isMounted) {
                setError("Failed to load pending recipes.")
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadRecipes()

        return () => {
            isMounted = false
        }
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

    return {
        recipes,
        isLoading,
        error,
        handleReviewFeedbackStateChange
    }
}