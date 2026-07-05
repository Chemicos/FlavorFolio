import { Skeleton } from "@mui/material"

export default function AdminRecipesTableRowSkeleton() {
    return (
        <tr>
            <td className="rounded-l-lg bg-[#0b0b0c] px-4 py-4">
                <Skeleton
                    variant="circular"
                    width={22}
                    height={22}
                    sx={{ bgcolor: "rgba(168,179,207,.08)" }}
                />
            </td>

            <td className="bg-[#0b0b0c] px-4 py-4">
                <Skeleton
                    variant="text"
                    width="62%"
                    height={18}
                    sx={{ bgcolor: "rgba(168,179,207,.08)" }}
                />

                <Skeleton
                    variant="text"
                    width="38%"
                    height={14}
                    sx={{
                        mt: .6,
                        bgcolor: "rgba(168,179,207,.06)"
                    }}
                />
            </td>

            <td className="bg-[#0b0b0c] px-4">
                <Skeleton variant="text" width={80}/>
            </td>

            <td className="bg-[#0b0b0c] px-4">
                <Skeleton
                    variant="rounded"
                    width={88}
                    height={28}
                />
            </td>

            <td className="bg-[#0b0b0c] px-4">
                <Skeleton width={70}/>
            </td>

            <td className="bg-[#0b0b0c] px-4">
                <div className="flex gap-3">
                    <Skeleton variant="circular" width={18} height={18}/>
                    <Skeleton variant="circular" width={18} height={18}/>
                    <Skeleton variant="circular" width={18} height={18}/>
                </div>
            </td>

            <td className="bg-[#0b0b0c] px-4">
                <Skeleton width={90}/>
            </td>

            <td className="rounded-r-xl bg-[#0b0b0c] px-4">
                <Skeleton
                    variant="circular"
                    width={24}
                    height={24}
                />
            </td>
        </tr>
    )
}