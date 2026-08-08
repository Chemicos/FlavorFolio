import { Skeleton } from "@mui/material";

export default function AdminUsersTableSkeleton() {
  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
        <table className="w-full min-w-[980px] border-separate border-spacing-y-[6px]">
          <thead className="sticky top-0 z-20 bg-[var(--card-bg)]">
            <tr className="text-left text-sm font-semibold text-[var(--text-secondary)]">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Stats</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right" />
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 8 }).map((_, index) => (
              <tr key={index}>
                <td className="rounded-l-lg bg-[var(--table-row-bg)] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: "10px", bgcolor: "var(--surface-muted)" }} />
                    <div>
                      <Skeleton width={120} height={18} sx={{ bgcolor: "var(--surface-muted)" }} />
                      <Skeleton width={160} height={14} sx={{ mt: 0.6, bgcolor: "var(--surface-muted)" }} />
                    </div>
                  </div>
                </td>

                <td className="bg-[var(--table-row-bg)] px-4 py-3">
                  <Skeleton variant="rounded" width={78} height={26} sx={{ borderRadius: "999px", bgcolor: "var(--surface-muted)" }} />
                </td>

                <td className="bg-[var(--table-row-bg)] px-4 py-3">
                  <div className="flex gap-3">
                    <Skeleton width={36} height={18} sx={{ bgcolor: "var(--surface-muted)" }} />
                    <Skeleton width={36} height={18} sx={{ bgcolor: "var(--surface-muted)" }} />
                    <Skeleton width={36} height={18} sx={{ bgcolor: "var(--surface-muted)" }} />
                  </div>
                </td>

                <td className="bg-[var(--table-row-bg)] px-4 py-3">
                  <Skeleton width={110} height={18} sx={{ bgcolor: "var(--surface-muted)" }} />
                </td>

                <td className="bg-[var(--table-row-bg)] px-4 py-3">
                  <Skeleton width={96} height={18} sx={{ bgcolor: "var(--surface-muted)" }} />
                </td>

                <td className="rounded-r-xl bg-[var(--table-row-bg)] px-4 py-3 text-right">
                  <Skeleton variant="circular" width={24} height={24} sx={{ ml: "auto", bgcolor: "var(--surface-muted)" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
