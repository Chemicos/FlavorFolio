import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded"
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded"

import { Tooltip } from "@mui/material"
import { ChatMessage } from "../types/messages.types"
import { useNavigate } from "react-router-dom"
import SharedReelMessageCard from "./SharedReelMessageCard"
import { Timestamp } from "@firebase/firestore"

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  isSeen?: boolean
  seenAt?: Timestamp | null
  onDelete?: () => void
  onOpenImage?: (imageUrl: string) => void
}

function formatTime(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    !("toDate" in value) ||
    typeof (
      value as {
        toDate?: unknown
      }
    ).toDate !== "function"
  ) {
    return ""
  }

  const date = (
    value as {
      toDate: () => Date
    }
  ).toDate()

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatSeenDate(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    !("toDate" in value) ||
    typeof (value as { toDate?: unknown }).toDate !== "function"
  ) {
    return ""
  }

  const date = (value as { toDate: () => Date }).toDate()

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}

const viewTooltipProps = {
  tooltip: {
    sx: {
      bgcolor: "var(--dropdown-bg)",
      color: "var(--text-primary)",
      fontSize: "0.75rem",
      border: "1px solid var(--border)",
      backdropFilter: "blur(12px)",
      boxShadow: "var(--shadow-dropdown)",
      px: 1.2,
      py: 0.7,
    },
  },
  arrow: {
    sx: {
      color: "var(--dropdown-bg)",
      "&:before": {
        border: "1px solid var(--border)",
      },
    },
  },
}

export default function MessageBubble({
  message, 
  isOwn, 
  isSeen = false, 
  seenAt,
  onDelete,
  onOpenImage,
}: MessageBubbleProps) {
  const navigate = useNavigate()
  const isRecipeMessage = message.type === "recipe"
  const isReelMessage = message.type === "reel" && Boolean(message.reel)
  const isRichMessage = isRecipeMessage || isReelMessage

  const seenDateLabel = formatSeenDate(seenAt)
  
  return (
    <div className={["group flex flex-col", isOwn ? "items-end" : "items-start"].join(" ")}>
      <div className="flex items-end gap-2">
        {isOwn && onDelete && (
          <Tooltip title="Delete message" arrow placement="left" slotProps={viewTooltipProps}>
            <button
              type="button"
              onClick={onDelete}
              className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--dropdown-bg)] text-[var(--text-muted)] opacity-0 transition hover:border-[var(--danger-border)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger-text)] group-hover:opacity-100"
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
            </button>
          </Tooltip>
        )}

        <div
          className={[
            isRichMessage
              ? "max-w-[360px] rounded-2xl p-2 shadow-[var(--shadow-card)]"
              : "max-w-[450px] rounded-2xl px-4 py-3 shadow-[var(--shadow-card)]",

            isRichMessage
              ? "border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)]"
              : isOwn
                ? "rounded-br-md bg-[var(--accent)] text-[var(--text-on-accent)]"
                : "rounded-bl-md border border-[var(--border)] bg-[var(--dropdown-bg)] text-[var(--text-primary)]",
          ].join(" ")}
        >
          {message.isDeleted ? (
            <p className="whitespace-pre-wrap text-sm italic leading-6 opacity-70">
              Message deleted.
            </p>
          ) : (
            <>
              {message.type === "image" &&
                message.imageUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenImage?.(
                        message.imageUrl!
                      )
                    }
                    className="mb-2 block overflow-hidden rounded-xl outline-none transition hover:opacity-90 focus:ring-2 focus:ring-[var(--focus-ring)]"
                  >
                    <img
                      src={message.imageUrl}
                      alt="Message attachment"
                      className="max-h-[360px] max-w-full object-cover"
                    />
                  </button>
                )}

              {message.text && (
                <p className="whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-6">
                  {message.text}
                </p>
              )}

              {isRecipeMessage &&
                message.recipe && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/home?recipeId=${message.recipe?.recipeId}`
                      )
                    }
                    className="block w-full overflow-hidden rounded-xl bg-[var(--dropdown-bg)] text-left transition hover:bg-[var(--surface-hover)] active:scale-[0.99]"
                  >
                    <div className="h-36 w-full overflow-hidden bg-[var(--surface-muted)]">
                      {message.recipe.image ? (
                        <img
                          src={message.recipe.image}
                          alt={message.recipe.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                          <RestaurantRoundedIcon />
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <div className="mb-2 inline-flex rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[0.68rem] font-semibold text-[var(--accent-text)]">
                        Shared recipe
                      </div>

                      <p className="line-clamp-2 text-sm font-bold text-[var(--text-primary)]">
                        {message.recipe.title}
                      </p>

                      <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                        by{" "}
                        {message.recipe.authorUsername || "Unknown"}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
                        <span className="truncate capitalize">
                          {message.recipe.meal}
                          {message.recipe
                            .difficulty
                            ? ` · ${message.recipe.difficulty}`
                            : ""}
                        </span>

                        <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
                          View
                          <OpenInNewRoundedIcon sx={{fontSize: 14,}} />
                        </span>
                      </div>
                    </div>
                  </button>
                )}

              {isReelMessage &&
                message.reel && (
                  <SharedReelMessageCard reel={message.reel} />
                )}
            </>
          )}

          <p
            className={[
              "mt-1 text-right text-[0.65rem]",
              isRichMessage
                ? "text-[var(--text-muted)]"
                : isOwn
                  ? "text-[var(--accent-text)]"
                  : "text-[var(--text-muted)]",
            ].join(" ")}
          >
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>

      {isOwn && isSeen && (
        <span className="mt-1 pr-1 text-[0.68rem] font-medium text-[var(--text-muted)]">
          Seen{seenDateLabel ? ` · ${seenDateLabel}` : ""}
        </span>
      )}
    </div>
  )
}
