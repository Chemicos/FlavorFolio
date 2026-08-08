import { Skeleton } from "@mui/material";
import AdminRecipeStatCardSkeleton from "./AdminRecipeStatCardSkeleton";
import AdminRecipesTable from "../AdminRecipesTable";


export default function AdminRecipesPageSkeleton() {
  return (
    <>
      <section className="mt-5 grid shrink-0 gap-4 md:grid-cols-3">
        <AdminRecipeStatCardSkeleton />
        <AdminRecipeStatCardSkeleton />
        <AdminRecipeStatCardSkeleton />
      </section>

      <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] px-5 pt-5">
        <div className="mb-5 flex shrink-0 items-center justify-between">
          <Skeleton
            width={140}
            height={26}
            sx={{ bgcolor: "var(--skeleton-bg)" }}
          />

          <Skeleton
            width={360}
            height={44}
            variant="rounded"
            sx={{
              borderRadius: "10px",
              bgcolor: "var(--skeleton-bg)",
            }}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
          <div className="min-h-0 flex-1 overflow-hidden">
            <AdminRecipesTable
              recipes={[]}
              selectedIds={[]}
              isLoading={true}
              activeRecipeId={null}
              onToggleRecipe={() => {}}
              onViewRecipe={() => {}}
            />
          </div>
        </div>
      </section>
    </>
  )
}
