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
      bgcolor: "#0b0b0c",
      color: "#d7def0",
      fontSize: "0.75rem",
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(12px)",
      boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
      px: 1.2,
      py: 0.7,
    },
  },
  arrow: {
    sx: {
      color: "#0b0b0c",
      "&:before": {
        border: "1px solid rgba(255,255,255,0.08)",
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
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
  }

  if (status === "pending") {
    return "border-violet-400/20 bg-violet-500/10 text-violet-300"
  }

  return "border-orange-400/20 bg-orange-500/10 text-orange-200"
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
        ? "bg-[#202636]"
        : isSelected
            ? "bg-[#161b24]"
            : "bg-[#0b0b0c] group-hover:bg-[#202429]",
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
                color: "rgba(168,179,207,0.75)",
                "&.Mui-checked": { color: "#a8b3cf" },
                "& .MuiSvgIcon-root": { fontSize: 22 },
                }}
            />
            )

        case "title":
            return (
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                    {recipe.title}
                    </p>
                    <p className="truncate text-xs capitalize text-[#8f97b1]">
                    {recipe.cuisine} · {recipe.difficulty}
                    </p>
                </div>
            )

        case "author":
            return (
            <span className="truncate text-sm text-[#a8b3cf]">
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
            <span className="text-sm capitalize text-[#a8b3cf]">
                {recipe.meal}
            </span>
            )

        case "stats":
            return (
                <div className="flex items-center gap-3 text-sm text-[#a8b3cf]">
                <span className="inline-flex items-center gap-1 text-[#f8d36b]">
                    <StarRoundedIcon sx={{ fontSize: 17 }} />
                    {recipe.averageRating.toFixed(1)}
                </span>

                <span className="inline-flex items-center gap-1 text-[#a8b3cf]">
                    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 16 }} />
                    {recipe.commentsCount}
                </span>

                <span className="inline-flex items-center gap-1 text-[#feaa2b]">
                    <BookmarkRoundedIcon sx={{ fontSize: 16 }} />
                    {recipe.savesCount}
                </span>
                </div>
            )

        case "updatedAt":
            return (
            <span className="text-sm text-[#8f97b1]">
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
                    className="inline-flex translate-x-3 items-center justify-center text-[#a8b3cf] opacity-0 transition-all duration-200 ease-out hover:text-white active:scale-95 group-hover:translate-x-0 group-hover:opacity-100"
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
