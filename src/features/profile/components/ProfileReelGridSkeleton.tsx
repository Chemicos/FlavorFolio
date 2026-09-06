export default function ProfileReelGridSkeleton({count = 10}: {count?: number}) {
  return (
    <section className="my-6 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({length: count}).map((_, index) => (
        <div 
          key={index} 
          className="aspect-[9/14] animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]"
        />
      ))}
    </section>
  )
}
