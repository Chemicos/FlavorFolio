import { useMemo } from "react"
import { CurrentUserCardData } from "../../types/recipeCard.types"
import { formatCompactCount } from "../../utils/recipeCardFormatters"
import ViewRecipeCommentComposer from "./ViewRecipeCommentComposer"
import ViewRecipeCommentList, { ViewRecipeComment } from "./ViewRecipeCommentList"

import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'

interface ViewRecipeCommentsSectionProps {
  commentsCount: number
  comments: ViewRecipeComment[]
  currentUser: CurrentUserCardData | null
  isLoadingComments: boolean
  isSubmittingComment: boolean
  editingCommentId: string | null
  isUpdatingComment: boolean
  replyingCommentId: string | null
  isSubmittingReply: boolean
  onSubmitComment: (value: string) => void
  onStartReplyComment: (comment: ViewRecipeComment) => void
  onCancelReplyComment: () => void
  onReplyComment: (comment: ViewRecipeComment, value: string) => void
  onToggleCommentReaction?: (comment: ViewRecipeComment, type: "like" | "dislike") => void
  onStartEditComment: (comment: ViewRecipeComment) => void
  onCancelEditComment: () => void
  onUpdateComment: (comment: ViewRecipeComment, value: string) => void
  onDeleteComment: (comment: ViewRecipeComment) => void
  onAuthorClick?: (userId: string) => void
  onBlockUser?: (user: {
    userId: string
    username: string
    profileImage?: string
  }) => void
  blockedUserIds?: string[]
  blockedByUserIds?: string[]
}

export default function ViewRecipeCommentsSection({
  commentsCount,
  comments,
  currentUser,
  onAuthorClick,
  isLoadingComments,
  isSubmittingComment,
  editingCommentId,
  isUpdatingComment,
  replyingCommentId,
  isSubmittingReply,
  onSubmitComment,
  onStartReplyComment,
  onCancelReplyComment,
  onReplyComment,
  onToggleCommentReaction,
  onStartEditComment,
  onCancelEditComment,
  onUpdateComment,
  onDeleteComment,
  onBlockUser,
  blockedUserIds = [],
  blockedByUserIds = [],
}: ViewRecipeCommentsSectionProps) {

  const hiddenUserIds = useMemo(() => {
    return new Set(
      [...blockedUserIds, ...blockedByUserIds]
        .filter(Boolean)
        .map((id) => id.trim())
    )
  }, [blockedUserIds, blockedByUserIds])

  const visibleComments = useMemo(() => {
    return comments
      .filter((comment) => {
        const userId = comment.userId?.trim()
        return userId && !hiddenUserIds.has(userId)
      })
      .map((comment) => ({
        ...comment,
        replies: (comment.replies || []).filter((reply) => {
          const userId = reply.userId?.trim()
          return userId && !hiddenUserIds.has(userId)
        }),
      }))
  }, [comments, hiddenUserIds])

  const visibleCommentsCount = useMemo(() => {
    return visibleComments.reduce(
      (total, comment) => total + 1 + (comment.replies?.length || 0),
      0
    )
  }, [visibleComments])
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
          <ChatBubbleOutlineRoundedIcon sx={{fontSize: 20, color: "var(--text-primary)"}} />
          <h2 className="text-[1.2rem] font-bold text-[var(--text-primary)]">
              Comments {formatCompactCount(visibleCommentsCount, true)}
          </h2>
      </div>

      <div className="mt-5 flex flex-col gap-10">
          <ViewRecipeCommentComposer 
              currentUser={currentUser} 
              isSubmiting={isSubmittingComment}
              onSubmit={onSubmitComment}
          />

          {isLoadingComments ? (
              <p className="text-sm text-[var(--text-muted)]">Loading comments...</p>
          ): (
              <ViewRecipeCommentList 
                  comments={visibleComments} 
                  currentUserId={currentUser?.uid}
                  onAuthorClick={onAuthorClick}
                  editingCommentId={editingCommentId}
                  isUpdatingComment={isUpdatingComment}
                  replyingCommentId={replyingCommentId}
                  isSubmittingReply={isSubmittingReply}
                  onStartReplyComment={onStartReplyComment}
                  onCancelReplyComment={onCancelReplyComment}
                  onReplyComment={onReplyComment}
                  onToggleCommentReaction={onToggleCommentReaction}
                  onStartEditComment={onStartEditComment}
                  onCancelEditComment={onCancelEditComment}
                  onUpdateComment={onUpdateComment}
                  onDeleteComment={onDeleteComment}
                  onBlockUser={onBlockUser} 
                  blockedUserIds={blockedUserIds}
                  blockedByUserIds={blockedByUserIds}
              />
          )}
      </div>
  </div>
  )
}
