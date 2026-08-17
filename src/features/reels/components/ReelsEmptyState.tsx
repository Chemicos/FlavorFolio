import MovieRoundedIcon from "@mui/icons-material/MovieRounded"

export default function ReelsEmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#feaa2b]/10 text-[#feaa2b]">
          <MovieRoundedIcon sx={{ fontSize: 30 }} />
        </div>

        <h1 className="mt-5 text-xl font-bold text-white">No reels yet</h1>

        <p className="mt-2 max-w-sm text-sm leading-6 text-[#8f97b1]">
          Short recipe videos will appear here once they are published.
        </p>
      </div>
    </div>
  )
}
