import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined"
import LinkRoundedIcon from "@mui/icons-material/LinkRounded"
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined"

interface MyProfileHeaderProps {
  username?: string
  fullName?: string
  bio?: string
  profileImage?: string
  bannerImage?: string
  location?: string
  website?: string
  joinedLabel?: string
  recipesCount?: number
  followersCount?: number
  followingCount?: number
  savesCount?: number
  onEditProfile?: () => void
  onChangeAvatar?: (file: File) => void
  isAvatarUploading?: boolean
  onChangeBanner?: (file: File) => void
  isBannerUploading?: boolean
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export default function MyProfileHeader({
  username = "Username",
  fullName,
  bio = "Food lover & recipe creator. Sharing simple, delicious recipes that anyone can make at home.",
  profileImage = "",
  bannerImage = "",
  location = "Bucharest, RO",
  website = "flavorfolio.com",
  joinedLabel = "Joined recently",
  recipesCount = 0,
  followersCount = 0,
  followingCount = 0,
  savesCount = 0,
  onEditProfile,
  onChangeAvatar,
  isAvatarUploading = false,
  onChangeBanner,
  isBannerUploading = false,
}: MyProfileHeaderProps) {
  const displayName = fullName || username

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0c] ">
      <div className="relative h-[300px] overflow-hidden">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={`${displayName} banner`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.18),transparent_32%),linear-gradient(135deg,#202636,#16181d_45%,#0b0b0c)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/45 to-black/20" />

        <label className="absolute right-5 top-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-[#0b0b0c]/70 px-4 text-sm text-[#d7def0] backdrop-blur-xl transition hover:bg-[#16181d] hover:text-white">
          <CameraAltRoundedIcon sx={{ fontSize: 16 }} />
          {isBannerUploading ? "Uploading..." : "Change banner"}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isBannerUploading}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return

              onChangeBanner?.(file)
              event.target.value = ""
            }}
          />
        </label>

        <div className="absolute bottom-8 left-8 right-8 flex items-end gap-6">
          <div className="relative h-36 w-36 shrink-0 rounded-full border-4 border-[#0b0b0c] bg-[#16181d] p-1 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            {profileImage ? (
              <img
                src={profileImage}
                alt={displayName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10 text-4xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <label className="absolute bottom-2 right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-[#202429] text-white shadow-lg transition hover:bg-[#16181d]">
              <CameraAltRoundedIcon sx={{ fontSize: 19 }} />

              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isAvatarUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return

                  onChangeAvatar?.(file)
                  event.target.value = ""
                }}
              />
            </label>
          </div>

          <div className="min-w-0 pb-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-[2rem] font-bold text-white">
                {displayName}
              </h1>

              <button
                type="button"
                onClick={onEditProfile}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-orange-400/25 bg-orange-500/20 px-4 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/30"
              >
                <EditRoundedIcon sx={{ fontSize: 17 }} />
                Edit profile
              </button>
            </div>

            <p className="mt-1 text-sm font-medium text-[#a8b3cf]">
              @{username}
            </p>

            <p className="mt-3 max-w-[640px] text-sm leading-6 text-[#d7def0]">
              {bio}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-[#a8b3cf]">
              <span className="inline-flex items-center gap-1.5">
                <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
                {location}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <LinkRoundedIcon sx={{ fontSize: 16 }} />
                {website}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
                {joinedLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 divide-x divide-white/10 bg-[#111318]/80">
        {[
          { label: "Recipes", value: recipesCount },
          { label: "Followers", value: followersCount },
          { label: "Following", value: followingCount },
          { label: "Saves", value: savesCount },
        ].map((stat) => (
          <div key={stat.label} className="px-6 py-6 text-center">
            <p className="text-2xl font-bold text-white">
              {formatCompactNumber(stat.value)}
            </p>
            <p className="mt-1 text-sm text-[#8f97b1]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
