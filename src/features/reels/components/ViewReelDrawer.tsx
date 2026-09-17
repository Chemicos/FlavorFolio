import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded"
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded"

import ReelActions from "./ReelActions"

import { useNavigate } from "react-router-dom"
import { Reel } from "../types/reel.types"
import { useRef, useState } from "react"
import { motion } from "motion/react"

interface ViewReelDrawerProps {
  reel: Reel
  currentUserId: string | null
  isLiked: boolean
  isSaved: boolean
  onClose: () => void
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

function formatDuration(seconds: number) {
  const totalSeconds = Math.round(seconds || 0)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export default function ViewReelDrawer({
    reel,
    currentUserId,
    isLiked,
    isSaved,
    onClose,
    onCommentsClick,
    onShareClick,
    onLikeStateChange,
    onSaveStateChange,
}: ViewReelDrawerProps) {
    const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const [isMuted, setIsMuted] = useState(true)

  const authorId = reel.author?.userId || reel.userId || ""
  const authorUsername = reel.author?.username || "Unknown"
  const authorProfileImage = reel.author?.profileImage || ""

  const handleAuthorClick = () => {
    if (!authorId) return

    onClose()

    if (authorId === currentUserId) {
      navigate("/profile")
      return
    }

    navigate(`/users/${authorId}`)
  }

  const handleToggleMute = () => {
    const nextMuted = !isMuted

    setIsMuted(nextMuted)

    if (videoRef.current) {
      videoRef.current.muted = nextMuted
    }
  }

  return (
    <motion.article
      initial={{opacity: 0, scale: 0.96, y: 14}}
      animate={{opacity: 1, scale: 1, y: 0}}
      exit={{opacity: 0, scale: 0.96, y: 14}}
      transition={{
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative h-[min(820px,calc(100vh-104px))] w-[min(460px,calc(100vw-40px))] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[var(--shadow-panel)]"
      onClick={(event) => event.stopPropagation()}
    >
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnail || undefined}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/85" />

      <header className="absolute left-5 right-5 top-5 z-20 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleAuthorClick}
          className="group flex min-w-0 items-center gap-3 text-left"
        >
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/10 transition group-hover:border-[var(--accent-border)]">
            {authorProfileImage ? (
              <img
                src={authorProfileImage}
                alt={authorUsername}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                {authorUsername.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {authorUsername}
            </p>

            <p className="text-xs text-white/65">
              Recipe reel
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55"
            aria-label={isMuted ? "Unmute reel" : "Mute reel"}
          >
            {isMuted ? (
              <VolumeOffRoundedIcon sx={{fontSize: 20}} />
            ) : (
              <VolumeUpRoundedIcon sx={{fontSize: 20}} />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55"
            aria-label="Close reel"
          >
            <CloseRoundedIcon sx={{fontSize: 20}} />
          </button>
        </div>
      </header>

      <ReelActions
        reel={reel}
        currentUserId={currentUserId}
        isLiked={isLiked}
        isSaved={isSaved}
        onCommentsClick={onCommentsClick}
        onShareClick={onShareClick}
        onLikeStateChange={onLikeStateChange}
        onSaveStateChange={onSaveStateChange}
      />

      <footer className="absolute bottom-6 left-5 right-20 z-20">
        <h2 className="line-clamp-2 text-2xl font-extrabold leading-tight text-white drop-shadow">
          {reel.title || "Recipe inspiration"}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {reel.meal && (
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold capitalize text-white backdrop-blur-md">
              {reel.meal}
            </span>
          )}

          {reel.duration > 0 && (
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              {formatDuration(reel.duration)}
            </span>
          )}
        </div>

        {reel.description && (
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/90">
            {reel.description}
          </p>
        )}
      </footer>
    </motion.article>
  )
}
