import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"

import { AdminDashboardTopRecipe } from "../types/adminDashboard.types";
import { useNavigate } from "react-router-dom";

export default function AdminDashboardTopRecipes({recipes}: {recipes: AdminDashboardTopRecipe[]}) {
  const navigate = useNavigate()

  if (!recipes.length) {
    return (
      <p className="rounded-xl bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-muted)]">
        No saved recipes available.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {recipes.map((recipe, index) => (
        <button
          key={recipe.recipeId}
          type="button"
          onClick={() => navigate(`/admin/recipes?recipeId=${recipe.recipeId}`)}
          className={[
            "flex w-full items-center gap-3 rounded-xl p-2 text-left",
            "bg-[var(--surface-subtle)] transition",
            "hover:bg-[var(--surface-hover)]",
            "active:scale-[0.99]",
          ].join(" ")}
        >
          <span className="w-5 text-sm text-[var(--text-secondary)]">{index + 1}</span>

          <div className="h-11 w-11 overflow-hidden rounded-lg bg-[var(--surface-muted)]">
            {recipe.image && (
              <img
                src={recipe.image}
                alt={recipe.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{recipe.title}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">
              by {recipe.authorUsername}
            </p>
          </div>

          <div className="flex items-center gap-1 text-sm font-semibold text-[var(--accent)]">
            {recipe.savesCount}
            <BookmarkRoundedIcon sx={{ fontSize: 17 }} />
          </div>
        </button>
      ))}
    </div>
  )
}
