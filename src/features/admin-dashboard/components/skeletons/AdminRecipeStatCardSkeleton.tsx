import { Skeleton } from "@mui/material"

export default function AdminRecipeStatCardSkeleton() {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#16181d]/80 p-5">
            <Skeleton
                variant="text"
                width={95}
                height={18}
                sx={{ bgcolor: "rgba(168,179,207,.08)" }}
            />

            <Skeleton
                variant="rounded"
                width={70}
                height={34}
                sx={{
                    mt: 2,
                    borderRadius: "10px",
                    bgcolor: "rgba(168,179,207,.08)"
                }}
            />
        </div>
    )
}