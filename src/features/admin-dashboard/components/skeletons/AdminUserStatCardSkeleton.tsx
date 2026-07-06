import { Skeleton } from "@mui/material";


export default function AdminUserStatCardSkeleton() {
  return (
     <div className="rounded-2xl border border-white/10 bg-[#16181d]/80 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton width={95} height={18} sx={{ bgcolor: "rgba(168,179,207,.08)" }} />
          <Skeleton
            variant="rounded"
            width={58}
            height={32}
            sx={{ mt: 2, borderRadius: "10px", bgcolor: "rgba(168,179,207,.08)" }}
          />
          <Skeleton width={120} height={16} sx={{ mt: 3, bgcolor: "rgba(168,179,207,.06)" }} />
        </div>

        <Skeleton
          variant="rounded"
          width={40}
          height={40}
          sx={{ borderRadius: "12px", bgcolor: "rgba(254,170,43,.10)" }}
        />
      </div>
    </div>
  )
}
