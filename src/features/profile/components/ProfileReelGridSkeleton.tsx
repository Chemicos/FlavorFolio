import { ProfileRecipeViewMode } from "./ProfileContentToolbar"

interface ProfileReelGridSkeletonProps {
  viewMode: ProfileRecipeViewMode
  count?: number
}

function ProfileReelListSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-3">
      <div className="h-32 w-24 shrink-0 animate-pulse rounded-xl bg-[var(--surface-muted)]" />

      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div>
          <div className="h-6 w-20 animate-pulse rounded-md bg-[var(--surface-muted)]" />
          <div className="mt-3 h-5 w-48 max-w-[60%] animate-pulse rounded bg-[var(--surface-muted)]" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-[var(--surface-muted)]" />
          <div className="mt-2 h-4 w-64 max-w-[80%] animate-pulse rounded bg-[var(--surface-muted)]" />
        </div>

        <div className="mt-4 flex gap-5">
          <div className="h-4 w-10 animate-pulse rounded bg-[var(--surface-muted)]" />
          <div className="h-4 w-10 animate-pulse rounded bg-[var(--surface-muted)]" />
          <div className="h-4 w-10 animate-pulse rounded bg-[var(--surface-muted)]" />
        </div>
      </div>
    </div>
  )
}

export default function ProfileReelGridSkeleton({viewMode, count = 10} : ProfileReelGridSkeletonProps) {
  if (viewMode === "list") {
    return (
      <section className="mb-6 grid gap-2">
        {Array.from({length: Math.min(count, 6)}).map((_, index) => (
          <ProfileReelListSkeleton key={index} />
        ))}
      </section>
    )
  }
  return (
    <section className="mb-6 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({length: count}).map((_, index) => (
        <div 
          key={index} 
          className="aspect-[9/14] animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]"
        />
      ))}
    </section>
  )
}


