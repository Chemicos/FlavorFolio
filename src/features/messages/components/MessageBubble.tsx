import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded"
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded"

import { Tooltip } from "@mui/material"
import { ChatMessage } from "../types/messages.types"
import { useNavigate } from "react-router-dom"
import SharedReelMessageCard from "./SharedReelMessageCard"

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  isSeen?: boolean
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

export default function MessageBubble({
  message, 
  isOwn, 
  isSeen = false, 
  onDelete,
  onOpenImage,
}: MessageBubbleProps) {
  const navigate = useNavigate()
  const isRecipeMessage = message.type === "recipe"
  const isReelMessage = message.type === "reel" && Boolean(message.reel)
  const isRichMessage = isRecipeMessage || isReelMessage
  
  return (
    <div className={["group flex flex-col", isOwn ? "items-end" : "items-start"].join(" ")}>
      <div className="flex items-end gap-2">
        {isOwn && onDelete && (
          <Tooltip title="Delete message" arrow placement="left" slotProps={viewTooltipProps}>
            <button
              type="button"
              onClick={onDelete}
              className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0b0b0c] text-[#8f97b1] opacity-0 transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
            </button>
          </Tooltip>
        )}

        <div
          className={[
            isRichMessage
              ? "max-w-[360px] rounded-2xl p-2 shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
              : "max-w-[450px] rounded-2xl px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)]",

            isRichMessage
              ? "border border-white/10 bg-[#16181d] text-[#d7def0]"
              : isOwn
                ? "rounded-br-md bg-[#feaa2b] text-[#0d0e11]"
                : "rounded-bl-md border border-white/10 bg-[#0b0b0c] text-[#d7def0]",
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
                    className="mb-2 block overflow-hidden rounded-xl outline-none transition hover:opacity-90 focus:ring-2 focus:ring-[#feaa2b]/40"
                  >
                    <img
                      src={message.imageUrl}
                      alt="Message attachment"
                      className="max-h-[360px] max-w-full object-cover"
                    />
                  </button>
                )}

              {message.text && (
                <p className="whitespace-pre-wrap text-sm leading-6">
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
                    className="block w-full overflow-hidden rounded-xl bg-[#0b0b0c] text-left transition hover:bg-[#202329] active:scale-[0.99]"
                  >
                    <div className="h-36 w-full overflow-hidden bg-white/10">
                      {message.recipe.image ? (
                        <img
                          src={
                            message.recipe.image
                          }
                          alt={
                            message.recipe.title
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#8f97b1]">
                          <RestaurantRoundedIcon />
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <div className="mb-2 inline-flex rounded-full bg-[#feaa2b]/15 px-2 py-1 text-[0.68rem] font-semibold text-[#ffd28a]">
                        Shared recipe
                      </div>

                      <p className="line-clamp-2 text-sm font-bold text-white">
                        {message.recipe.title}
                      </p>

                      <p className="mt-1 truncate text-xs text-[#8f97b1]">
                        by{" "}
                        {message.recipe
                          .authorUsername ||
                          "Unknown"}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#a8b3cf]">
                        <span className="truncate capitalize">
                          {message.recipe.meal}
                          {message.recipe
                            .difficulty
                            ? ` · ${message.recipe.difficulty}`
                            : ""}
                        </span>

                        <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
                          View
                          <OpenInNewRoundedIcon
                            sx={{
                              fontSize: 14,
                            }}
                          />
                        </span>
                      </div>
                    </div>
                  </button>
                )}

              {isReelMessage &&
                message.reel && (
                  <SharedReelMessageCard
                    reel={message.reel}
                  />
                )}
            </>
          )}

          <p
            className={[
              "mt-1 text-right text-[0.65rem]",
              isRichMessage
                ? "text-[#7f89a6]"
                : isOwn
                  ? "text-[#3b2a10]"
                  : "text-[#7f89a6]",
            ].join(" ")}
          >
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>

      {isOwn && isSeen && (
        <span className="mt-1 pr-1 text-[0.68rem] font-medium text-[#8f97b1]">
          Seen
        </span>
      )}
    </div>
  )
}
