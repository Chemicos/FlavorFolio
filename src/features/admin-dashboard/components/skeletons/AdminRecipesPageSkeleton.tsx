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

      <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#16181d] px-5 pt-5">
        <div className="mb-5 flex shrink-0 items-center justify-between">
          <Skeleton
            width={140}
            height={26}
            sx={{ bgcolor: "rgba(168,179,207,.08)" }}
          />

          <Skeleton
            width={360}
            height={44}
            variant="rounded"
            sx={{
              borderRadius: "10px",
              bgcolor: "rgba(168,179,207,.08)",
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
