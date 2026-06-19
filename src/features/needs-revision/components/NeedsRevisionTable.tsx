import { Skeleton } from "@mui/material"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"

import { NeedsRevisionRecipe } from "../types/needsRevision.types"

import { useMemo, useState } from "react"
import NeedsRevisionTableRow from "./NeedsRevisionTableRow"
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface NeedsRevisionTableProps {
  recipes: NeedsRevisionRecipe[]
  selectedIds: string[]
  isLoading: boolean
  activeRecipeId?: string | null
  onToggleRecipe: (recipeId: string) => void
  onViewRecipe: (recipe: NeedsRevisionRecipe) => void
}

const defaultColumns: NeedsRevisionTableColumn[] = [
  { key: "select", label: "", width: 56, minWidth: 56, sortable: false, resizable: false, draggable: false },
  { key: "title", label: "Title", width: 260, minWidth: 180, sortable: true, resizable: true, draggable: true },
  { key: "reason", label: "Revision reason", width: 220, minWidth: 160, sortable: true, resizable: true, draggable: true },
  { key: "description", label: "Description feedback", width: 220, minWidth: 200, sortable: true, resizable: true, draggable: true },
  { key: "ingredients", label: "Ingredients feedback", width: 300, minWidth: 200, sortable: true, resizable: true, draggable: true },
  { key: "steps", label: "Steps feedback", width: 300, minWidth: 200, sortable: true, resizable: true, draggable: true },
  { key: "updatedAt", label: "Updated At", width: 150, minWidth: 120, sortable: true, resizable: true, draggable: true },
  { key: "visibility", label: "Visibility", width: 120, minWidth: 110, sortable: true, resizable: true, draggable: true},
  { key: "actions", label: "", width: 70, minWidth: 70, sortable: false, resizable: false, draggable: false },
] as const

type ColumnKey =
  | "select"
  | "title"
  | "reason"
  | "description"
  | "ingredients"
  | "steps"
  | "updatedAt"
  | "visibility"
  | "actions"

export interface NeedsRevisionTableColumn {
  key: ColumnKey
  label: string
  width: number
  minWidth: number
  sortable: boolean
  resizable: boolean
  draggable: boolean
}

type SortKey = Exclude<NeedsRevisionTableColumn["key"], "actions">
type SortDirection = "asc" | "desc" | null

export default function NeedsRevisionTable({
    recipes,
    selectedIds,
    isLoading,
    activeRecipeId,
    onToggleRecipe,
    onViewRecipe,
}: NeedsRevisionTableProps) {
    const [columns, setColumns] = useState([...defaultColumns])
    const [activeColumnKey, setActiveColumnKey] = useState<string | null>(null)

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
      Object.fromEntries(defaultColumns.map((column) => [column.key, column.width]))
    )

    const [sort, setSort] = useState<{ key: SortKey | null; direction: SortDirection }>({
        key: null,
        direction: null,
    })

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8,
        },
      })
    )

    const draggableColumnKeys = columns.filter((column) => column.draggable).map((column) => column.key)

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
      columnKey: ColumnKey,
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

    const getSortValue = (recipe: NeedsRevisionRecipe, key: SortKey) => {
        switch (key) {
        case "title":
            return recipe.title || ""
        case "reason":
            return recipe.denialFeedback?.reasonLabel || recipe.denialFeedback?.reason || ""
        case "description":
            return recipe.reviewFeedback?.description?.message || ""
        case "ingredients":
            return recipe.reviewFeedback?.ingredients?.message || ""
        case "steps":
            return recipe.reviewFeedback?.steps?.message || ""
        case "updatedAt":
            return recipe.updatedAt?.seconds || 0
        case "visibility":
            return recipe.visibility || ""
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

    if (!isLoading && !recipes.length) {
        return (
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b0b0c]/60 p-10 text-center">
            <h3 className="text-lg font-semibold text-white">No recipes need revision</h3>
            <p className="mt-2 text-sm text-[#8f97b1]">
                You don't have recipes waiting for changes right now.
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
                {Array.from({ length: 12 }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column, columnIndex) => (
                      <td
                        key={column.key}
                        className={[
                          "bg-[#0b0b0c] px-4 py-3",
                          columnIndex === 0 ? "rounded-l-lg" : "",
                          columnIndex === columns.length - 1 ? "rounded-r-xl" : "",
                        ].join(" ")}
                      >
                        <Skeleton
                          variant="rounded"
                          width={column.key === "actions" ? 24 : "75%"}
                          height={18}
                          sx={{
                            bgcolor: "rgba(168,179,207,0.10)",
                            borderRadius: "8px",
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
                  <NeedsRevisionTableRow
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
  column: NeedsRevisionTableColumn
  sort: { key: SortKey | null; direction: SortDirection }
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

  const isSortable = column.sortable && column.key !== "actions"

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