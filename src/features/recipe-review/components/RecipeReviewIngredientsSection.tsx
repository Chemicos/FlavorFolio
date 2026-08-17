import { RecipeIngredient } from "../../home/types"

interface RecipeReviewIngredientsSectionProps {
  ingredients: RecipeIngredient[]
}

export default function RecipeReviewIngredientsSection({
    ingredients,    
}:RecipeReviewIngredientsSectionProps) {
    if (!ingredients.length) {
        return (
            <p className="mt-3 text-sm text-[var(--text-muted)]">No ingredients added yet.</p>
        )
    }


  return (
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
            <div
              className={[
                "shrink-0 rounded-lg border px-3 py-1.5",
                "border-[var(--border)]",
                "bg-[var(--surface-muted)]",
                "text-sm font-medium text-[var(--text-secondary)]",
                "transition-colors",
                "group-hover:border-[var(--border-strong)]",
              ].join(" ")}
            >
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
  )
}
