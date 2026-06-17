import ViewSidebarIcon from '@mui/icons-material/ViewSidebar'

import Checkbox from "@mui/material/Checkbox"
import Tooltip from "@mui/material/Tooltip"

import { ReviewRecipe } from "../types/recipeReview.types"

interface RecipeReviewTableRowProps {
  recipe: ReviewRecipe
  isSelected: boolean
  onToggle: () => void
  onView: () => void
  isActive?: boolean
}

function formatCreatedAt(value: any) {
  if (!value?.seconds) return "-"

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value.seconds * 1000))
}

export default function RecipeReviewTableRow({
  recipe,
  isSelected,
  onToggle,
  onView,
  isActive = false,
}: RecipeReviewTableRowProps) {
  const stepsCount = recipe.cookingSteps?.length || 0
  const hasNoSteps = stepsCount === 0

  const cellClassName = [
    "px-4 py-2 transition-colors",
     isActive
      ? "bg-[#202636]"
      : isSelected
        ? "bg-[#161b24]"
        : "bg-[#0b0b0c] group-hover:bg-[#202429]",
  ].join(" ")

  return (
    <tr className="group transition-all">
      <td className={`rounded-l-lg ${cellClassName}`}>
        <Checkbox 
          checked={isSelected}
          onChange={onToggle}
          size="small"
          sx={{
            padding: 0,
            color: "rgba(168,179,207,0.75)",

            "&.Mui-checked": {
              color: "#a8b3cf",
            },

            "& .MuiSvgIcon-root": {
              fontSize: 22,
            },
          }}
        />
      </td>

      <td className={cellClassName}>
        <p className="truncate text-sm font-medium text-[#d7def0]">
          {recipe.title || "Untitled recipe"}
        </p>
      </td>

      <td className={cellClassName}>
        <div className="flex items-center gap-2">
          <p className="truncate text-sm text-[#9aa6c7]">
            {recipe.description || "No description"}
          </p>
        </div>
      </td>

      <td className={`${cellClassName} text-sm text-[#a8b3cf]`}>
        {formatCreatedAt(recipe.createdAt)}
      </td>


      <td className={cellClassName}>
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
                {(recipe.author?.username || recipe.user || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <span className={`${cellClassName} truncate text-sm text-[#a8b3cf]`}>
            {recipe.author?.username || recipe.user || "Unknown"}
          </span>
        </div>
      </td>

      <td className={`${cellClassName} text-sm capitalize text-[#a8b3cf]`}>
        {recipe.difficulty || "-"}
      </td>

      <td className={`${cellClassName} text-sm capitalize text-[#a8b3cf]`}>
        {recipe.cuisine || "-"}
      </td>

      <td className={`${cellClassName} text-sm text-[#a8b3cf]`}>
        {recipe.durationMinutes ? `${recipe.durationMinutes} min` : "-"}
      </td>

      <td className={cellClassName}>
        <div className="flex items-center gap-2 text-sm text-[#a8b3cf]">
          <span>{stepsCount}</span>
        </div>
      </td>

      <td className={`${cellClassName} rounded-r-xl text-right`}>
        <Tooltip
          title="View submission"
          arrow
          placement='top'
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
            }
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
      </td>
    </tr>
  )
}
