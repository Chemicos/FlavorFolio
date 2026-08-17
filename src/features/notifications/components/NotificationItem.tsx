import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import StarRoundedIcon from "@mui/icons-material/StarRounded"
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded"
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded"
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded"
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded"
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded"
import ThumbUpRoundedIcon from "@mui/icons-material/ThumbUpRounded"
import ThumbDownRoundedIcon from "@mui/icons-material/ThumbDownRounded"
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded"
import GppBadRoundedIcon from "@mui/icons-material/GppBadRounded"

import { FlavorFolioNotification, NotificationType } from "../services/notifications.service"
import { useNavigate } from "react-router-dom"

interface NotificationItemProps {
    notification: FlavorFolioNotification
    onMarkAsRead: (notificationId: string) => void
    onDelete: (notificationId: string) => void
    onClick?: (notification: FlavorFolioNotification) => void
}

function formatNotificationDate(createdAt?: FlavorFolioNotification["createdAt"]) {
  if (!createdAt?.seconds) return "Just now"

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt.seconds * 1000))
}

function getNotificationIcon(type: NotificationType) {
  const iconClass = "text-[var(--text-on-accent)]"

  switch (type) {
    case "recipe_saved":
    case "recipe_unsaved":
      return <FavoriteRoundedIcon className={iconClass} sx={{ fontSize: 18 }} />
    case "comment":
      return <ChatBubbleOutlineRoundedIcon className={iconClass} sx={{ fontSize: 18 }} />
    case "reply":
      return <ReplayRoundedIcon className={iconClass} sx={{ fontSize: 18 }} />
    case "follow":
    case "unfollow":
      return <PersonAddAltRoundedIcon className={iconClass} sx={{ fontSize: 18 }} />
    case "needs_revision":
      return <ReportProblemRoundedIcon className={iconClass} sx={{ fontSize: 18 }} />
    case "recipe_pending":
      return <PendingActionsRoundedIcon className={iconClass} sx={{ fontSize: 16 }} />
    case "recipe_resubmitted":
      return <ReplayRoundedIcon className={iconClass} sx={{ fontSize: 18 }} />
    case "rating":
      return <StarRoundedIcon className={iconClass} sx={{ fontSize: 18 }} />
    case "comment_like":
    case "reply_like":
      return <ThumbUpRoundedIcon className={iconClass} sx={{ fontSize: 18 }} />
    case "comment_dislike":
    case "reply_dislike":
      return <ThumbDownRoundedIcon className={iconClass} sx={{ fontSize: 18 }} />
    case "account_restriction":
      return <GppBadRoundedIcon className={iconClass} sx={{ fontSize: 18}} />
    default:
      return <ChatBubbleOutlineRoundedIcon className={iconClass} sx={{ fontSize: 14 }} />
  }
}

function getNotificationAction(notification: FlavorFolioNotification) {
  switch (notification.type) {
    case "follow":
    case "user_followed":
      if (!notification.actorUserId) return null

      return {
        label: "View profile",
        to: `/users/${notification.actorUserId}`,
      }

    case "recipe_approved":
    case "comment":
    case "reply":
    case "comment_like":
    case "comment_dislike":
    case "reply_like":
    case "reply_dislike":
    case "rating":
    case "recipe_saved":
      if (!notification.recipeId) return null

      return {
        label: "View recipe",
        to: `/profile?recipeId=${notification.recipeId}`,
      }

    case "recipe_pending":
    case "recipe_resubmitted":
      if (!notification.recipeId) return null

      return {
        label: "Review recipe",
        to: `/pending?recipeId=${notification.recipeId}`,
      }

    case "needs_revision":
      if (!notification.recipeId) return null

      return {
        label: "Resolve revision",
        to: `/needs-revision?recipeId=${notification.recipeId}`,
      }

    default:
      return null
  }
}


export default function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
    onClick,
}: NotificationItemProps) {
    const actorInitial = notification.actorUsername?.charAt(0)?.toUpperCase() || "F"
    const navigate = useNavigate()
    const action = getNotificationAction(notification)

    const handleItemClick = () => {
        if (!notification.read) {onMarkAsRead(notification.id)}

        onClick?.(notification)
    }

    const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()

      if (!notification.read) {
        onMarkAsRead(notification.id)
      }

      if (action?.to) {
        navigate(action.to)
      }
    }

  return (
    <div
      className={[
        "group relative border-b border-[var(--border-subtle)] px-4 py-4 transition last:border-b-0",
        notification.read
          ? "bg-transparent opacity-70 hover:bg-[var(--surface-hover)] hover:opacity-100"
          : "bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)]",
      ].join(" ")}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleItemClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            handleItemClick()
          }
        }}
        className="flex w-full cursor-pointer gap-3 text-left"
      >
        <div className="relative h-11 w-11 shrink-0 overflow-visible">
          <div className="h-11 w-11 overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)]">
            {notification.actorProfileImage ? (
              <img
                src={notification.actorProfileImage}
                alt={notification.actorUsername || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--text-primary)]">
                {actorInitial}
              </div>
            )}
          </div>

          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--dropdown-bg)] bg-[var(--accent)]">
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        <div className="min-w-0 flex-1 pr-7">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold leading-5 text-[var(--text-primary)]">
              {notification.actorUsername || "FlavorFolio"}
            </p>

            {!notification.read && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--success)] shadow-[0_0_12px_var(--success-soft)]" />
            )}
          </div>

          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            {notification.message}
          </p>

          {notification.recipeTitle && (
            <p className="mt-1 truncate text-xs font-medium text-[var(--accent-text)]">
              {notification.recipeTitle}
            </p>
          )}

          {action && (
            <button
              type="button"
              onClick={handleActionClick}
              className="mt-3 inline-flex h-8 items-center rounded-lg border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-3 text-xs font-semibold text-[var(--button-secondary-text)] transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)] active:scale-95"
            >
              {action.label}
            </button>
          )}

          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {formatNotificationDate(notification.createdAt)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onDelete(notification.id)
        }}
        className="absolute right-3 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 transition hover:bg-[var(--danger-soft)] hover:text-[var(--danger-text)] focus:opacity-100 group-hover:opacity-100"
        aria-label="Delete notification"
      >
        <CloseRoundedIcon sx={{ fontSize: 17 }} />
      </button>
    </div>
  )
}
