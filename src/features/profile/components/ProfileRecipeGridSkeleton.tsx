import { Skeleton } from "@mui/material"
import { ProfileRecipeViewMode } from "./ProfileRecipeToolbar"

interface ProfileRecipeGridSkeletonProps {
  viewMode: ProfileRecipeViewMode
  count?: number
}

function ProfileRecipeGridCardSkeleton() {
  return (
    <article className="relative min-h-[370px] overflow-hidden rounded-lg border border-white/10 bg-black shadow-[0_18px_55px_rgba(0,0,0,0.18)]">
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{
          position: "absolute",
          inset: 0,
          height: "100%",
          bgcolor: "rgba(255,255,255,0.06)",
        }}
      />

      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/80 via-black/45 to-transparent" />

      <div className="absolute left-4 top-4">
        <Skeleton
          variant="rounded"
          width={86}
          height={26}
          animation="wave"
          sx={{ bgcolor: "rgba(255,255,255,0.12)", borderRadius: "0.375rem" }}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pt-3">
        <Skeleton
          variant="text"
          width="72%"
          height={26}
          animation="wave"
          sx={{ bgcolor: "rgba(255,255,255,0.12)" }}
        />

        <Skeleton
          variant="text"
          width="56%"
          height={22}
          animation="wave"
          sx={{ mt: 0.5, bgcolor: "rgba(255,255,255,0.08)" }}
        />

        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <Skeleton variant="rounded" width={44} height={18} sx={{ bgcolor: "rgba(255,255,255,0.10)" }} />
              <Skeleton variant="rounded" width={44} height={18} sx={{ bgcolor: "rgba(255,255,255,0.10)" }} />
              <Skeleton variant="rounded" width={44} height={18} sx={{ bgcolor: "rgba(255,255,255,0.10)" }} />
            </div>

            <Skeleton
              variant="circular"
              width={28}
              height={28}
              sx={{ bgcolor: "rgba(255,255,255,0.10)" }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

function ProfileRecipeListCardSkeleton() {
  return (
    <article className="flex gap-4 rounded-2xl border border-white/10 bg-[#0b0b0c] p-3">
      <Skeleton
        variant="rounded"
        width={144}
        height={112}
        animation="wave"
        sx={{ flexShrink: 0, bgcolor: "rgba(255,255,255,0.08)", borderRadius: "0.75rem" }}
      />

      <div className="flex flex-1 flex-col justify-between py-1">
        <div>
          <div className="flex items-center justify-between">
            <Skeleton variant="rounded" width={88} height={24} sx={{ bgcolor: "rgba(255,255,255,0.10)" }} />
            <Skeleton variant="circular" width={30} height={30} sx={{ bgcolor: "rgba(255,255,255,0.10)" }} />
          </div>

          <Skeleton variant="text" width="44%" height={26} sx={{ mt: 1.5, bgcolor: "rgba(255,255,255,0.10)" }} />
          <Skeleton variant="text" width="34%" height={20} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
        </div>

        <div className="flex gap-5">
          <Skeleton variant="rounded" width={42} height={18} sx={{ bgcolor: "rgba(255,255,255,0.09)" }} />
          <Skeleton variant="rounded" width={42} height={18} sx={{ bgcolor: "rgba(255,255,255,0.09)" }} />
          <Skeleton variant="rounded" width={42} height={18} sx={{ bgcolor: "rgba(255,255,255,0.09)" }} />
        </div>
      </div>
    </article>
  )
}


export default function ProfileRecipeGridSkeleton({viewMode, count = 8}: ProfileRecipeGridSkeletonProps) {
    if (viewMode === "list") {
        return (
            <section className="mt-6 grid gap-2">
                {Array.from({ length: Math.min(count, 6) }).map((_, index) => (
                    <ProfileRecipeListCardSkeleton key={index} />
                ))}
            </section>
        )
    }

  return (
    <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProfileRecipeGridCardSkeleton key={index} />
      ))}
    </section>
  )
}
