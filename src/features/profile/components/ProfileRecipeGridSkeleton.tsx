import { Skeleton } from "@mui/material"
import { ProfileRecipeViewMode } from "./ProfileRecipeToolbar"

interface ProfileRecipeGridSkeletonProps {
  viewMode: ProfileRecipeViewMode
  count?: number
}

const skeletonBaseSx = {
  bgcolor: "var(--surface-muted)",
  "&::after": {
    background: "linear-gradient(90deg, transparent, var(--surface-hover), transparent)",
  },
}

const skeletonSubtleSx = {
  bgcolor: "var(--surface-subtle)",
  "&::after": {
    background: "linear-gradient(90deg, transparent, var(--surface-hover), transparent)",
  },
}

function ProfileRecipeGridCardSkeleton() {
  return (
    <article className="relative min-h-[370px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{
          ...skeletonBaseSx,
          position: "absolute",
          inset: 0,
          height: "100%",
        }}
      />

      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

      <div className="absolute left-4 top-4">
        <Skeleton
          variant="rounded"
          width={86}
          height={26}
          animation="wave"
          sx={{ ...skeletonSubtleSx, borderRadius: "0.375rem" }}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pt-3">
        <Skeleton
          variant="text"
          width="72%"
          height={26}
          animation="wave"
          sx={{
            bgcolor: "rgba(255,255,255,0.16)",
            "&::after": {
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
            },
          }}
        />

        <Skeleton
          variant="text"
          width="56%"
          height={22}
          animation="wave"
          sx={{
            mt: 0.5,
            bgcolor: "rgba(255,255,255,0.10)",
            "&::after": {
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)",
            },
          }}
        />

        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <Skeleton 
                variant="rounded" 
                width={44} 
                height={18} 
                sx={{
                  bgcolor: "rgba(255,255,255,0.12)",
                  "&::after": {
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)",
                  },
                }}
              />
              <Skeleton 
                variant="rounded" 
                width={44} 
                height={18} 
                sx={{
                  bgcolor: "rgba(255,255,255,0.12)",
                  "&::after": {
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)",
                  },
                }}
              />
              <Skeleton 
                variant="rounded" 
                width={44} 
                height={18} 
                sx={{
                  bgcolor: "rgba(255,255,255,0.12)",
                  "&::after": {
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)",
                  },
                }}
              />
            </div>

            <Skeleton
              variant="circular"
              width={28}
              height={28}
              sx={{
                bgcolor: "rgba(255,255,255,0.12)",
                "&::after": {
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)",
                },
              }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

function ProfileRecipeListCardSkeleton() {
  return (
    <article className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-3 shadow-[var(--shadow-card)]">
      <Skeleton
        variant="rounded"
        width={144}
        height={112}
        animation="wave"
        sx={{ ...skeletonBaseSx, flexShrink: 0, borderRadius: "0.75rem" }}
      />

      <div className="flex flex-1 flex-col justify-between py-1">
        <div>
          <div className="flex items-center justify-between">
            <Skeleton variant="rounded" width={88} height={24} sx={skeletonBaseSx} />
            <Skeleton variant="circular" width={30} height={30} sx={skeletonBaseSx} />
          </div>

          <Skeleton variant="text" width="44%" height={26} sx={{ mt: 1.5, ...skeletonBaseSx }} />
          <Skeleton variant="text" width="34%" height={20} sx={skeletonBaseSx} />
        </div>

        <div className="flex gap-5">
          <Skeleton variant="rounded" width={42} height={18} sx={skeletonBaseSx} />
          <Skeleton variant="rounded" width={42} height={18} sx={skeletonBaseSx} />
          <Skeleton variant="rounded" width={42} height={18} sx={skeletonBaseSx} />
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
