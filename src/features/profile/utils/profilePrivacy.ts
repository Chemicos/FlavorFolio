import { ProfileVisibility } from "../../account-settings/services/privacy.service"

interface CanViewProfileContentParams {
  profileVisibility: ProfileVisibility
  isOwnProfile: boolean
  isFollowingProfile: boolean
}

export function canViewProfileContent({
  profileVisibility,
  isOwnProfile,
  isFollowingProfile,
}: CanViewProfileContentParams) {
  if (isOwnProfile) return true

  switch (profileVisibility) {
    case "public":
      return true

    case "followers":
      return isFollowingProfile

    default:
      return true
  }
}