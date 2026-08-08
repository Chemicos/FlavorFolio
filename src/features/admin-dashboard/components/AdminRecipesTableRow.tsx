import { Checkbox, Tooltip } from "@mui/material"
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar"
import StarRoundedIcon from "@mui/icons-material/StarRounded"
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded"
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"

import { AdminRecipeRow } from "../types/adminRecipes.types"
import { AdminRecipesTableColumn } from "./AdminRecipesTable"

interface AdminRecipesTableRowProps {
  recipe: AdminRecipeRow
  columns: AdminRecipesTableColumn[]
  isSelected: boolean
  isActive?: boolean
  onToggle: () => void
  onView: () => void
}

const viewTooltipProps = {
  tooltip: {
    sx: {
      bgcolor: "var(--tooltip-bg)",
      color: "var(--tooltip-text)",
      fontSize: "0.75rem",
      border: "1px solid var(--tooltip-border)",
      backdropFilter: "blur(12px)",
      boxShadow: "var(--shadow-dropdown)",
      px: 1.2,
      py: 0.7,
    },
  },
  arrow: {
    sx: {
      color: "var(--tooltip-bg)",
      "&:before": {
        border: "1px solid var(--tooltip-border)",
      },
    },
  },
}

function formatDate(ms: number) {
  if (!ms) return "-"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(ms))
}

function getStatusClass(status: string) {
  if (status === "published") {
    return "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]"
  }

  if (status === "pending") {
    return "border-[var(--info-border)] bg-[var(--info-soft)] text-[var(--info-text)]"
  }

  return "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]"
}

function getStatusLabel(status: string) {
  if (status === "needs_revision") return "Needs Revision"
  if (status === "pending") return "Pending"
  return "Published"
}



export default function AdminRecipesTableRow({
    recipe,
    columns,
    isSelected,
    isActive = false,
    onToggle,
    onView,
}: AdminRecipesTableRowProps) {
    const cellClassName = [
        "px-4 py-3 transition-colors",
        isActive
        ? "bg-[var(--table-row-active)]"
        : isSelected
            ? "bg-[var(--table-row-selected)]"
            : "bg-[var(--table-row-bg)] group-hover:bg-[var(--table-row-hover)]",
    ].join(" ")

    const renderCell = (key: AdminRecipesTableColumn["key"]) => {
        switch (key) {
        case "select":
            return (
            <Checkbox
                checked={isSelected}
                onChange={onToggle}
                size="small"
                sx={{
                  padding: 0,
                  color: "var(--text-muted)",
                  "&.Mui-checked": { color: "var(--accent)" },
                  "& .MuiSvgIcon-root": { fontSize: 22 },
                }}
            />
            )

        case "title":
            return (
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {recipe.title}
                    </p>
                    <p className="truncate text-xs capitalize text-[var(--text-muted)]">
                    {recipe.cuisine} · {recipe.difficulty}
                    </p>
                </div>
            )

        case "author":
            return (
            <span className="truncate text-sm text-[var(--text-secondary)]">
                {recipe.authorUsername}
            </span>
            )

        case "status":
            return (
            <span
                className={[
                "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                getStatusClass(recipe.status),
                ].join(" ")}
            >
                {getStatusLabel(recipe.status)}
            </span>
            )

        case "meal":
            return (
            <span className="text-sm capitalize text-[var(--text-secondary)]">
                {recipe.meal}
            </span>
            )

        case "stats":
            return (
                <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 text-[var(--accent-text)]">
                    <StarRoundedIcon sx={{ fontSize: 17 }} />
                    {recipe.averageRating.toFixed(1)}
                </span>

                <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 16 }} />
                    {recipe.commentsCount}
                </span>

                <span className="inline-flex items-center gap-1 text-[var(--accent)]">
                    <BookmarkRoundedIcon sx={{ fontSize: 16 }} />
                    {recipe.savesCount}
                </span>
                </div>
            )

        case "updatedAt":
            return (
            <span className="text-sm text-[var(--text-muted)]">
                {formatDate(recipe.updatedAtMs)}
            </span>
            )

        case "actions":
            return (
            <div className="flex justify-end overflow-hidden">
                <Tooltip
                    title="View recipe"
                    arrow
                    placement="top"
                    slotProps={viewTooltipProps}
                >
                <button
                    type="button"
                    onClick={onView}
                    className={[
                      "inline-flex translate-x-3 items-center justify-center",
                      "text-[var(--text-secondary)] opacity-0",
                      "transition-all duration-200 ease-out",
                      "hover:text-[var(--text-primary)]",
                      "active:scale-95",
                      "group-hover:translate-x-0 group-hover:opacity-100",
                    ].join(" ")}
                >
                    <ViewSidebarIcon sx={{ fontSize: 24 }} />
                </button>
                </Tooltip>
            </div>
            )

        default:
            return null
        }
    }
  return (
    <tr className="group transition-all">
      {columns.map((column, index) => (
        <td
          key={column.key}
          className={[
            cellClassName,
            index === 0 ? "rounded-l-lg" : "",
            index === columns.length - 1 ? "rounded-r-xl" : "",
            column.key === "select"
              ? "sticky left-0 z-10 backdrop-blur-xl"
              : "",
            column.key === "actions"
              ? "sticky right-0 z-10 text-right backdrop-blur-xl"
              : "",
          ].join(" ")}
        >
          {renderCell(column.key)}
        </td>
      ))}
    </tr>
  )
}
