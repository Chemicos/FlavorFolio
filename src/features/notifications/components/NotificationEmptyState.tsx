import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded"

export default function NotificationEmptyState() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#8f97b1]">
        <NotificationsNoneRoundedIcon sx={{ fontSize: 28 }} />
      </div>

      <h3 className="mt-5 text-base font-bold text-white">
        No notifications yet
      </h3>

      <p className="mt-2 max-w-[280px] text-sm leading-6 text-[#8f97b1]">
        New follows, comments, ratings and recipe activity will appear here.
      </p>
    </div>
  )
}
