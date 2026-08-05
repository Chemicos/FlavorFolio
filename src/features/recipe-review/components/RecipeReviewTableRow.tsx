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

function formatCreatedAt(value: any) {
  if (!value?.seconds) return "-"

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
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
            bgcolor: "var(--tooltip-bg)",
            color: "var(--tooltip-text)",
            fontSize: "0.75rem",
            lineHeight: 1.6,
            border: "1px solid var(--tooltip-border)",
            backdropFilter: "blur(12px)",
            boxShadow: "var(--shadow-dropdown)",
            padding: "0.5rem"
          },
        },
        arrow: {
          sx: {
            color: "var(--tooltip-bg)",
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
        ? "bg-[var(--table-row-active)]"
        : isSelected
        ? "bg-[var(--table-row-selected)]"
        : "bg-[var(--table-row-bg)] group-hover:bg-[var(--table-row-hover)]",
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
              color: "var(--text-disabled)",
              "&.Mui-checked": { color: "var(--accent)" },
              "& .MuiSvgIcon-root": { fontSize: 22 },
            }}
          />
        )

      case "title":
        return (
          <TruncatedTooltipText className="truncate text-sm font-medium text-[var(--text-primary)]">
            {recipe.title || "Untitled recipe"}
          </TruncatedTooltipText>
        )

      case "description":
        return (
          <TruncatedTooltipText className="truncate text-sm text-[var(--text-secondary)]">
            {recipe.description || "No description"}
          </TruncatedTooltipText>
        )

      case "createdAt":
        return (
          <span className="text-sm text-[var(--text-secondary)]">
            {formatCreatedAt(recipe.createdAt)}
          </span>
        )

      case "createdBy":
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-[var(--surface-muted)]">
              {recipe.author?.profileImage ? (
                <img
                  src={recipe.author.profileImage}
                  alt={recipe.author?.username || "Author"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--text-secondary)]">
                  {(recipe.author?.username || recipe.user || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <span className="truncate text-sm text-[var(--text-secondary)]">
              {recipe.author?.username || recipe.user || "Unknown"}
            </span>
          </div>
        )

      case "difficulty":
        return (
          <span className="text-sm capitalize text-[var(--text-secondary)]">
            {recipe.difficulty || "-"}
          </span>
        )

      case "cuisine":
        return (
          <span className="text-sm capitalize text-[var(--text-secondary)]">
            {recipe.cuisine || "-"}
          </span>
        )

      case "duration":
        return (
          <span className="text-sm text-[var(--text-secondary)]">
            {recipe.durationMinutes ? `${recipe.durationMinutes} min` : "-"}
          </span>
        )

      case "steps":
        return (
          <span className="text-sm text-[var(--text-secondary)]">
            {stepsCount}
          </span>
        )

      case "ingredients":
        return (
          <span className="text-sm text-[var(--text-secondary)]">
            {recipe.ingredients?.length || 0}
          </span>
        )

      case "servings":
        return (
          <span className="text-sm text-[var(--text-secondary)]">
            {recipe.servings || "-"}
          </span>
        )

      case "meal":
        return (
          <span className="text-sm capitalize text-[var(--text-secondary)]">
            {recipe.meal || "-"}
          </span>
        )

      case "visibility":
        return (
          <span className="text-sm capitalize text-[var(--text-secondary)]">
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
                className="inline-flex translate-x-3 items-center justify-center text-[var(--text-secondary)] opacity-0 transition-all duration-200 ease-out hover:text-[var(--text-primary)] active:scale-95 group-hover:translate-x-0 group-hover:opacity-100"
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
