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
          className="absolute right-0 top-12 z-[80] w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#1b1d22] shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
        >
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Notifications</h2>

              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-semibold text-[#a8b3cf]">
                {unreadCount}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onMarkAllAsRead}
                disabled={unreadCount === 0}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-[#d7def0] transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <DoneAllRoundedIcon sx={{ fontSize: 16 }} />
                Mark all
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8f97b1] transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Close notifications"
              >
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          </header>

          {isLoading ? (
            <div className="flex h-[360px] items-center justify-center">
              <CircularProgress size={30} sx={{ color: "#feaa2b" }} />
            </div>
          ) : notifications.length === 0 ? (
            <NotificationEmptyState />
          ) : (
            <div className="max-h-[520px] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
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
