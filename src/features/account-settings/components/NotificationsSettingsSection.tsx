import { useEffect, useState } from "react"
import AccountSettingsSectionHeader from "./AccountSettingsSectionHeader"
import { defaultNotificationPreferences, NotificationPreferences, subscribeToNotificationPreferences, updateNotificationPreference } from "../services/notificationsSettings.service"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { CircularProgress } from "@mui/material"

interface NotificationOption {
  id: keyof NotificationPreferences
  label: string
}

interface NotificationGroup {
  title: string
  options: NotificationOption[]
}

const notificationGroups: NotificationGroup[] = [
  {
    title: "Social activity",
    options: [
      { id: "newFollowers", label: "New followers" },
      { id: "followRequests", label: "Follow requests" },
    ],
  },
  {
    title: "Recipe activity",
    options: [
      { id: "recipeRatings", label: "Rating on my recipes" },
      { id: "recipeComments", label: "Comments on my recipes" },
      { id: "commentReplies", label: "Replies to my comments" },
      { id: "recipeSaves", label: "Saves of my recipes" },
    ],
  },
  {
    title: "Recipe status",
    options: [
      { id: "recipeApproved", label: "Recipe approved" },
      { id: "recipeRejected", label: "Recipe rejected" },
      { id: "adminFeedback", label: "Admin feedback" },
    ],
  },
  {
    title: "Messages",
    options: [{ id: "directMessages", label: "Direct messages" }],
  },
]

export default function NotificationsSettingsSection() {
  const {showSnackbar} = useSnackbar()

  const [userId, setUserId] = useState<string | null>(null)
  const [settings, setSettings] = useState<NotificationPreferences>(
    defaultNotificationPreferences
  )

  const [isLoading, setIsLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<keyof NotificationPreferences | null>(null)

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

    const unsubscribe = subscribeToNotificationPreferences({
      userId,
      onChange: (result) => {
        setSettings(result)
        setIsLoading(false)
      },
      onError: (error) => {
        console.error("Failed to load notification settings:", error)
        showSnackbar("Failed to load notification settings.", "error")
        setIsLoading(false)
      },
    })

    return () => unsubscribe()
  }, [userId, showSnackbar])

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (!userId || savingKey) return

    const previousValue = settings[key]
    const nextValue = !previousValue

    setSettings((prev) => ({
      ...prev,
      [key]: nextValue,
    }))

    try {
      setSavingKey(key)

      await updateNotificationPreference({
        userId,
        key,
        value: nextValue,
      })

      showSnackbar("Notification preference updated.", "success")
    } catch (error) {
      console.error("Failed to update notification preference:", error)

      setSettings((prev) => ({
        ...prev,
        [key]: previousValue,
      }))

      showSnackbar("Failed to update notification preference.", "error")
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <section>
      <AccountSettingsSectionHeader
        title="Notifications"
        description="Choose which activities should notify you inside FlavorFolio."
      />

      <div className="mt-8 rounded-2xl border border-white/10 p-7">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <CircularProgress size={30} sx={{ color: "#feaa2b" }} />
          </div>
        ) : (
          <div className="space-y-8">
            {notificationGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-base font-bold text-white">{group.title}</h3>

                <div className="mt-4 space-y-3">
                  {group.options.map((option) => {
                    const checked = Boolean(settings[option.id])
                    const isSavingThis = savingKey === option.id

                    return (
                      <label
                        key={option.id}
                        className={[
                          "flex items-center gap-3",
                          savingKey
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={Boolean(savingKey)}
                          onChange={() => handleToggle(option.id)}
                          className="peer hidden"
                        />

                        <div className="flex h-[18px] w-[18px] items-center justify-center rounded border border-[#a8b3cf] bg-transparent transition peer-checked:border-orange-400 peer-checked:bg-orange-400">
                          {isSavingThis ? (
                            <CircularProgress
                              size={10}
                              thickness={5}
                              sx={{ color: checked ? "#0b0b0c" : "#a8b3cf" }}
                            />
                          ) : checked ? (
                            <svg
                              viewBox="0 0 24 24"
                              className="h-3.5 w-3.5 text-[#0b0b0c]"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : null}
                        </div>

                        <span className="text-sm text-[#a8b3cf]">
                          {option.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
