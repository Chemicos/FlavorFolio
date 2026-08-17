import { Skeleton } from "@mui/material";


export default function AdminUserStatCardSkeleton() {
  return (
     <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton width={95} height={18} sx={{ bgcolor: "var(--skeleton)" }} />
          <Skeleton
            variant="rounded"
            width={58}
            height={32}
            sx={{ mt: 2, borderRadius: "10px", bgcolor: "var(--skeleton)" }}
          />
          <Skeleton width={120} height={16} sx={{ mt: 3, bgcolor: "var(--skeleton)" }} />
        </div>

        <Skeleton
          variant="rounded"
          width={40}
          height={40}
          sx={{ borderRadius: "12px", bgcolor: "var(--skeleton)" }}
        />
      </div>
    </div>
  )
}
