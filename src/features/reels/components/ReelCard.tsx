import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded"
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded"

import { Reel } from "../types/reel.types"
import ReelVideo from "./ReelVideo"
import ReelActions from "./ReelActions"
import { useNavigate } from "react-router-dom"
import { auth } from "../../../firebase-config"

interface ReelCardProps {
  reel: Reel
  currentUserId: string | null
  isLiked: boolean
  onCommentsClick: (reel: Reel) => void
  onShareClick: (reel: Reel) => void
  onLikeStateChange: (
    reelId: string,
    isLiked: boolean,
    likesCount: number
  ) => void
}

export default function ReelCard({
  reel, 
  currentUserId,
  isLiked,
  onCommentsClick,
  onShareClick,
  onLikeStateChange,
}: ReelCardProps) {
  const navigate = useNavigate()

  const authorId = reel.author?.userId || reel.userId || ""
  const authorUsername = reel.author?.username || "Unknown"
  const authorProfileImage = reel.author?.profileImage || ""

  const handleAuthorProfileClick = () => {
    if (!authorId) return

    const currentUserId = auth.currentUser?.uid

    if (authorId === currentUserId) {
      navigate("/profile")
      return
    }

    navigate(`/users/${authorId}`)
  }

  return (
    <article className="relative h-full max-h-[820px] w-full max-w-[430px] overflow-hidden rounded-3xl border border-white/10 bg-[#16181d] shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
      <ReelVideo reel={reel} />

      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/75" />

      <header className="absolute left-5 right-5 top-5 z-10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleAuthorProfileClick}
          disabled={!authorId}
          className="group flex min-w-0 items-center gap-3 rounded-xl text-left transition disabled:cursor-default"
          aria-label={`Open ${authorUsername}'s profile`}
        >
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/10 transition group-hover:border-orange-300/50 group-hover:ring-2 group-hover:ring-orange-400/15">
            {authorProfileImage ? (
              <img
                src={authorProfileImage}
                alt={authorUsername}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                {authorUsername.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white transition group-hover:text-orange-100">
              {authorUsername}
            </p>

            <p className="text-xs text-white/65 transition group-hover:text-white/80">
              Recipe reel
            </p>
          </div>
        </button>

        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md transition hover:bg-white/10">
          <VolumeUpRoundedIcon sx={{ fontSize: 20 }} />
        </button>
      </header>

      <ReelActions 
        reel={reel}
        currentUserId={currentUserId}
        isLiked={isLiked}
        onCommentsClick={onCommentsClick} 
        onShareClick={onShareClick}
        onLikeStateChange={onLikeStateChange}
      />

      <footer className="absolute bottom-6 left-5 right-20 z-10">
        <h2 className="line-clamp-2 text-2xl font-extrabold leading-tight text-white drop-shadow">
          {reel.title || "Recipe inspiration"}
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {reel.meal && (
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold capitalize text-white backdrop-blur-md">
              {reel.meal}
            </span>
          )}

          {reel.duration ? (
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              ⏱ {reel.duration}s
            </span>
          ) : null}
        </div>

        {reel.description && (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/90">
            {reel.description}
          </p>
        )}
      </footer>
    </article>
  )
}
