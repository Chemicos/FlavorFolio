import { Checkbox, Tooltip } from "@mui/material"
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar"

import { NeedsRevisionRecipe } from "../types/needsRevision.types"
import { NeedsRevisionTableColumn } from "./NeedsRevisionTable"
import { useEffect, useRef, useState } from "react"

interface NeedsRevisionTableRowProps {
    recipe: NeedsRevisionRecipe
    columns: NeedsRevisionTableColumn[]
    isActive?: boolean
    onView: () => void
    isSelected: boolean
    onToggle: () => void
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

function formatDate(value: any) {
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

export default function NeedsRevisionTableRow({
    recipe,
    columns,
    isActive = false,
    onView,
    isSelected,
    onToggle,
}: NeedsRevisionTableRowProps) {
    const cellClassName = [
    "px-4 py-3 transition-colors",
    isActive
        ? "bg-[var(--table-row-active)]"
        : isSelected
        ? "bg-[var(--table-row-selected)]"
        : "bg-[var(--table-row-bg)] group-hover:bg-[var(--table-row-hover)]",
    ].join(" ")

    const renderCell = (key: NeedsRevisionTableColumn["key"]) => {
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
                <TruncatedTooltipText className="text-sm font-medium text-[var(--text-primary)]">
                    {recipe.title || "Untitled recipe"}
                </TruncatedTooltipText>
            )

        case "reason":
            return (
            <TruncatedTooltipText className="text-sm capitalize text-[var(--text-secondary)]">
                {recipe.denialFeedback?.reasonLabel ||
                    recipe.denialFeedback?.reason?.replaceAll("_", " ") ||
                    "-"}
            </TruncatedTooltipText>
            )

        case "description":
            return (
                <TruncatedTooltipText className="text-sm text-[var(--text-secondary)]">
                    {recipe.reviewFeedback?.description?.message || "-"}
                </TruncatedTooltipText>
            )

        case "ingredients":
            return (
                <TruncatedTooltipText className="text-sm text-[var(--text-secondary)]">
                    {recipe.reviewFeedback?.ingredients?.message || "-"}
                </TruncatedTooltipText>
            )

        case "steps":
            return (
                <TruncatedTooltipText className="text-sm text-[var(--text-secondary)]">
                    {recipe.reviewFeedback?.steps?.message || "-"}
                </TruncatedTooltipText>
            )

        case "updatedAt":
            return (
            <span className="text-sm text-[var(--text-secondary)]">
                {formatDate(recipe.updatedAt)}
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
                        title="View feedback"
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
                        index === columns.length - 1 ? "rounded-r-xl text-right" : "",
                        column.key === "select"
                        ? "sticky left-0 z-10 backdrop-blur-xl"
                        : "",
                        column.key === "actions"
                        ? "sticky right-0 z-10 text-right backdrop-blur-xl"
                        : "",
                    ].join(" ")}
                >
                    <div className={[
                        "truncate",
                        column.key === "title"
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)]",
                    ].join(" ")}>
                        {renderCell(column.key)}
                    </div>
                </td>
            ))}
        </tr>
    )
}
