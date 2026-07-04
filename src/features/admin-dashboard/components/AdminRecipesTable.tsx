import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import { Skeleton } from "@mui/material"
import { useEffect, useMemo, useState } from "react"
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
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type { AdminRecipeRow } from "../types/adminRecipes.types"
import AdminRecipesTableRow from "./AdminRecipesTableRow"


export type AdminRecipeColumnKey =
  | "select"
  | "title"
  | "author"
  | "status"
  | "meal"
  | "stats"
  | "updatedAt"
  | "actions"

export interface AdminRecipesTableColumn {
  key: AdminRecipeColumnKey
  label: string
  width: number
  minWidth: number
  resizable: boolean
  sortable: boolean
  draggable: boolean
}

type SortKey = Exclude<AdminRecipeColumnKey, "select" | "actions">
type SortDirection = "asc" | "desc" | null

const defaultColumns: AdminRecipesTableColumn[] = [
  { key: "select", label: "", width: 56, minWidth: 56, resizable: false, sortable: false, draggable: false },
  { key: "title", label: "Recipe", width: 360, minWidth: 240, resizable: true, sortable: true, draggable: true },
  { key: "author", label: "Author", width: 190, minWidth: 150, resizable: true, sortable: true, draggable: true },
  { key: "status", label: "Status", width: 160, minWidth: 130, resizable: true, sortable: true, draggable: true },
  { key: "meal", label: "Meal", width: 140, minWidth: 110, resizable: true, sortable: true, draggable: true },
  { key: "stats", label: "Stats", width: 210, minWidth: 160, resizable: true, sortable: true, draggable: true },
  { key: "updatedAt", label: "Updated", width: 160, minWidth: 130, resizable: true, sortable: true, draggable: true },
  { key: "actions", label: "", width: 70, minWidth: 70, resizable: false, sortable: false, draggable: false },
]

interface Props {
  recipes: AdminRecipeRow[]
  selectedIds: string[]
  isLoading: boolean
  activeRecipeId?: string | null
  onToggleRecipe: (recipeId: string) => void
  onViewRecipe: (recipe: AdminRecipeRow) => void
}

export default function AdminRecipesTable({
  recipes,
  selectedIds,
  isLoading,
  activeRecipeId,
  onToggleRecipe,
  onViewRecipe,
}: Props) {
  const TABLE_PREFS_KEY = "flavorfolio.adminRecipesTablePrefs"

  const savedPrefs = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(TABLE_PREFS_KEY) || "{}")
    } catch {
      return {}
    }
  }, [])

  const [columns, setColumns] = useState(() => {
    const savedOrder = savedPrefs.columnOrder as string[] | undefined
    if (!savedOrder?.length) return [...defaultColumns]

    const byKey = new Map(defaultColumns.map((column) => [column.key, column]))
    const ordered = savedOrder
      .map((key) => byKey.get(key as AdminRecipeColumnKey))
      .filter(Boolean) as AdminRecipesTableColumn[]

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

  const [sort, setSort] = useState<{
    key: SortKey | null
    direction: SortDirection
  }>(() => ({
    key: savedPrefs.sort?.key || "updatedAt",
    direction: savedPrefs.sort?.direction || "desc",
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
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

    const getSortValue = (recipe: AdminRecipeRow, key: SortKey) => {
        switch (key) {
            case "title":
            return recipe.title

            case "author":
            return recipe.authorUsername

            case "status":
            return recipe.status

            case "meal":
            return recipe.meal

            case "stats":
            return recipe.savesCount + recipe.commentsCount + recipe.averageRating

            case "updatedAt":
            return recipe.updatedAtMs

            default:
            return ""
        }
    }

  const handleToggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: "asc" }
      if (prev.direction === "asc") return { key, direction: "desc" }
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
      <div className="h-full overflow-visible">
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
                <col key={column.key} style={{ width: columnWidths[column.key] }} />
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
                          width={column.key === "select" ? 22 : "75%"}
                          height={column.key === "select" ? 22 : 18}
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
            ) : (
              <tbody>
                {displayedRecipes.map((recipe) => (
                  <AdminRecipesTableRow
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

          {!isLoading && !displayedRecipes.length && (
            <div className="py-16 text-center text-sm text-[#8f97b1]">
              No recipes found.
            </div>
          )}
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
  column: AdminRecipesTableColumn
  sort: { key: SortKey | null; direction: SortDirection }
  onSort: (key: SortKey) => void
  onResizeStart: (
    event: React.MouseEvent<HTMLDivElement>,
    columnKey: AdminRecipeColumnKey,
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
          className="absolute bottom-0 right-[-8px] top-0 w-5 cursor-col-resize before:absolute before:bottom-2 before:left-1/2 before:top-2 before:w-px before:-translate-x-1/2 before:bg-white/20 hover:before:w-[3px] hover:before:bg-orange-400/60"
        />
      )}
    </th>
  )
}