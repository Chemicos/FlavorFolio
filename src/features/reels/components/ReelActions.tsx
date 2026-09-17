import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded"
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded"
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded"

import { Reel } from "../types/reel.types"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import { useState } from "react"
import { toggleReelLike } from "../services/reelLikes.service"
import { CircularProgress } from "@mui/material"
import { toggleReelSave } from "../services/reelSave.service"

interface ReelActionsProps {
  reel: Reel
  currentUserId: string | null
  isLiked: boolean
  isSaved: boolean

  onCommentsClick: (reel: Reel) => void
  onShareClick: (reel: Reel) => void
  onLikeStateChange: (
    reelId: string,
    isLiked: boolean,
    likesCount: number
  ) => void
  onSaveStateChange: (
    reelId: string,
    isSaved: boolean,
    savesCount: number,
  ) => void
}

function formatCount(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }

  return String(value)
}

export default function ReelActions({
  reel,
  currentUserId,
  isLiked,
  isSaved,
  onCommentsClick,
  onShareClick,
  onSaveStateChange,
  onLikeStateChange,
}: ReelActionsProps) {
  const { showSnackbar } = useSnackbar()
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isSaveLoading, setIsSaveLoading] = useState(false)

  const handleToggleLike = async () => {
    if (!currentUserId) {
      showSnackbar("You must be signed in to like a reel.", "info")

      return
    }

    if (isLikeLoading) return

    try {
      setIsLikeLoading(true)

      const result = await toggleReelLike({
        reelId: reel.reelId,
        userId: currentUserId,
      })

      onLikeStateChange(
        reel.reelId,
        result.isLiked,
        result.likesCount
      )
    } catch (error) {
      console.error(
        "Failed to toggle reel like:",
        error
      )

      showSnackbar("Failed to update reel like.", "error")
    } finally {
      setIsLikeLoading(false)
    }
  }

  const handleSaveClick = async () => {
    if (!currentUserId || isSaveLoading) return

    try {
      setIsSaveLoading(true)

      const result = await toggleReelSave({
        reelId: reel.reelId,
        userId: currentUserId,
      })

      onSaveStateChange(
        reel.reelId,
        result.isSaved,
        result.savesCount
      )
    } catch (error) {
      console.error("Failed to save reel:", error)
    } finally {
      setIsSaveLoading(false)
    }
  }

  return (
    <div className="absolute bottom-24 right-5 z-10 flex flex-col items-center gap-5">
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={isLikeLoading}
        aria-label={isLiked ? "Remove like from reel" : "Like reel"}
        aria-pressed={isLiked}
        className={[
          "group flex flex-col items-center gap-1 transition disabled:cursor-not-allowed",
          isLiked
            ? "text-red-400"
            : "text-white",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition duration-200",
            isLiked
              ? "bg-red-500/20 text-red-400 shadow-[0_0_22px_rgba(248,113,113,0.18)]"
              : "bg-black/30 text-white group-hover:bg-red-500/15 group-hover:text-red-300",
          ].join(" ")}
        >
          {isLikeLoading ? (
            <CircularProgress
              size={21}
              thickness={5}
              sx={{ color: "#f87171" }}
            />
          ) : (
            <FavoriteRoundedIcon sx={{ fontSize: 27 }} />
          )}
        </span>

        <span
          className={[
            "text-xs font-semibold transition",
            isLiked
              ? "text-red-300"
              : "text-white",
          ].join(" ")}
        >
          {formatCount(
            Number(reel.stats.likesCount || 0)
          )}
        </span>
      </button>

      <button 
        type="button"
        onClick={() => onCommentsClick(reel)}
        aria-label={`Open ${reel.stats.commentsCount} comments`}
        className="group flex flex-col items-center gap-1 text-white"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition group-hover:bg-[#feaa2b]/20 group-hover:text-[#ffd28a]">
          <ChatBubbleRoundedIcon sx={{ fontSize: 25 }} />
        </span>
        <span className="text-xs font-semibold">
          {formatCount(reel.stats.commentsCount)}
        </span>
      </button>

      <button 
        type="button"
        onClick={handleSaveClick}
        disabled={!currentUserId || isSaveLoading}
        className={[
          "group flex flex-col items-center gap-1 transition disabled:cursor-not-allowed",
          isSaved ? "text-[#feaa2b]" : "text-white",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition duration-200",
            isSaved
              ? "bg-[#feaa2b]/20 text-[#feaa2b] shadow-[0_0_22px_rgba(254,170,43,0.18)]"
              : "bg-black/30 text-white group-hover:bg-[#feaa2b]/15 group-hover:text-[#ffd28a]",
          ].join(" ")}
        >
          {isSaveLoading ? (
            <CircularProgress
              size={21}
              thickness={5}
              sx={{color: "#feaa2b"}}
            />
          ) : isSaved ? (
            <BookmarkRoundedIcon sx={{fontSize: 25}} />
          ) : (
            <BookmarkBorderRoundedIcon sx={{fontSize: 25}} />
          )}
        </span>

        <span 
          className={[
            "text-xs font-semibold transition",
            isSaved
              ? "text-[#ffd28a]"
              : "text-white",
          ].join(" ")}
        >
          {formatCount(reel.stats.savesCount || 0)}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onShareClick(reel)}
        aria-label={`Share ${reel.title || "reel"}`}
        className="group flex flex-col items-center gap-1 text-white"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition group-hover:bg-[#feaa2b]/20 group-hover:text-[#ffd28a]">
          <SendRoundedIcon sx={{ fontSize: 25 }} />
        </span>
      </button>
    </div>
  )
}
