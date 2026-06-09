import { RecipeIngredient } from "../../types"

import LunchDiningRoundedIcon from "@mui/icons-material/LunchDiningRounded"

interface ViewRecipeIngredientsProps {
    ingredients: RecipeIngredient[]
}

export default function ViewRecipeIngredients({ingredients}: ViewRecipeIngredientsProps) {
  return (
    <div className="mt-4">
        <div className="flex items-center gap-3">
            <LunchDiningRoundedIcon sx={{ fontSize: 20, color: "#ffffff" }} />
            <h2 className="text-[1.2rem] font-bold text-white">
                Ingredients ({ingredients.length})
            </h2>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-l-[1px] border-[#a8b3cf]/20 pl-4">
            {ingredients.map((ingredient, index) => {
                const quantity = ingredient?.quantity ? String(ingredient.quantity) : ""
                const unit = ingredient?.unit || ""
                const amountLabel = [quantity, unit].filter(Boolean).join(" ").trim()

                return (
                    <div
                        key={`${ingredient?.ingredient || "ingredient"}-${index}`}
                        className="flex items-center gap-3"
                    >
                    <div className="shrink-0 rounded-lg bg-[#0b0b0c] border border-white/[0.10] px-3 py-1.5 text-sm text-[#cbd3ea]">
                        {amountLabel || "-"}
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-[0.98rem] text-white">
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
