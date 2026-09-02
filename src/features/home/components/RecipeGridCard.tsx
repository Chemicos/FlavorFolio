import StarRoundedIcon from "@mui/icons-material/StarRounded"
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded"
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded"

import { Recipe, SavedRecipe } from "../types"
import { CurrentUserCardData } from "../types/recipeCard.types"
import { useRecipeCardActions } from "../hooks/useRecipeCardActions"
import { CircularProgress } from "@mui/material"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import { motion } from "motion/react"

function formatDuration(minutes?: number) {
  if (!minutes) return "0 min"
  if (minutes < 60) return `${minutes} min`

  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  return m ? `${h}h ${m}min` : `${h}h`
}

function formatCompactNumber(value?: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0))
}

export default function RecipeGridCard({
    recipe,
    currentUser,
    savedRecipes,
    onClick,
    onFavoriteStateChange,
}: {
    recipe: Recipe
    currentUser: CurrentUserCardData | null
    savedRecipes: SavedRecipe[]
    onClick: () => void
    onFavoriteStateChange: (recipeId: string, isNowSaved: boolean) => void
}) {
    const { showSnackbar } = useSnackbar()
    const recipeId = recipe.recipeId || recipe.id || ""

    const RECIPE_LAYOUT_TRANSITION = {
      type: "spring" as const,
      stiffness: 280,
      damping: 30,
      mass: 0.8,
    }

    const {
        isFavorite,
        isFavoriteLoading,
        handleToggleFavorite,
    } = useRecipeCardActions({
        recipe,
        currentUser,
        savedRecipes,
        followingUserIds: [],
        onFollowStateChange: () => {},
        onFavoriteStateChange,
    })

    const rating = Number(
        recipe.stats?.averageRating ??
        recipe.averageRating ??
        recipe.rating ??
        0
    )

    const commentsCount = Number(recipe.stats?.commentsCount ?? recipe.commentsCount ?? 0)

    const savesCount = Number(recipe.stats?.savesCount ?? recipe.savesCount ?? 0)

    const authorUsername = recipe.author?.username || recipe.user || recipe.username || "Unknown"

    const authorImage = recipe.author?.profileImage || recipe.userProfileImage || ""

    const handleFavoriteClick = async (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.stopPropagation()

        if (!currentUser?.uid || !recipe.recipeId || isFavoriteLoading) return

        const wasFavorite = isFavorite

        await handleToggleFavorite(event)

        showSnackbar(
            wasFavorite
            ? "Recipe removed from saved recipes."
            : "Recipe saved.",
            wasFavorite ? "info" : "success"
        )
    }

    const handleCardClick = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.target as HTMLElement

        const clickedInteractiveElement = target.closest(
            "button, a, input, textarea, select, [data-no-card-click]"
        )

        if (clickedInteractiveElement) return
        onClick()
    }
  return (
    <motion.article
      transition={{layout: RECIPE_LAYOUT_TRANSITION}}
      className="relative h-[370px]"
    >
      <div
        onClick={handleCardClick}
        style={{
          borderRadius: 8,
        }}
        className={[
          "group relative h-full cursor-pointer overflow-hidden",
          "border border-[var(--border)] bg-[var(--card-bg)]",
          "shadow-[var(--shadow-card)]",
          "transition-[transform,border-color] duration-150 ease-out",
          "hover:-translate-y-1 hover:border-[var(--border-strong)]",
        ].join(" ")}
      >
        <img
        src={recipe.image}
        alt={recipe.title}
        loading="lazy"
        className={[
          "absolute inset-0 h-full w-full object-cover",
          "transition-transform duration-500",
          "group-hover:scale-[1.025]",
        ].join(" ")}
      />

      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/85 via-black/55 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <button
        type="button"
        onClick={handleFavoriteClick}
        data-no-card-click
        disabled={isFavoriteLoading}
        className={[
          "absolute right-4 top-4 z-10",
          "flex h-10 w-10 items-center justify-center rounded-full",
          "border border-[var(--profile-floating-control-border)]",
          "bg-[var(--profile-floating-control-bg)]",
          "text-[var(--profile-floating-control-text)]",
          "shadow-[var(--shadow-card)] backdrop-blur-xl",
          "transition",
          "hover:bg-[var(--profile-floating-control-hover)]",
          "active:scale-95",
          "disabled:cursor-not-allowed disabled:opacity-60",
        ].join(" ")}
        aria-label={isFavorite ? "Unsave recipe" : "Save recipe"}
      >
        {isFavoriteLoading ? (
            <CircularProgress size={18} thickness={5} sx={{ color: "var(--accent)" }} />
        ) : isFavorite ? (
            <BookmarkRoundedIcon sx={{ fontSize: 21, color: "var(--accent)" }} />
        ) : (
            <BookmarkBorderRoundedIcon sx={{ fontSize: 21 }} />
        )}
      </button>

        <div 
          className={[
            "absolute left-4 top-4 z-10",
            "flex max-w-[70%] items-center gap-2 rounded-full",
            "border border-[var(--profile-floating-control-border)]",
            "bg-[var(--profile-floating-control-bg)]",
            "px-2.5 py-2",
            "text-[var(--profile-floating-control-text)]",
            "shadow-[var(--shadow-card)] backdrop-blur-xl",
          ].join(" ")}
        >
          <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[var(--profile-avatar-bg)]">
            {authorImage ? (
              <img
                src={authorImage}
                alt={authorUsername}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[0.7rem] font-bold text-[var(--profile-floating-control-text)]">
                {authorUsername.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <p className="truncate text-xs font-semibold">
            {authorUsername}
          </p>
        </div>  

        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="px-4 pb-4 pt-3">
            <h3 className="line-clamp-1 text-[1rem] font-semibold text-[var(--profile-overlay-text)]">
              {recipe.title}
            </h3>

            <p className="mt-2 line-clamp-1 text-sm text-[var(--profile-overlay-text-secondary)]">
              {recipe.meal} · {recipe.difficulty} ·{" "}
              {formatDuration(recipe.durationMinutes)}
            </p>

            <div className="mt-4 flex items-center pt-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[var(--accent)]">
                  <StarRoundedIcon sx={{ fontSize: 18 }} />
                  <span className="text-sm font-semibold text-[var(--profile-overlay-text)]">
                    {rating.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[var(--profile-overlay-text-secondary)]">
                  <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 17 }} />
                  <span className="text-sm font-semibold">
                    {formatCompactNumber(commentsCount)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[var(--profile-overlay-text-secondary)]">
                  <BookmarkRoundedIcon sx={{ fontSize: 17 }} />
                  <span className="text-sm font-semibold">
                    {formatCompactNumber(savesCount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>     
    </motion.article>
  )
}
