import CircularProgress from "@mui/material/CircularProgress"
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { AnimatePresence, motion } from "motion/react"
import { FlavorFolioNotification } from "../services/notifications.service"
import NotificationEmptyState from "./NotificationEmptyState"
import NotificationItem from "./NotificationItem"

interface NotificationsPopoverProps {
    isOpen: boolean
    notifications: FlavorFolioNotification[]
    unreadCount: number
    isLoading: boolean
    onClose: () => void
    onMarkAsRead: (notificationId: string) => void
    onMarkAllAsRead: () => void
    onDelete: (notificationId: string) => void
    onNotificationClick?: (notification: FlavorFolioNotification) => void
}

export default function NotificationsPopover({
    isOpen,
    notifications,
    unreadCount,
    isLoading,
    onClose,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onNotificationClick,
}: NotificationsPopoverProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.section
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 top-12 z-[80] w-[420px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--account-dropdown-bg)] shadow-[var(--shadow-dropdown)]"
        >
          <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Notifications</h2>

              <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
                {unreadCount}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onMarkAllAsRead}
                disabled={unreadCount === 0}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-3 text-xs font-semibold text-[var(--button-secondary-text)] transition hover:bg-[var(--button-secondary-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <DoneAllRoundedIcon sx={{ fontSize: 16 }} />
                Mark all
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                aria-label="Close notifications"
              >
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          </header>

          {isLoading ? (
            <div className="flex h-[360px] items-center justify-center">
              <CircularProgress size={30} sx={{ color: "var(--accent)" }} />
            </div>
          ) : notifications.length === 0 ? (
            <NotificationEmptyState />
          ) : (
            <div className="max-h-[520px] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                  onClick={onNotificationClick}
                />
              ))}
            </div>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  )
}
