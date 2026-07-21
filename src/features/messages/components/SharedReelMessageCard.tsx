import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import MovieRoundedIcon from "@mui/icons-material/MovieRounded"

import { useNavigate } from "react-router-dom"
import { SharedReelMessage } from "../types/messages.types"
import { useState } from "react"

interface SharedReelMessageCardProps {
  reel: SharedReelMessage
}

export default function SharedReelMessageCard({reel}: SharedReelMessageCardProps) {
    const navigate = useNavigate()
    const [hasThumbnailError, setHasThumbnailError] = useState(false)

    const handleOpenReel = () => {
        navigate(`/reels?reelId=${reel.reelId}`)
    }

  return (
    <button
      type="button"
      onClick={handleOpenReel}
      className="block w-full overflow-hidden rounded-xl bg-[#0b0b0c] text-left transition hover:bg-[#202329] active:scale-[0.99]"
      aria-label={`Open shared reel ${reel.title}`}
    >
      <div className="relative h-52 w-full overflow-hidden bg-white/[0.06]">
        {reel.thumbnail && !hasThumbnailError ? (
          <img
            src={reel.thumbnail}
            alt={reel.title}
            onError={() => setHasThumbnailError(true)}
            className="h-full w-full object-cover"
          />
        ) : reel.videoUrl ? (
          <video
            src={reel.videoUrl}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#8f97b1]">
            <MovieRoundedIcon sx={{ fontSize: 32 }} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition group-hover:scale-105">
            <PlayArrowRoundedIcon sx={{ fontSize: 28 }} />
          </span>
        </div>

        {reel.durationSeconds > 0 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/65 px-2 py-1 text-[0.68rem] font-semibold text-white backdrop-blur-md">
            {formatDuration(reel.durationSeconds)}
          </span>
        )}
      </div>

      <div className="p-3">
        <div className="mb-2 inline-flex rounded-full bg-[#feaa2b]/15 px-2 py-1 text-[0.68rem] font-semibold text-[#ffd28a]">
          Shared reel
        </div>

        <p className="line-clamp-2 text-sm font-bold text-white">
          {reel.title || "Recipe reel"}
        </p>

        <p className="mt-1 truncate text-xs text-[#8f97b1]">
          by {reel.authorUsername || "Unknown"}
        </p>

        {reel.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#a8b3cf]">
            {reel.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#a8b3cf]">
          <span className="truncate capitalize">
            {reel.meal || "Recipe reel"}
          </span>

          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#d7def0]">
            View
            <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
          </span>
        </div>
      </div>
    </button>
  )
}

function formatDuration(durationSeconds: number) {
  const normalizedDuration = Math.max(
    0,
    Math.round(durationSeconds)
  )

  if (normalizedDuration < 60) {
    return `${normalizedDuration}s`
  }

  const minutes = Math.floor(normalizedDuration / 60)

  const seconds = normalizedDuration % 60

  return seconds
    ? `${minutes}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:00`
}
