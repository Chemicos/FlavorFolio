import { CircularProgress } from '@mui/material'
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded"

interface ProfileContentLockedStateProps {
  username: string
  isFollowLoading: boolean
  isPrivate?: boolean
  onFollow: () => void
}

export default function ProfileContentLockedState({ 
    username, 
    isFollowLoading, 
    isPrivate, 
    onFollow 
}: ProfileContentLockedStateProps) {
  return (
    <section className="mt-8 flex min-h-[270px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#111216]/70 px-6 py-12 text-center">
    <div className="max-w-[460px]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/15 bg-orange-500/[0.08] text-orange-200">
        <LockOutlinedIcon sx={{ fontSize: 25 }} />
        </div>

        <h3 className="mt-5 text-lg font-bold text-white">
        {isPrivate
            ? "This profile is private"
            : "Follow to view this profile’s recipes"}
        </h3>

        <p className="mx-auto mt-2 max-w-[420px] text-sm leading-6 text-[#8f97b1]">
        {isPrivate
            ? `${username} has limited access to their profile content.`
            : `${username} shares recipes with followers only. Follow this account to see their published recipes.`}
        </p>

        {!isPrivate && (
        <button
            type="button"
            disabled={isFollowLoading}
            onClick={onFollow}
            className="mt-6 inline-flex h-10 min-w-[130px] items-center justify-center gap-2 rounded-lg border border-orange-400/20 bg-orange-500/10 px-5 text-sm font-semibold text-orange-100 transition hover:border-orange-400/30 hover:bg-orange-500/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
            {isFollowLoading ? (
            <CircularProgress
                size={16}
                thickness={5}
                sx={{ color: "#fed7aa" }}
            />
            ) : (
            <>
                <PersonAddAltRoundedIcon sx={{ fontSize: 18 }} />
                Follow
            </>
            )}
        </button>
        )}
    </div>
    </section>
  )
}
