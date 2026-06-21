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
        ? "bg-[#202636]"
        : isSelected
        ? "bg-[#161b24]"
        : "bg-[#0b0b0c] group-hover:bg-[#202429]",
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
                    color: "rgba(168,179,207,0.75)",
                    "&.Mui-checked": { color: "#a8b3cf" },
                    "& .MuiSvgIcon-root": { fontSize: 22 },
                }}
                />
            )
        case "title":
            return (
                <TruncatedTooltipText className="text-sm font-medium text-[#d7def0]">
                    {recipe.title || "Untitled recipe"}
                </TruncatedTooltipText>
            )

        case "reason":
            return (
            <TruncatedTooltipText className="text-sm capitalize text-[#a8b3cf]">
                {recipe.denialFeedback?.reasonLabel ||
                    recipe.denialFeedback?.reason?.replaceAll("_", " ") ||
                    "-"}
            </TruncatedTooltipText>
            )

        case "description":
            return (
                <TruncatedTooltipText className="text-sm text-[#a8b3cf]">
                    {recipe.reviewFeedback?.description?.message || "-"}
                </TruncatedTooltipText>
            )

        case "ingredients":
            return (
                <TruncatedTooltipText className="text-sm text-[#a8b3cf]">
                    {recipe.reviewFeedback?.ingredients?.message || "-"}
                </TruncatedTooltipText>
            )

        case "steps":
            return (
                <TruncatedTooltipText className="text-sm text-[#a8b3cf]">
                    {recipe.reviewFeedback?.steps?.message || "-"}
                </TruncatedTooltipText>
            )

        case "updatedAt":
            return (
            <span className="text-sm text-[#a8b3cf]">
                {formatDate(recipe.updatedAt)}
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
                        title="View feedback"
                        arrow
                        placement="top"
                        slotProps={{
                        tooltip: {
                            sx: {
                            bgcolor: "#0b0b0c",
                            color: "#d7def0",
                            fontSize: "0.75rem",
                            border: "1px solid rgba(255,255,255,0.08)",
                            backdropFilter: "blur(12px)",
                            },
                        },
                        arrow: {
                            sx: {
                            color: "#0b0b0c",
                            },
                        },
                        }}
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
                        ? "text-[#d7def0]"
                        : "text-[#9aa6c7]",
                    ].join(" ")}>
                        {renderCell(column.key)}
                    </div>
                </td>
            ))}
        </tr>
    )
}
