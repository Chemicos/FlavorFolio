import type { Recipe, SavedRecipe } from "../types"
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
    savedRecipes: SavedRecipe[]
    followingUserIds: string[]
    authorFollowersCountMap: Record<string, number>
    hasMoreRecipes: boolean,
    isFetchingMoreRecipes: boolean,
    onFetchMoreRecipes: () => void
    onFollowStateChange: (authorId: string, isNowFollowing: boolean) => void
    onFavoriteStateChange: (recipeId: string, isNowSaved: boolean) => void
    activeTab: string
    filters: RecipeFilters
    onRecipeClick: (recipe: Recipe) => void
    onCreatePost: () => void 
}

export default function Content({ 
    recipes, isLoading, isFiltering, title, onOpenFilters, currentUser, savedRecipes, followingUserIds, authorFollowersCountMap, onFavoriteStateChange,
    onFollowStateChange, onRecipeClick, onCreatePost, hasMoreRecipes, isFetchingMoreRecipes, onFetchMoreRecipes
}: ContentProps) {
    const showLoading = isLoading || isFiltering

  return (
    <div className="flex w-full flex-col sm:mb-6">
        <RecipeSection
            title={title}
            recipes={recipes}
            currentUser={currentUser}
            savedRecipes={savedRecipes}
            followingUserIds={followingUserIds}
            authorFollowersCountMap={authorFollowersCountMap}
            onFollowStateChange={onFollowStateChange}
            onFavoriteStateChange={onFavoriteStateChange}
            onRecipeClick={onRecipeClick}
            isLoading={showLoading}
            onOpenFilters={onOpenFilters}
            onCreatePost={onCreatePost}
            hasMore={hasMoreRecipes}
            isFetchingMore={isFetchingMoreRecipes}
            onFetchMore={onFetchMoreRecipes}
        />
    </div>
  )
}