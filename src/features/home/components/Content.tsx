/* eslint-disable react/prop-types */
import { db } from "../../../firebase-config";
import { useEffect, useMemo, useState } from "react";
import type { Recipe, SavedRecipe } from "../types"
import ViewRecipe from "./ViewRecipe";
import RecipeSection from "./RecipeSection";
import { RecipeFilters } from "./FilterDrawer";
import { CurrentUserCardData } from "../types/recipeCard.types";

interface ContentProps {
    recipes: Recipe[]
    isLoading: boolean
    isFiltering: boolean
    title: string
    onOpenFilters: () => void
    currentUser: CurrentUserCardData | null
    currentUserId: string | null
    savedRecipes: SavedRecipe[]
    followingUserIds: string[]
    authorFollowersCountMap: Record<string, number>
    onFollowStateChange: (authorId: string, isNowFollowing: boolean) => void
    onFavoriteStateChange: (recipeId: string, isNowSaved: boolean) => void
    activeTab: string
    filters: RecipeFilters
    onRecipeClick: (recipe: Recipe) => void
    onCreatePost: () => void 
}

export default function Content({ 
    recipes, isLoading, isFiltering, title, onOpenFilters, currentUser,
    currentUserId, savedRecipes, followingUserIds, authorFollowersCountMap, onFavoriteStateChange,
    onFollowStateChange, activeTab, filters, onRecipeClick, onCreatePost
}: ContentProps) {
    const [visibleCount, setVisibleCount] = useState(20)
    const showLoading = isLoading || isFiltering

    useEffect(() => {
        setVisibleCount(20)
    }, [activeTab, filters])

  return (
    <div className="flex w-full flex-col sm:mb-6">
        <RecipeSection
            title={title}
            recipes={recipes}
            visibleCount={visibleCount}
            onShowMore={() => setVisibleCount((prev) => prev + 4)}
            currentUser={currentUser}
            currentUserId={currentUserId}
            savedRecipes={savedRecipes}
            followingUserIds={followingUserIds}
            authorFollowersCountMap={authorFollowersCountMap}
            onFollowStateChange={onFollowStateChange}
            onFavoriteStateChange={onFavoriteStateChange}
            onRecipeClick={onRecipeClick}
            isLoading={showLoading}
            onOpenFilters={onOpenFilters}
            onCreatePost={onCreatePost}
        />
    </div>
  )
}