import { CircularProgress } from "@mui/material";


export default function MyProfileEditFormLoading() {
  return (
    <section className="flex min-h-[560px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0c]">
      <div className="flex flex-col items-center gap-4">
        <CircularProgress
          size={34}
          thickness={4.5}
          sx={{ color: "#feaa2b" }}
        />

        <p className="text-sm font-medium text-[#a8b3cf]">
          Loading profile editor...
        </p>
      </div>
    </section>
  )
}
