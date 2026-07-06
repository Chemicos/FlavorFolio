import { Skeleton } from "@mui/material";
import AdminUserStatCardSkeleton from "./AdminUserStatCardSkeleton";
import AdminUsersTableSkeleton from "./AdminUsersTableSkeleton";


export default function AdminUsersPageSkeleton() {
  return (
    <>
      <section className="mt-5 grid shrink-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminUserStatCardSkeleton />
        <AdminUserStatCardSkeleton />
        <AdminUserStatCardSkeleton />
        <AdminUserStatCardSkeleton />
      </section>

      <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#16181d] p-5">
        <div className="mb-5 flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Skeleton width={140} height={26} sx={{ bgcolor: "rgba(168,179,207,.08)" }} />

          <Skeleton
            variant="rounded"
            width={360}
            height={44}
            sx={{ borderRadius: "10px", bgcolor: "rgba(168,179,207,.08)" }}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl">
          <AdminUsersTableSkeleton />
        </div>
      </section>
    </>
  )
}
