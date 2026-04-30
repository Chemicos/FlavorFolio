import { useEffect, useState } from "react";
import { ViewRecipeComment } from "../components/recipe-view-drawer/ViewRecipeCommentList";
import { listenToRecipeComments } from "../services/comments.service";

export function useRecipeComments(recipeId?: string) {
    const [comments, setComments] = useState<ViewRecipeComment[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(true)

    useEffect(() => {
        if (!recipeId) {
            setComments([])
            setIsLoadingComments(false)
            return
        }

        setIsLoadingComments(true)

        const unsubscribe = listenToRecipeComments(
            recipeId,
            (nextComments) => {
                setComments(nextComments)
                setIsLoadingComments(false)
            },
            () => {
                setIsLoadingComments(false)
            } 
        )

        return () => unsubscribe()
    }, [recipeId])

    return {
        comments,
        isLoadingComments
    }
}