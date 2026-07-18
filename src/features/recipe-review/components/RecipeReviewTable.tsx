import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import { Skeleton } from "@mui/material";

import { ReviewRecipe } from "../types/recipeReview.types";
import RecipeReviewTableRow from "./RecipeReviewTableRow";
import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable,} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface RecipeReviewTableProps {
  recipes: ReviewRecipe[]
  selectedIds: string[]
  isLoading: boolean
  onToggleRecipe: (recipeId: string) => void
  onViewRecipe: (recipe: ReviewRecipe) => void
  activeRecipeId?: string | null
}

export interface RecipeReviewTableColumn {
  key: ColumnKey
  label: string
  width: number
  minWidth: number
  resizable: boolean
  sortable: boolean
  draggable: boolean
}
const defaultColumns: RecipeReviewTableColumn[] =[
  { key: "select", label: "", width: 56, minWidth: 56, resizable: false, sortable: false, draggable: false },
  { key: "title", label: "Title", width: 240, minWidth: 160, resizable: true, sortable: true, draggable: true },
  { key: "description", label: "Description", width: 320, minWidth: 180, resizable: true, sortable: true, draggable: true },
  { key: "createdAt", label: "Created At", width: 150, minWidth: 120, resizable: true, sortable: true, draggable: true },
  { key: "createdBy", label: "Created By", width: 190, minWidth: 150, resizable: true, sortable: true, draggable: true },
  { key: "difficulty", label: "Difficulty", width: 130, minWidth: 105, resizable: true, sortable: true, draggable: true },
  { key: "cuisine", label: "Cuisine", width: 130, minWidth: 105, resizable: true, sortable: true, draggable: true },
  { key: "duration", label: "Duration", width: 120, minWidth: 100, resizable: true, sortable: true, draggable: true },
  { key: "steps", label: "Steps", width: 90, minWidth: 75, resizable: true, sortable: true, draggable: true },
  { key: "ingredients", label: "Ingredients", width: 120, minWidth: 100, resizable: true, sortable: true, draggable: true },
  { key: "servings", label: "Servings", width: 110, minWidth: 90, resizable: true, sortable: true, draggable: true },
  { key: "meal", label: "Meal type", width: 130, minWidth: 105, resizable: true, sortable: true, draggable: true },
  { key: "visibility", label: "Visibility", width: 120, minWidth: 100, resizable: true, sortable: true, draggable: true },
  { key: "actions", label: "", width: 70, minWidth: 70, resizable: false, sortable: false, draggable: false },
]

type ColumnKey =
  | "select"
  | "title"
  | "description"
  | "createdAt"
  | "createdBy"
  | "difficulty"
  | "cuisine"
  | "duration"
  | "steps"
  | "ingredients"
  | "servings"
  | "meal"
  | "visibility"
  | "actions"

type SortKey = Exclude<ColumnKey, "select" | "actions">
type SortDirection = "asc" | "desc" | null
type SortState = {
  key: SortKey | null
  direction: SortDirection
}

export default function RecipeReviewTable({
  recipes,
  selectedIds,
  isLoading,
  onToggleRecipe,
  onViewRecipe,
  activeRecipeId,
}: RecipeReviewTableProps) {
  const TABLE_PREFS_KEY = "flavorfolio.recipeReviewTablePrefs"

  const savedPrefs = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(TABLE_PREFS_KEY) || "{}")
    } catch {
      return {}
    }
  }, [])

  //Local storage sorted table header
  const [columns, setColumns] = useState(() => {
    const savedOrder = savedPrefs.columnOrder as string[] | undefined
    if (!savedOrder?.length) return [...defaultColumns]

    const byKey = new Map(defaultColumns.map((column) => [column.key, column]))
    const ordered = savedOrder
      .map((key) => byKey.get(key as any))
      .filter(Boolean) as RecipeReviewTableColumn[]

    const missing = defaultColumns.filter(
      (column) => !savedOrder.includes(column.key)
    )

    return [...ordered, ...missing]
  })
  const [activeColumnKey, setActiveColumnKey] = useState<string | null>(null)

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => ({
    ...Object.fromEntries(defaultColumns.map((column) => [column.key, column.width])),
    ...(savedPrefs.columnWidths || {}),
  }))

  const [sort, setSort] = useState<{ key: SortKey | null; direction: SortDirection }>(() => ({
    key: savedPrefs.sort?.key || null,
    direction: savedPrefs.sort?.direction || null,
  }))

  useEffect(() => {
    localStorage.setItem(
      TABLE_PREFS_KEY,
      JSON.stringify({
        columnOrder: columns.map((column) => column.key),
        columnWidths,
        sort,
      })
    )
  }, [columns, columnWidths, sort])
  // -------------------------------

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const draggableColumnKeys = columns
    .filter((column) => column.draggable)
    .map((column) => column.key)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveColumnKey(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveColumnKey(null)

    if (!over || active.id === over.id) return

    setColumns((prev) => {
      const oldIndex = prev.findIndex((column) => column.key === active.id)
      const newIndex = prev.findIndex((column) => column.key === over.id)

      const activeColumn = prev[oldIndex]
      const overColumn = prev[newIndex]

      if (!activeColumn?.draggable || !overColumn?.draggable) return prev

      return arrayMove(prev, oldIndex, newIndex)
    })
  }

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

      case "ingredients":
        return recipe.ingredients?.length || 0

      case "servings":
        return Number(recipe.servings || 0)

      case "meal":
        return recipe.meal || ""

      case "visibility":
        return recipe.visibility || ""

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

  const activeColumn = activeColumnKey
    ? columns.find((column) => column.key === activeColumnKey)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
              <SortableContext
                items={draggableColumnKeys}
                strategy={horizontalListSortingStrategy}
              >
                <tr className="text-left text-sm font-semibold text-[#a8b3cf]">
                  {columns.map((column) => (
                    <SortableHeaderCell
                      key={column.key}
                      column={column}
                      sort={sort}
                      onSort={handleToggleSort}
                      onResizeStart={handleResizeStart}
                    />
                  ))}
                </tr>
              </SortableContext>
            </thead>

            {isLoading ? (
              <RecipeReviewTableSkeleton />
            ) : (
              <tbody>
                {displayedRecipes.map((recipe) => (
                  <RecipeReviewTableRow
                    key={recipe.recipeId}
                    recipe={recipe}
                    columns={columns}
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

      <DragOverlay>
        {activeColumn ? (
          <div className="rounded-lg border border-orange-400/30 bg-[#202429] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
            {activeColumn.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function SortableHeaderCell({
  column,
  sort,
  onSort,
  onResizeStart,
}: {
  column: RecipeReviewTableColumn
  sort: SortState
  onSort: (key: SortKey) => void
  onResizeStart: (
    event: React.MouseEvent<HTMLDivElement>,
    columnKey: ColumnKey,
    minWidth: number
  ) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: column.key,
    disabled: !column.draggable,
  })

  const isSortable = column.sortable && column.key !== "select" && column.key !== "actions"

  return (
    <th
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={[
        "group relative px-4 py-3 transition-colors",
        isDragging ? "z-30 opacity-40" : "",
        isOver ? "bg-orange-500/10" : "",
      ].join(" ")}
    >
      <div
        {...attributes}
        {...listeners}
        className={[
          "flex min-w-0 items-center",
          column.draggable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        ].join(" ")}
      >
        {isSortable ? (
          <button
            type="button"
            onClick={() => onSort(column.key as SortKey)}
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
      </div>

      {column.resizable && (
        <div
          onMouseDown={(event) =>
            onResizeStart(event, column.key, column.minWidth)
          }
          className="absolute right-[-8px] top-0 bottom-0 w-5 cursor-col-resize before:absolute before:left-1/2 before:top-2 before:bottom-2 before:w-px before:-translate-x-1/2 before:bg-white/20 hover:before:w-[3px] hover:before:bg-orange-400/60"
        />
      )}
    </th>
  )
}