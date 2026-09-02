interface RecipeGridSkeletonProps {
    count?: number
}

function RecipeCardSkeleton() {
  return (
    <div
    aria-hidden="true"
    className="relative h-[370px] overflow-hidden rounded-lg border border-white/10 bg-[#111216]"
    >
        {/* Image skeleton */}
        <div className="absolute inset-0 animate-pulse bg-white/[0.055]" />

        {/* Ambient image shapes */}
        <div className="absolute -left-12 top-16 h-48 w-48 rounded-full bg-white/[0.025] blur-3xl" />
        <div className="absolute -right-10 top-2 h-40 w-40 rounded-full bg-[#feaa2b]/[0.025] blur-3xl" />

        {/* Dark gradient, same structure as the real card */}
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/90 via-black/55 to-transparent" />

        {/* Author */}
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/[0.06] bg-black/20 px-2.5 py-2 backdrop-blur-xl">
            <div className="h-7 w-7 animate-pulse rounded-full bg-white/10" />
            <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/10" />
        </div>

        {/* Bookmark */}
        <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-xl">
            <div className="h-5 w-4 animate-pulse rounded bg-white/10" />
        </div>

        {/* Card content */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-3">
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/15" />

            <div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-white/[0.08]" />

            <div className="mt-7 flex items-center gap-4">
            <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-pulse rounded bg-amber-300/15" />
                <div className="h-3 w-7 animate-pulse rounded-full bg-white/10" />
            </div>

            <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-5 animate-pulse rounded-full bg-white/10" />
            </div>

            <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-5 animate-pulse rounded-full bg-white/10" />
            </div>
            </div>
        </div>

        <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[recipe-skeleton-shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/[0.035] to-transparent" />
    </div>
  )
}


export default function RecipeGridSkeleton({count = 12}: RecipeGridSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading recipes"
      className="mx-auto grid w-full max-w-[1472px] grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
        {Array.from({ length: count }, (_, index) => (
            <RecipeCardSkeleton key={index} />
        ))}

        <span className="sr-only">Loading recipes...</span>
    </div>
  )
}
