import { Skeleton } from "@mui/material"

export default function AdminRecipeStatCardSkeleton() {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
            <Skeleton
                variant="text"
                width={95}
                height={18}
                sx={{ bgcolor: "var(--skeleton-bg)" }}
            />

            <Skeleton
                variant="rounded"
                width={70}
                height={34}
                sx={{
                    mt: 2,
                    borderRadius: "10px",
                    bgcolor: "var(--skeleton-bg)"
                }}
            />
        </div>
    )
}