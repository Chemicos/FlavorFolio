import { RecipeIngredient } from "../../types"

import LunchDiningRoundedIcon from "@mui/icons-material/LunchDiningRounded"

interface ViewRecipeIngredientsProps {
    ingredients: RecipeIngredient[]
}

export default function ViewRecipeIngredients({ingredients}: ViewRecipeIngredientsProps) {
  return (
    <div className="mt-4">
        <div className="flex items-center gap-3">
            <LunchDiningRoundedIcon sx={{ fontSize: 20, color: "var(--text-primary)" }} />
            <h2 className="text-[1.2rem] font-bold text-[var(--text-primary)]">
                Ingredients ({ingredients.length})
            </h2>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-l-[1px] border-[var(--border-strong)] pl-4">
            {ingredients.map((ingredient, index) => {
                const quantity = ingredient?.quantity ? String(ingredient.quantity) : ""
                const unit = ingredient?.unit || ""
                const amountLabel = [quantity, unit].filter(Boolean).join(" ").trim()

                return (
                    <div
                        key={`${ingredient?.ingredient || "ingredient"}-${index}`}
                        className="flex items-center gap-3"
                    >
                    <div className="shrink-0 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)]">
                        {amountLabel || "-"}
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-[0.98rem] text-[var(--text-primary)]">
                        {ingredient?.ingredient || "Unknown ingredient"}
                        </p>
                    </div>
                    </div>
                )
            })}
        </div>
    </div>
  )
}
