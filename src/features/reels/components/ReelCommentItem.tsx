import { CircularProgress } from '@mui/material'
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"

import { ReelComment } from '../types/reelComment.types'


interface ReelCommentItemProps {
  comment: ReelComment
  currentUserId: string | null
  isDeleting: boolean
  onDelete: (commentId: string) => void
}

function formatCommentDate(
  createdAt: ReelComment["createdAt"]
) {
  if (!createdAt) return "Just now"

  const createdAtMs = createdAt.toMillis()
  const differenceMs = Date.now() - createdAtMs

  const minutes = Math.floor(
    differenceMs / (1000 * 60)
  )

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return `${hours}h`

  const days = Math.floor(hours / 24)

  if (days < 7) return `${days}d`

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(createdAt.toDate())
}


export default function ReelCommentItem({
  comment,
  currentUserId,
  isDeleting,
  onDelete,
}: ReelCommentItemProps) {
  const canDelete = Boolean(currentUserId) && currentUserId === comment.userId
  return (
    <article className="group flex gap-3 px-4 py-3 transition hover:bg-white/[0.025]">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]">
        {comment.profileImage ? (
          <img
            src={comment.profileImage}
            alt={comment.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
            {comment.username
              .charAt(0)
              .toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {comment.username}
            </p>

            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-[#d7def0]">
              {comment.text}
            </p>
          </div>

          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              disabled={isDeleting}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#737b94] opacity-0 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed group-hover:opacity-100"
              aria-label="Delete comment"
            >
              {isDeleting ? (
                <CircularProgress
                  size={15}
                  sx={{ color: "#fca5a5" }}
                />
              ) : (
                <DeleteOutlineRoundedIcon
                  sx={{ fontSize: 18 }}
                />
              )}
            </button>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2 text-xs text-[#737b94]">
          <span>
            {formatCommentDate(comment.createdAt)}
          </span>

          {comment.edited && (
            <>
              <span>•</span>
              <span>Edited</span>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
