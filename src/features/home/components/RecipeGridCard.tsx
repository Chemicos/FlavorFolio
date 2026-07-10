import StarRoundedIcon from "@mui/icons-material/StarRounded"
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded"
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded"

import { Recipe, SavedRecipe } from "../types"
import { CurrentUserCardData } from "../types/recipeCard.types"
import { useRecipeCardActions } from "../hooks/useRecipeCardActions"
import { CircularProgress } from "@mui/material"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"

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
    // const isSaved = savedRecipes.some(
    //     (savedRecipe) => savedRecipe.recipeId === recipeId
    // )

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

    const commentsCount = Number(
        recipe.stats?.commentsCount ?? recipe.commentsCount ?? 0
    )

    const savesCount = Number(
        recipe.stats?.savesCount ?? recipe.savesCount ?? 0
    )

    const authorUsername =
        recipe.author?.username || recipe.user || recipe.username || "Unknown"

    const authorImage =
        recipe.author?.profileImage || recipe.userProfileImage || ""

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
    <article
      onClick={handleCardClick}
      className="group relative h-[370px] cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-black shadow-[0_18px_55px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-1 hover:border-white/15"
    >
      <img
        src={recipe.image}
        alt={recipe.title}
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/70 via-black/50 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <button
        type="button"
        onClick={handleFavoriteClick}
        data-no-card-click
        disabled={isFavoriteLoading}
        className={[
            "absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-xl transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
            isFavorite
            ? "bg-[#0b0b0c]/20 text-[#feaa2b] hover:bg-[#0b0b0c]/80"
            : "bg-[#0b0b0c]/20 text-white hover:bg-[#0b0b0c]/80",
        ].join(" ")}
        aria-label={isFavorite ? "Unsave recipe" : "Save recipe"}
      >
        {isFavoriteLoading ? (
            <CircularProgress size={18} sx={{ color: "#feaa2b" }} />
        ) : isFavorite ? (
            <BookmarkRoundedIcon sx={{ fontSize: 21 }} />
        ) : (
            <BookmarkBorderRoundedIcon sx={{ fontSize: 21 }} />
        )}
      </button>

      <div className="absolute left-4 top-4 z-10 flex max-w-[70%] items-center gap-2 rounded-full border border-white/10 bg-[#0b0b0c]/20 px-2.5 py-2 backdrop-blur-xl">
        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#0b0b0c]/10">
          {authorImage ? (
            <img
              src={authorImage}
              alt={authorUsername}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[0.7rem] font-bold text-white">
              {authorUsername.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <p className="truncate text-xs font-semibold text-white">
          by {authorUsername}
        </p>
      </div>  

      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="px-4 pb-4 pt-3">
          <h3 className="line-clamp-1 text-[1rem] font-semibold text-white">
            {recipe.title}
          </h3>

          <p className="mt-2 line-clamp-1 text-sm text-[#a8b3cf]">
            {recipe.meal} · {recipe.difficulty} ·{" "}
            {formatDuration(recipe.durationMinutes)}
          </p>

          <div className="mt-4 flex items-center pt-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-amber-300">
                <StarRoundedIcon sx={{ fontSize: 18 }} />
                <span className="text-sm font-semibold text-[#f8d36b]">
                  {rating.toFixed(1)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[#a8b3cf]">
                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 17 }} />
                <span className="text-sm font-semibold">
                  {formatCompactNumber(commentsCount)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[#a8b3cf]">
                <BookmarkRoundedIcon sx={{ fontSize: 17 }} />
                <span className="text-sm font-semibold">
                  {formatCompactNumber(savesCount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
