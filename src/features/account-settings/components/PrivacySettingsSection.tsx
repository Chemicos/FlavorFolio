import { useEffect, useState } from "react"
import AccountSettingsSectionHeader from "./AccountSettingsSectionHeader"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { ProfileVisibility, subscribeToPrivacySettings, updatePrivacySettings } from "../services/privacy.service"
import { CircularProgress } from "@mui/material"

// type ProfileVisibility = "public" | "followers" | "private"
// type MessagePrivacy = "everyone" | "followers" | "only_me"

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
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={[
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
        "transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:opacity-60",
        checked
          ? "bg-[var(--accent-soft)]"
          : "hover:bg-[var(--surface-hover)]",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          "transition-colors duration-200",
          checked
            ? "border-[var(--accent)] bg-[var(--accent-soft-hover)]"
            : "border-[var(--border-strong)] bg-transparent group-hover:border-[var(--text-muted)]",
        ].join(" ")}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
      </span>

      <span>
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        {description && (
          <span className="ml-2 text-xs text-[var(--text-muted)]">{description}</span>
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
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={[
        "relative h-6 w-11 shrink-0 rounded-full border",
        "transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        checked
          ? "border-[var(--accent-border)] bg-[var(--accent)]"
          : "border-[var(--border-strong)] bg-[var(--surface-muted)] hover:bg-[var(--surface-active)]",
      ].join(" ")}
      aria-label="Toggle profile discoverability"
    >
      <span
        className={[
          "absolute top-1 h-4 w-4 rounded-full shadow-sm",
          "transition-all duration-200",
          checked
            ? "left-6 bg-[var(--text-on-accent)]"
            : "left-1 bg-[var(--text-muted)]",
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
  // const [messagePrivacy, setMessagePrivacy] = useState<MessagePrivacy>("everyone")
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
        description="Control who can see your profile and discover your account."
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <CircularProgress size={30} sx={{ color: "#feaa2b" }} />
        </div>
      ): (
        <div className="mt-8 space-y-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition-colors duration-200">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Profile visibility</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Who can see your profile?</p>

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
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition-colors duration-200">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Discoverability</h3>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Show profile in search
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
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
