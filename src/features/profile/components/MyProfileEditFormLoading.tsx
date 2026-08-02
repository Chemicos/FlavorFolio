import { CircularProgress } from "@mui/material";


export default function MyProfileEditFormLoading() {
  return (
    <section className="flex min-h-[560px] items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
      <div className="flex flex-col items-center gap-4">
        <CircularProgress
          size={34}
          thickness={4.5}
          sx={{ color: "var(--accent)" }}
        />

        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Loading profile editor...
        </p>
      </div>
    </section>
  )
}
