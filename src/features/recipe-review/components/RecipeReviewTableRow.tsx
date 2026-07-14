import ViewSidebarIcon from '@mui/icons-material/ViewSidebar'

import Checkbox from "@mui/material/Checkbox"
import Tooltip from "@mui/material/Tooltip"

import { ReviewRecipe } from "../types/recipeReview.types"
import { RecipeReviewTableColumn } from './RecipeReviewTable'
import { useEffect, useRef, useState } from 'react'

interface RecipeReviewTableRowProps {
  recipe: ReviewRecipe
  columns: RecipeReviewTableColumn[]
  isSelected: boolean
  onToggle: () => void
  onView: () => void
  isActive?: boolean
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

function formatCreatedAt(value: any) {
  if (!value?.seconds) return "-"

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value.seconds * 1000))
}

function TruncatedTooltipText({
  children,
  className = "",
}: {
  children: string
  className?: string
}) {
  const textRef = useRef<HTMLSpanElement | null>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  useEffect(() => {
    const element = textRef.current
    if (!element) return

    const checkTruncation = () => {
      setIsTruncated(element.scrollWidth > element.clientWidth)
    }

    checkTruncation()

    const resizeObserver = new ResizeObserver(checkTruncation)
    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [children])

  return (
    <Tooltip
      title={isTruncated ? children : ""}
      arrow
      placement="top"
      disableHoverListener={!isTruncated}
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 360,
            bgcolor: "#0b0b0c",
            color: "#d7def0",
            fontSize: "0.75rem",
            lineHeight: 1.6,
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            padding: "0.5rem"
          },
        },
        arrow: {
          sx: {
            color: "#0b0b0c",
          },
        },
      }}
    >
      <span ref={textRef} className={`block truncate ${className}`}>
        {children}
      </span>
    </Tooltip>
  )
}

export default function RecipeReviewTableRow({
  recipe,
  columns,
  isSelected,
  onToggle,
  onView,
  isActive = false,
}: RecipeReviewTableRowProps) {
  const stepsCount = recipe.cookingSteps?.length || 0

  const cellClassName = [
    "px-4 py-2 transition-colors",
     isActive
      ? "bg-[#202636]"
      : isSelected
        ? "bg-[#161b24]"
        : "bg-[#0b0b0c] group-hover:bg-[#202429]",
  ].join(" ")

  const renderCell = (key: RecipeReviewTableColumn["key"]) => {
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
          <TruncatedTooltipText className="truncate text-sm font-medium text-[#d7def0]">
            {recipe.title || "Untitled recipe"}
          </TruncatedTooltipText>
        )

      case "description":
        return (
          <TruncatedTooltipText className="truncate text-sm text-[#a8b3cf]">
            {recipe.description || "No description"}
          </TruncatedTooltipText>
        )

      case "createdAt":
        return (
          <span className="text-sm text-[#a8b3cf]">
            {formatCreatedAt(recipe.createdAt)}
          </span>
        )

      case "createdBy":
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10">
              {recipe.author?.profileImage ? (
                <img
                  src={recipe.author.profileImage}
                  alt={recipe.author?.username || "Author"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
                  {(recipe.author?.username || recipe.user || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <span className="truncate text-sm text-[#a8b3cf]">
              {recipe.author?.username || recipe.user || "Unknown"}
            </span>
          </div>
        )

      case "difficulty":
        return (
          <span className="text-sm capitalize text-[#a8b3cf]">
            {recipe.difficulty || "-"}
          </span>
        )

      case "cuisine":
        return (
          <span className="text-sm capitalize text-[#a8b3cf]">
            {recipe.cuisine || "-"}
          </span>
        )

      case "duration":
        return (
          <span className="text-sm text-[#a8b3cf]">
            {recipe.durationMinutes ? `${recipe.durationMinutes} min` : "-"}
          </span>
        )

      case "steps":
        return (
          <span className="text-sm text-[#a8b3cf]">
            {stepsCount}
          </span>
        )

      case "ingredients":
        return (
          <span className="text-sm text-[#a8b3cf]">
            {recipe.ingredients?.length || 0}
          </span>
        )

      case "servings":
        return (
          <span className="text-sm text-[#a8b3cf]">
            {recipe.servings || "-"}
          </span>
        )

      case "meal":
        return (
          <span className="text-sm capitalize text-[#a8b3cf]">
            {recipe.meal || "-"}
          </span>
        )

      case "visibility":
        return (
          <span className="text-sm capitalize text-[#a8b3cf]">
            {recipe.visibility || "-"}
          </span>
        )

      case "actions":
        return (
          <div className="flex justify-end overflow-hidden">

            <Tooltip
              title="View submission"
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
