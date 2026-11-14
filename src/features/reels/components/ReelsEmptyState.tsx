import MovieRoundedIcon from "@mui/icons-material/MovieRounded"

export default function ReelsEmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]">
          <MovieRoundedIcon />
        </div>

        <h1 className="mt-5 text-lg font-bold text-[var(--text-primary)]">No reels yet</h1>

        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
          Short recipe videos will appear here once they are published.
        </p>
      </div>
    </div>
  )
}
