import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded"
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded"
import SettingsBrightnessRoundedIcon from "@mui/icons-material/SettingsBrightnessRounded"
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded"

import { AppLanguage, AppTheme } from "../types/preferences.types"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import { useAppPreferences } from "../hooks/useAppPreferences"
import PostRecipeSelectDropdown from "../../home/components/post-recipe/PostRecipeSelectDropdown"
import { CircularProgress } from "@mui/material"
import AccountSettingsSectionHeader from "./AccountSettingsSectionHeader"

const languageOptions = [
  {
    value: "en",
    label: "English",
  },
  {
    value: "ro",
    label: "Romanian",
  },
]

const themes: Array<{
  value: AppTheme
  label: string
  description: string
  icon: React.ReactNode
}> = [
  {
    value: "dark",
    label: "Dark",
    description: "Use FlavorFolio's default dark appearance.",
    icon: (
      <DarkModeRoundedIcon sx={{ fontSize: 20 }} />
    ),
  },
  {
    value: "light",
    label: "Light",
    description: "Use a brighter appearance throughout the app.",
    icon: (
      <LightModeRoundedIcon sx={{ fontSize: 20 }} />
    ),
  },
  {
    value: "system",
    label: "System",
    description: "Match the appearance of your device.",
    icon: (
      <SettingsBrightnessRoundedIcon sx={{ fontSize: 20 }}/>
    ),
  },
]

export default function PreferencesSettingsSection() {
  const { showSnackbar } = useSnackbar()

  const {
    preferences,
    isLoading,
    savingKey,
    updateTheme,
    updateLanguage,
  } = useAppPreferences()


  const handleThemeChange = async ( theme: AppTheme ) => {
    try {
      await updateTheme(theme)

      showSnackbar("Appearance preference updated.", "success")
    } catch (error) {
      console.error("Failed to update theme:", error)

      showSnackbar("Failed to update appearance preference.", "error")
    }
  }

  const handleLanguageChange = async ( value: string ) => {
    const language = value as AppLanguage

    try {
      await updateLanguage(language)

      showSnackbar("Language preference updated.", "success")
    } catch (error) {
      console.error("Failed to update language:", error)

      showSnackbar("Failed to update language preference.", "error")
    }
  }

  return (
    <section>
      <AccountSettingsSectionHeader
        title="Preferences"
        description="Customize FlavorFolio's appearance and language."
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <CircularProgress
            size={30}
            sx={{ color: "#feaa2b" }}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors duration-200">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Appearance
            </h3>

            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Choose how FlavorFolio looks on this device.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {themes.map((theme) => {
                const isSelected = preferences.theme === theme.value
                const isSavingThis = savingKey === "theme"

                return (
                  <button
                    key={theme.value}
                    type="button"
                    disabled={Boolean(savingKey)}
                    onClick={() =>
                      handleThemeChange(
                        theme.value
                      )
                    }
                    className={[
                      "rounded-xl border p-4 text-left shadow-[var(--shadow-card)] transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
                      isSelected
                        ? "border-[var(--accent-border)] bg-[var(--accent-soft)]"
                        : "border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--border-strong)] hover:bg-[var(--card-hover)]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-lg transition",
                        isSelected
                          ? "bg-[var(--accent-soft-hover)] text-[var(--accent-text)]"
                          : "bg-[var(--surface-subtle)] text-[var(--text-secondary)]",
                      ].join(" ")}
                    >
                      {isSavingThis && isSelected ? (
                        <CircularProgress size={18} thickness={5} sx={{color: "var(--accent)",}}
                        />
                      ) : (
                        theme.icon
                      )}
                    </div>

                    <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                      {theme.label}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                      {theme.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors duration-200">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-subtle)] text-[var(--text-secondary)]">
                <LanguageRoundedIcon
                  sx={{ fontSize: 20 }}
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Language
                </h3>

                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Choose the language used in the application.
                </p>
              </div>
            </div>

            <div className="mt-5 max-w-[320px]">
              <PostRecipeSelectDropdown
                value={preferences.language}
                options={languageOptions}
                onChange={handleLanguageChange}
                placeholder="Select language"
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
              Language selection is saved now. Full interface
              translation will be applied as localization is introduced.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
