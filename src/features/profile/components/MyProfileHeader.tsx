import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined"
import LinkRoundedIcon from "@mui/icons-material/LinkRounded"
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined"
import ProfileRestrictionBadge from "./ProfileRestrictionBadge"

interface UserRestrictions {
  canPostRecipes: boolean
  canPostReels: boolean
  canComment: boolean
}

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

  restrictions?: UserRestrictions

  onEditProfile?: () => void
  onChangeAvatar?: (file: File) => void
  isAvatarUploading?: boolean
  onChangeBanner?: (file: File) => void
  isBannerUploading?: boolean
  onFollowersClick?: () => void
  onFollowingClick?: () => void
  rightAction?: React.ReactNode
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

  restrictions = {
    canPostRecipes: true,
    canPostReels: true,
    canComment: true,
  },

  onEditProfile,
  onChangeAvatar,
  isAvatarUploading = false,
  onChangeBanner,
  isBannerUploading = false,
  onFollowersClick,
  onFollowingClick,
  rightAction,
}: MyProfileHeaderProps) {
  const displayName = fullName || username

  const activeRestrictions = [
    !restrictions.canPostRecipes
      ? {key: "recipes", label: "Recipe posting restricted",} : null,
    !restrictions.canPostReels
      ? {key: "reels", label: "Reel posting restricted",} : null,
    !restrictions.canComment
      ? {key: "comments", label: "Commenting restricted"} : null,
  ].filter(Boolean) as {
    key: string
    label: string
  }[]

  const hasRestrictions = activeRestrictions.length > 0

  const restrictionBadgeLabel = activeRestrictions.length > 1 ? "Account limitations" : activeRestrictions[0]?.label

  return (
    <section className="relative z-50 rounded-xl border border-[var(--border)] bg-[var(--profile-header-bg)] shadow-[var(--shadow-card)] transition-colors">
      <div className="relative h-[300px]">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={`${displayName} banner`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[image:var(--profile-banner-fallback)]" />
        )}

        <div className="absolute inset-0" style={{background: "var(--profile-banner-overlay)"}} />

        {onChangeBanner && (
          <label className="absolute right-5 top-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--profile-floating-control-border)] bg-[var(--profile-floating-control-bg)] px-4 text-sm font-medium text-[var(--profile-floating-control-text)] shadow-[var(--shadow-card)] backdrop-blur-xl transition hover:bg-[var(--profile-floating-control-hover)]">
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
        )}

        <div className="absolute bottom-8 left-8 right-8 flex items-end gap-6">
          <div className="relative h-36 w-36 shrink-0 rounded-full border border-[var(--profile-avatar-ring)] bg-[var(--profile-avatar-bg)] shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            {profileImage ? (
              <img
                src={profileImage}
                alt={displayName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--surface-muted)] text-4xl font-bold text-[var(--text-primary)]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            {onChangeAvatar && (
              <label className="absolute bottom-2 right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--profile-floating-control-border)] bg-[var(--profile-floating-control-bg)] text-[var(--profile-floating-control-text)] shadow-lg transition hover:bg-[var(--profile-floating-control-hover)]">
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
            )}
          </div>

          <div className="min-w-0 pb-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-[2rem] font-bold text-[var(--profile-overlay-text)]">
                {displayName}
              </h1>

              {onEditProfile && (
                <button
                  type="button"
                  onClick={onEditProfile}
                  className={[
                    "inline-flex h-9 items-center gap-2 rounded-lg border px-4",
                    "border-[var(--profile-edit-border)] bg-[var(--profile-edit-bg)]",
                    "text-sm font-semibold text-[var(--profile-edit-text)]",
                    "shadow-[var(--shadow-card)] transition",
                    "hover:bg-[var(--profile-edit-hover)] active:scale-[0.98]",
                  ].join(" ")}

                >
                  <EditRoundedIcon sx={{ fontSize: 17 }} />
                  Edit profile
                </button>
              )}

              {hasRestrictions && (
                <ProfileRestrictionBadge label={restrictionBadgeLabel} restrictions={activeRestrictions} />
              )}

              {rightAction}
            </div>

            <p className="mt-1 text-sm font-medium text-[var(--profile-overlay-text-muted)]">
              @{username}
            </p>

            <p className="mt-3 max-w-[640px] text-sm leading-6 text-[var(--profile-overlay-text-secondary)]">
              {bio}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-[var(--profile-overlay-text-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
                {location}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <LinkRoundedIcon sx={{ fontSize: 16 }} />
                <a href={`${website}` } target="_blank">{website}</a>
              </span>

              <span className="inline-flex items-center gap-1.5">
                <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
                {joinedLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-[var(--border)] bg-[var(--profile-stats-bg)]">
        {[
          { label: "Recipes", value: recipesCount },
          { label: "Followers", value: followersCount, onClick: onFollowersClick },
          { label: "Following", value: followingCount, onClick: onFollowingClick },
        ].map((stat) => {
          const isClickable = Boolean(stat.onClick)

          return (
            <button
              key={stat.label}
              type="button"
              onClick={stat.onClick}
              disabled={!isClickable}
              className={[
                "px-6 py-6 text-center transition",
                isClickable
                  ? "cursor-pointer hover:bg-[var(--profile-stat-hover)]"
                  : "cursor-default",
              ].join(" ")}
            >
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {formatCompactNumber(stat.value)}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{stat.label}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
