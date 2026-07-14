import { useEffect, useState } from "react"
import AccountSettingsSectionHeader from "./AccountSettingsSectionHeader"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { subscribeToPrivacySettings, updatePrivacySettings } from "../services/privacy.service"
import { CircularProgress } from "@mui/material"

type ProfileVisibility = "public" | "followers" | "private"
type MessagePrivacy = "everyone" | "followers" | "only_me"

function SettingsRadio({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className="flex items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={[
          "flex h-4 w-4 items-center justify-center rounded border transition",
          checked
            ? "border-orange-400 bg-orange-400/20"
            : "border-[#8f97b1] bg-transparent",
        ].join(" ")}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-orange-300" />}
      </span>

      <span>
        <span className="text-sm font-medium text-[#d7def0]">{label}</span>
        {description && (
          <span className="ml-2 text-xs text-[#6f7892]">{description}</span>
        )}
      </span>
    </button>
  )
}

function SettingsToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={[
        "relative h-6 w-11 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60",
        checked
          ? "border-orange-400/30 bg-orange-500/30"
          : "border-white/10 bg-white/10",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 h-4 w-4 rounded-full transition",
          checked ? "left-6 bg-orange-200" : "left-1 bg-[#a8b3cf]",
        ].join(" ")}
      />
    </button>
  )
}

export default function PrivacySettingsSection() {
  const {showSnackbar} = useSnackbar()

  const [userId, setUserId] = useState<string | null>(null)
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>("public")
  const [showInSearch, setShowInSearch] = useState(true)
  const [messagePrivacy, setMessagePrivacy] = useState<MessagePrivacy>("everyone")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const auth = getAuth()

    return onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null)
    })
  }, [])

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const unsubscribe = subscribeToPrivacySettings({
      userId,
      onChange: (settings) => {
        setProfileVisibility(settings.profileVisibility)
        setShowInSearch(settings.showInSearch)
        setIsLoading(false)
      },
      onError: (error) => {
        console.error("Failed to load privacy settings:", error)
        showSnackbar("Failed to load privacy settings.", "error")
        setIsLoading(false)
      },
    })

    return () => unsubscribe()
  }, [userId, showSnackbar])

  const handleVisibilityChange = async (nextValue: ProfileVisibility) => {
    if (!userId || nextValue === profileVisibility || isSaving) return

    try {
      setIsSaving(true)
      setProfileVisibility(nextValue)

      await updatePrivacySettings({
        userId,
        settings: { profileVisibility: nextValue },
      })

      showSnackbar("Profile visibility updated.", "success")
    } catch (error) {
      console.error("Failed to update profile visibility:", error)
      showSnackbar("Failed to update profile visibility.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleSearch = async () => {
    if (!userId || isSaving) return

    const nextValue = !showInSearch

    try {
      setIsSaving(true)
      setShowInSearch(nextValue)

      await updatePrivacySettings({userId, settings: { showInSearch: nextValue }})

      showSnackbar("Discoverability updated.", "success")
    } catch (error) {
      console.error("Failed to update discoverability:", error)
      showSnackbar("Failed to update discoverability.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section>
      <AccountSettingsSectionHeader
        title="Privacy"
        description="Control who can see your profile, message you, and discover your account."
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <CircularProgress size={30} sx={{ color: "#feaa2b" }} />
        </div>
      ): (
        <div className="mt-8 space-y-8">
          <div className="rounded-2xl border border-white/10 p-6">
            <h3 className="text-base font-bold text-white">Profile visibility</h3>
            <p className="mt-1 text-sm text-[#8f97b1]">Who can see your profile?</p>

            <div className="mt-5 space-y-4">
              <SettingsRadio
                label="Everyone"
                description="public"
                checked={profileVisibility === "public"}
                disabled={isSaving}
                onChange={() => handleVisibilityChange("public")}
              />
              <SettingsRadio
                label="Followers only"
                checked={profileVisibility === "followers"}
                disabled={isSaving}
                onChange={() => handleVisibilityChange("followers")}
              />
              <SettingsRadio
                label="Only me"
                description="private"
                checked={profileVisibility === "private"}
                disabled={isSaving}
                onChange={() => handleVisibilityChange("private")}
              />
            </div>
          </div>

          {/* <div className="rounded-2xl border border-white/10  p-6">
            <h3 className="text-base font-bold text-white">Interactions - WIP</h3>
            <p className="mt-1 text-sm text-[#8f97b1]">
              Who can send you messages?
            </p>

            <div className="mt-5 space-y-4">
              <SettingsRadio
                label="Everyone"
                description="default"
                checked={messagePrivacy === "everyone"}
                onChange={() => setMessagePrivacy("everyone")}
              />
              <SettingsRadio
                label="Followers only"
                checked={messagePrivacy === "followers"}
                onChange={() => setMessagePrivacy("followers")}
              />
              <SettingsRadio
                label="Only me"
                checked={messagePrivacy === "only_me"}
                onChange={() => setMessagePrivacy("only_me")}
              />
            </div>
          </div> */}

          <div className="rounded-2xl border border-white/10 p-6">
            <h3 className="text-base font-bold text-white">Discoverability</h3>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#d7def0]">
                  Show profile in search
                </p>
                <p className="mt-1 text-xs text-[#8f97b1]">
                  Allow other users to discover your profile through search.
                </p>
              </div>

              <SettingsToggle
                checked={showInSearch}
                disabled={isSaving}
                onChange={handleToggleSearch}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
