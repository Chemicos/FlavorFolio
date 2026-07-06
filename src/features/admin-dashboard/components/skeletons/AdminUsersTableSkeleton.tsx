import { Skeleton } from "@mui/material";

export default function AdminUsersTableSkeleton() {
  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-auto pr-1">
        <table className="w-full min-w-[980px] border-separate border-spacing-y-[6px]">
          <thead className="sticky top-0 z-20 bg-[#16181d]">
            <tr className="text-left text-sm font-semibold text-[#a8b3cf]">
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
                <td className="rounded-l-lg bg-[#0b0b0c] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: "10px", bgcolor: "rgba(168,179,207,.08)" }} />
                    <div>
                      <Skeleton width={120} height={18} sx={{ bgcolor: "rgba(168,179,207,.08)" }} />
                      <Skeleton width={160} height={14} sx={{ mt: 0.6, bgcolor: "rgba(168,179,207,.06)" }} />
                    </div>
                  </div>
                </td>

                <td className="bg-[#0b0b0c] px-4 py-3">
                  <Skeleton variant="rounded" width={78} height={26} sx={{ borderRadius: "999px", bgcolor: "rgba(168,179,207,.08)" }} />
                </td>

                <td className="bg-[#0b0b0c] px-4 py-3">
                  <div className="flex gap-3">
                    <Skeleton width={36} height={18} sx={{ bgcolor: "rgba(168,179,207,.08)" }} />
                    <Skeleton width={36} height={18} sx={{ bgcolor: "rgba(168,179,207,.08)" }} />
                    <Skeleton width={36} height={18} sx={{ bgcolor: "rgba(168,179,207,.08)" }} />
                  </div>
                </td>

                <td className="bg-[#0b0b0c] px-4 py-3">
                  <Skeleton width={110} height={18} sx={{ bgcolor: "rgba(168,179,207,.08)" }} />
                </td>

                <td className="bg-[#0b0b0c] px-4 py-3">
                  <Skeleton width={96} height={18} sx={{ bgcolor: "rgba(168,179,207,.08)" }} />
                </td>

                <td className="rounded-r-xl bg-[#0b0b0c] px-4 py-3 text-right">
                  <Skeleton variant="circular" width={24} height={24} sx={{ ml: "auto", bgcolor: "rgba(168,179,207,.08)" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
