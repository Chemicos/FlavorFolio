import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import CheckBoxOutlineBlankRoundedIcon from "@mui/icons-material/CheckBoxOutlineBlankRounded"
import CheckBoxRoundedIcon from "@mui/icons-material/CheckBoxRounded"

import { useEffect, useMemo, useRef, useState } from "react"
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

import type { AdminRecipeRow, AdminRecipeStatus } from "../types/adminRecipes.types"
import AdminRecipesTableRow from "./AdminRecipesTableRow"
import AdminRecipesTableSkeleton from "./skeletons/AdminRecipesTableSkeleton"
import { AnimatePresence, motion } from "motion/react"
import { useDismissibleLayer } from "../../../hooks/useDismissibleLayer"


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
  { key: "status", label: "Status", width: 160, minWidth: 130, resizable: true, sortable: false, draggable: true },
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
  selectedStatuses: AdminRecipeStatus[]
  onStatusFilterChange: (statuses: AdminRecipeStatus[]) => void
}

const STATUS_OPTIONS: {
  value: AdminRecipeStatus
  label: string
  className: string
}[] = [
  {
    value: "published",
    label: "Published",
    className: "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]",
  },
  {
    value: "pending",
    label: "Pending",
    className: "border-[var(--info-border)] bg-[var(--info-soft)] text-[var(--info-text)]",
  },
  {
    value: "needs_revision",
    label: "Needs Revision",
    className: "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]",
  },
]

function StatusFilterHeaderCell({
  column,
  selectedStatuses,
  onStatusFilterChange,
  onResizeStart,
}: {
  column: AdminRecipesTableColumn
  selectedStatuses: AdminRecipeStatus[]
  onStatusFilterChange: (statuses: AdminRecipeStatus[]) => void
  onResizeStart: (
    event: React.MouseEvent<HTMLDivElement>,
    columnKey: AdminRecipeColumnKey,
    minWidth: number
  ) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const safeSelectedStatuses = selectedStatuses ?? []
  const safeOnStatusFilterChange = onStatusFilterChange ?? (() => {})

  useDismissibleLayer({
    isOpen,
    refs: [wrapperRef],
    onDismiss: () => setIsOpen(false)
  })

  const toggleStatus = (status: AdminRecipeStatus) => {
    safeOnStatusFilterChange(
      safeSelectedStatuses.includes(status)
        ? safeSelectedStatuses.filter((item) => item !== status)
        : [...safeSelectedStatuses, status]
    )
  }

  return (
    <th className="relative px-4 py-3">
      <div ref={wrapperRef} className="relative inline-flex">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={[
            "flex min-w-0 items-center gap-1 truncate pr-2 transition-colors hover:text-[var(--text-primary)]",
            safeSelectedStatuses.length ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]",
          ].join(" ")}
        >
          <span className="truncate">{column.label}</span>

          {safeSelectedStatuses.length > 0 && (
            <span className="ml-1 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent-text)]">
              {safeSelectedStatuses.length}
            </span>
          )}

          <KeyboardArrowDownRoundedIcon
            sx={{ fontSize: 18 }}
            className={["transition", isOpen ? "rotate-180 opacity-100" : "opacity-50"].join(" ")}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 top-[calc(100%+10px)] z-[80] w-[230px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--account-dropdown-bg)] p-2 shadow-[var(--shadow-dropdown)]"
            >
              <div className="mb-1 px-2 py-1 text-xs font-semibold text-[var(--text-muted)]">
                Filter by status
              </div>

              {STATUS_OPTIONS.map((option) => {
                const isSelected = safeSelectedStatuses.includes(option.value)

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleStatus(option.value)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-[var(--dropdown-hover)]"
                  >
                    <span className={isSelected ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"}>
                      {isSelected ? (
                        <CheckBoxRoundedIcon sx={{ fontSize: 20 }} />
                      ) : (
                        <CheckBoxOutlineBlankRoundedIcon sx={{ fontSize: 20 }} />
                      )}
                    </span>

                    <span
                      className={[
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                        option.className,
                      ].join(" ")}
                    >
                      {option.label}
                    </span>
                  </button>
                )
              })}

              {safeSelectedStatuses.length > 0 && (
                <button
                  type="button"
                  onClick={() => safeOnStatusFilterChange([])}
                  className="mt-1 w-full rounded-lg px-2 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)]"
                >
                  Clear filter
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {column.resizable && (
        <div
          onMouseDown={(event) =>
            onResizeStart(event, column.key, column.minWidth)
          }
          className="absolute bottom-0 right-[-8px] top-0 w-5 cursor-col-resize before:absolute before:bottom-2 before:left-1/2 before:top-2 before:w-px before:-translate-x-1/2 before:bg-[var(--border-strong)] hover:before:w-[3px] hover:before:bg-[var(--accent)]"
        />
      )}
    </th>
  )
}

export default function AdminRecipesTable({
  recipes,
  selectedIds,
  isLoading,
  activeRecipeId,
  onToggleRecipe,
  onViewRecipe,
  selectedStatuses = [],
  onStatusFilterChange = () => {},
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
        <div className="h-full overflow-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
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

            <thead className="sticky top-0 z-20 bg-[var(--card-bg)]">
              <SortableContext
                items={draggableColumnKeys}
                strategy={horizontalListSortingStrategy}
              >
                <tr className="text-left text-sm font-semibold text-[var(--text-secondary)]">
                  {columns.map((column) => (
                    <SortableHeaderCell
                      key={column.key}
                      column={column}
                      sort={sort}
                      onSort={handleToggleSort}
                      onResizeStart={handleResizeStart}
                      selectedStatuses={selectedStatuses}
                      onStatusFilterChange={onStatusFilterChange}
                    />
                  ))}
                </tr>
              </SortableContext>
            </thead>

            {isLoading ? (
              <AdminRecipesTableSkeleton />
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
            <div className="py-16 text-center text-sm text-[var(--text-muted)]">
              No recipes found.
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeColumn ? (
          <div className="rounded-lg border border-[var(--accent-border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-dropdown)]">
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
  selectedStatuses,
  onStatusFilterChange,
}: {
  column: AdminRecipesTableColumn
  sort: { key: SortKey | null; direction: SortDirection }
  onSort: (key: SortKey) => void
  onResizeStart: (
    event: React.MouseEvent<HTMLDivElement>,
    columnKey: AdminRecipeColumnKey,
    minWidth: number
  ) => void
  selectedStatuses: AdminRecipeStatus[]
  onStatusFilterChange: (statuses: AdminRecipeStatus[]) => void
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

  if (column.key === "status") {
    return (
      <StatusFilterHeaderCell
        column={column}
        selectedStatuses={selectedStatuses}
        onStatusFilterChange={onStatusFilterChange}
        onResizeStart={onResizeStart}
      />
    )
  }

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
        isOver ? "bg-[var(--accent-soft)]" : "",
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
              "flex min-w-0 items-center gap-1 truncate pr-2 transition-colors hover:text-[var(--text-primary)]",
              sort.key === column.key ? "text-[var(--text-primary)]" : "",
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
          <div className="truncate pr-2 transition-colors group-hover:text-[var(--text-primary)]">
            {column.label}
          </div>
        )}
      </div>

      {column.resizable && (
        <div
          onMouseDown={(event) =>
            onResizeStart(event, column.key, column.minWidth)
          }
          className="absolute bottom-0 right-[-8px] top-0 w-5 cursor-col-resize before:absolute before:bottom-2 before:left-1/2 before:top-2 before:w-px before:-translate-x-1/2 before:bg-[var(--border-strong)] hover:before:w-[3px] hover:before:bg-[var(--accent)]"
        />
      )}
    </th>
  )
}