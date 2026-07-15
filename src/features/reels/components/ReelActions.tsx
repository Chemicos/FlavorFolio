import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded"
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded"
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded"

import { Reel } from "../types/reel.types"

interface ReelActionsProps {
  reel: Reel
  onCommentsClick: (reel: Reel) => void
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

export default function ReelActions({reel, onCommentsClick}: ReelActionsProps) {
  return (
    <div className="absolute bottom-24 right-5 z-10 flex flex-col items-center gap-5">
      <button className="group flex flex-col items-center gap-1 text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition group-hover:bg-[#feaa2b]/20 group-hover:text-[#ffd28a]">
          <FavoriteRoundedIcon sx={{ fontSize: 27 }} />
        </span>
        <span className="text-xs font-semibold">
          {formatCount(reel.stats.likesCount)}
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

      <button className="group flex flex-col items-center gap-1 text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition group-hover:bg-[#feaa2b]/20 group-hover:text-[#ffd28a]">
          <BookmarkRoundedIcon sx={{ fontSize: 25 }} />
        </span>
      </button>

      <button className="group flex flex-col items-center gap-1 text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition group-hover:bg-[#feaa2b]/20 group-hover:text-[#ffd28a]">
          <SendRoundedIcon sx={{ fontSize: 25 }} />
        </span>
      </button>
    </div>
  )
}
