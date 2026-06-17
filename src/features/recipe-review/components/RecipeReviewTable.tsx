import { ReviewRecipe } from "../types/recipeReview.types";
import RecipeReviewTableRow from "./RecipeReviewTableRow";
import { useMemo, useState } from "react";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import { Skeleton } from "@mui/material";

interface RecipeReviewTableProps {
  recipes: ReviewRecipe[]
  selectedIds: string[]
  isLoading: boolean
  onToggleRecipe: (recipeId: string) => void
  onViewRecipe: (recipe: ReviewRecipe) => void
  activeRecipeId?: string | null
}

const columns = [
  { key: "select", label: "", width: 56, minWidth: 56, resizable: false, sortable: false },
  { key: "title", label: "Title", width: 240, minWidth: 160, resizable: true, sortable: true },
  { key: "description", label: "Description", width: 320, minWidth: 180, resizable: true, sortable: true },
  { key: "createdAt", label: "Created At", width: 150, minWidth: 120, resizable: true, sortable: true },
  { key: "createdBy", label: "Created By", width: 190, minWidth: 150, resizable: true, sortable: true },
  { key: "difficulty", label: "Difficulty", width: 130, minWidth: 105, resizable: true, sortable: true },
  { key: "cuisine", label: "Cuisine", width: 130, minWidth: 105, resizable: true, sortable: true },
  { key: "duration", label: "Duration", width: 120, minWidth: 100, resizable: true, sortable: true },
  { key: "steps", label: "Steps", width: 90, minWidth: 75, resizable: true, sortable: true },
  { key: "actions", label: "", width: 70, minWidth: 70, resizable: false, sortable: false },
]

export default function RecipeReviewTable({
  recipes,
  selectedIds,
  isLoading,
  onToggleRecipe,
  onViewRecipe,
  activeRecipeId,
}: RecipeReviewTableProps) {
  type SortKey =
    | "title"
    | "description"
    | "createdAt"
    | "createdBy"
    | "difficulty"
    | "cuisine"
    | "duration"
    | "steps"

  type SortDirection = "asc" | "desc" | null

  type SortState = {
    key: SortKey | null
    direction: SortDirection
  }


  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    Object.fromEntries(columns.map((column) => [column.key, column.width]))
  )

  const [sort, setSort] = useState<SortState>({key: null, direction: null})

  const handleResizeStart = (
    event: React.MouseEvent<HTMLDivElement>,
    columnKey: string,
    minWidth: number
  ) => {
    event.preventDefault()

    const startX = event.clientX
    const startWidth = columnWidths[columnKey]

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.max(minWidth, startWidth + moveEvent.clientX - startX)

      setColumnWidths((prev) => ({
        ...prev,
        [columnKey]: nextWidth,
      }))
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const getSortValue = (recipe: ReviewRecipe, key: SortKey) => {
    switch (key) {
      case "title":
        return recipe.title || ""

      case "description":
        return recipe.description || ""

      case "createdAt":
        return recipe.createdAt?.seconds || 0

      case "createdBy":
        return recipe.author?.username || recipe.user || ""

      case "difficulty":
        return recipe.difficulty || ""

      case "cuisine":
        return recipe.cuisine || ""

      case "duration":
        return Number(recipe.durationMinutes || 0)

      case "steps":
        return recipe.cookingSteps?.length || 0

      default:
        return ""
    }
  }

  const handleToggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" }
      }

      if (prev.direction === "asc") {
        return { key, direction: "desc" }
      }

      return { key: null, direction: null }
    })
  }

  const displayedRecipes = useMemo(() => {
    if (!sort.key || !sort.direction) return recipes

    return [...recipes].sort((a, b) => {
      const firstValue = getSortValue(a, sort.key!)
      const secondValue = getSortValue(b, sort.key!)

      if (typeof firstValue === "number" && typeof secondValue === "number") {
        return sort.direction === "asc"
          ? firstValue - secondValue
          : secondValue - firstValue
      }

      return sort.direction === "asc"
        ? String(firstValue).localeCompare(String(secondValue))
        : String(secondValue).localeCompare(String(firstValue))
    })
  }, [recipes, sort])
  
  function RecipeReviewTableSkeleton() {
    return (
      <tbody>
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column, columnIndex) => (
              <td
                key={column.key}
                className={[
                  "bg-[#0b0b0c] px-4 py-4",
                  columnIndex === 0 ? "rounded-l-lg" : "",
                  columnIndex === columns.length - 1 ? "rounded-r-xl" : "",
                ].join(" ")}
              >
                <Skeleton
                  variant={column.key === "select" ? "circular" : "rounded"}
                  width={
                    column.key === "select"
                      ? 22
                      : column.key === "actions"
                      ? 24
                      : "75%"
                  }
                  height={column.key === "select" || column.key === "actions" ? 22 : 18}
                  sx={{
                    bgcolor: "rgba(168,179,207,0.10)",
                    borderRadius: column.key === "select" ? "999px" : "8px",
                  }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    )
  }

  if (!isLoading && !recipes.length) {
    return (
      <div className="mt-10 rounded-2xl border border-white/10 bg-[#0b0b0c]/60 p-10 text-center">
        <h3 className="text-lg font-semibold text-white">No pending recipes</h3>
        <p className="mt-2 text-sm text-[#8f97b1]">
          There are no recipes waiting for review right now.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
        <table
          className="w-full border-separate border-spacing-y-[6px]"
          style={{
            minWidth: Object.values(columnWidths).reduce((sum, width) => sum + width, 0),
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            {columns.map((column) => (
              <col
                key={column.key}
                style={{ width: columnWidths[column.key] }}
              />
            ))}
          </colgroup>

          <thead className="sticky top-0 z-20 bg-[#16181d]">
            <tr className="text-left text-sm font-semibold text-[#a8b3cf]">
              {columns.map((column) => (
                <th key={column.key} className="group relative px-4 py-3">
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleToggleSort(column.key as SortKey)}
                      className={[
                        "flex min-w-0 items-center gap-1 truncate pr-2 transition-colors hover:text-white",
                        sort.key === column.key ? "text-white" : "",
                      ].join(" ")}
                    >
                      <span className="truncate">{column.label}</span>

                      <KeyboardArrowDownRoundedIcon
                        sx={{ fontSize: 18 }}
                        className={[
                          "shrink-0 transition",
                          sort.key === column.key && sort.direction === "asc" ? "rotate-180" : "",
                          sort.key === column.key ? "opacity-100" : "opacity-40",
                        ].join(" ")}
                      />
                    </button>
                  ) : (
                    <div className="truncate pr-2 transition-colors group-hover:text-white">
                      {column.label}
                    </div>
                  )}

                  {column.resizable && (
                    <div
                      onMouseDown={(event) =>
                        handleResizeStart(event, column.key, column.minWidth)
                      }
                      className="absolute right-[-8px] top-0 bottom-0 w-5 cursor-col-resize before:absolute before:left-1/2 before:top-2 before:bottom-2 before:w-px before:-translate-x-1/2 before:bg-white/20 hover:before:w-[3px] hover:before:bg-orange-400/60"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {isLoading ? (
            <RecipeReviewTableSkeleton />
          ) : (
            <tbody>
              {displayedRecipes.map((recipe) => (
                <RecipeReviewTableRow
                  key={recipe.recipeId}
                  recipe={recipe}
                  isSelected={selectedIds.includes(recipe.recipeId)}
                  isActive={activeRecipeId === recipe.recipeId}
                  onToggle={() => onToggleRecipe(recipe.recipeId)}
                  onView={() => onViewRecipe(recipe)}
                />
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  )
}
