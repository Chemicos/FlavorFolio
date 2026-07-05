import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"

import { AdminDashboardTopRecipe } from "../types/adminDashboard.types";
import { useNavigate } from "react-router-dom";

export default function AdminDashboardTopRecipes({recipes}: {recipes: AdminDashboardTopRecipe[]}) {
  const navigate = useNavigate()
  return (
    <div className="space-y-3">
      {recipes.map((recipe, index) => (
        <button
          key={recipe.recipeId}
          type="button"
          onClick={() => navigate(`/admin/recipes?recipeId=${recipe.recipeId}`)}
          className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] p-2 text-left transition hover:bg-white/[0.06] active:scale-[0.99]"
        >
          <span className="w-5 text-sm text-[#a8b3cf]">{index + 1}</span>

          <div className="h-11 w-11 overflow-hidden rounded-lg bg-white/10">
            {recipe.image && (
              <img
                src={recipe.image}
                alt={recipe.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{recipe.title}</p>
            <p className="truncate text-xs text-[#8f97b1]">
              by {recipe.authorUsername}
            </p>
          </div>

          <div className="flex items-center gap-1 text-sm font-semibold text-[#feaa2b]">
            {recipe.savesCount}
            <BookmarkRoundedIcon sx={{ fontSize: 17 }} />
          </div>
        </button>
      ))}
    </div>
  )
}
