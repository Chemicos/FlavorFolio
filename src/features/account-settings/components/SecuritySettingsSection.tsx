import CircularProgress from "@mui/material/CircularProgress"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded"
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded"
import SaveRoundedIcon from "@mui/icons-material/SaveRounded"
import { useMemo, useState } from "react"
import AccountSettingsSectionHeader from "./AccountSettingsSectionHeader"
import PasswordStrength, { passwordCriteria } from "../../auth/pages/components/PasswordStrength"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import { deleteCurrentUserAccount, updateCurrentUserPassword } from "../services/security.service"
import { useNavigate } from "react-router-dom"
import DeleteWarningDialog from "../../home/components/recipe-view-drawer/DeleteWarningDialog"

const inputClass = [
  "h-11 w-full rounded-lg border px-4 text-sm outline-none",
  "border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]",
  "placeholder:text-[var(--input-placeholder)]",
  "transition-colors duration-200",
  "hover:border-[var(--border-strong)] hover:bg-[var(--input-bg-hover)]",
  "focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]",
].join(" ")

const passwordVisibilityButtonClass = [
  "absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg",
  "text-[var(--text-muted)] transition-colors duration-200",
  "hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
  "focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]",
].join(" ")

export default function SecuritySettingsSection() {
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const passwordsMatch = !confirmPassword || newPassword === confirmPassword
  const passwordScore = passwordCriteria(newPassword).filter(c => c.isValid).length

  const canSave =
    currentPassword.trim() &&
    newPassword.trim() &&
    confirmPassword.trim() &&
    passwordScore === 4 &&
    passwordsMatch &&
    !isSaving

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSave) return

    setIsSaving(true)

    try {
      await updateCurrentUserPassword({
        currentPassword,
        newPassword,
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      showSnackbar("Password updated successfully.", "success")
    } catch (error) {
      console.error("Failed to update password:", error)
      showSnackbar("Current password is incorrect or session expired.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return

    try {
      setIsDeletingAccount(true)

      await deleteCurrentUserAccount(currentPassword || undefined)

      showSnackbar("Account deleted successfully.", "success")
      navigate("/", { replace: true })
    } catch (error) {
      console.error("Failed to delete account:", error)

      showSnackbar("Failed to delete account. Please enter your current password or sign in again.", "error")
    } finally {
      setIsDeletingAccount(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <section>
      <AccountSettingsSectionHeader
        title="Security"
        description="Manage your password and account security options."
      />

      <form onSubmit={handleSubmit} className="mt-8 w-full">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-card)] transition-colors duration-200">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Change password</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              Use a strong password with uppercase, lowercase, numbers and special characters.
            </p>
          </div>

          <div className="mt-7 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                Current password
              </label>

              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Current password"
                  className={`${inputClass} pr-11`}
                />

                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className={passwordVisibilityButtonClass}
                >
                  {showCurrentPassword ? (
                    <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                New password
              </label>

              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  className={`${inputClass} pr-11`}
                />

                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className={passwordVisibilityButtonClass}
                >
                  {showNewPassword ? (
                    <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                  )}
                </button>
              </div>

              {newPassword.trim() && (<PasswordStrength password={newPassword} />)}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                Confirm new password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className={`${inputClass} pr-11 ${
                    !passwordsMatch
                      ? "border-[var(--danger-border)] focus:border-[var(--danger)] focus:ring-[var(--danger-soft)]"
                      : ""
                  }`}
                  aria-invalid={!passwordsMatch}
                  aria-describedby={!passwordsMatch ? "password-match-error" : undefined}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className={passwordVisibilityButtonClass}
                >
                  {showConfirmPassword ? (
                    <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                  )}
                </button>
              </div>

              {!passwordsMatch && (
                <p id="password-match-error" className="mt-2 text-xs text-[var(--danger-text)]">
                  Passwords do not match.
                </p>
              )}
            </div>
          </div>

          <div className="mt-7 flex justify-end">
            <button
              type="submit"
              disabled={!canSave}
              className={[
                "inline-flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-lg border px-5",
                "border-[var(--accent-border)] bg-[var(--accent-soft)]",
                "text-sm font-semibold text-[var(--accent-text)]",
                "transition-colors duration-200",
                "hover:bg-[var(--accent-soft-hover)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              {isSaving ? (
                <CircularProgress size={17} thickness={5} sx={{ color: "var(--accent)" }} />
              ) : (
                <SaveRoundedIcon sx={{ fontSize: 18 }} />
              )}
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-6 transition-colors duration-200">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Danger Zone</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Permanently delete your account and all related data. This action cannot be undone.
          </p>

          <button
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
            className={[
              "mt-5 inline-flex h-10 items-center gap-2 rounded-lg border px-4",
              "border-[var(--danger-border)] bg-[var(--danger-soft)]",
              "text-sm font-semibold text-[var(--danger-text)]",
              "transition-colors duration-200",
              "hover:bg-[color-mix(in_srgb,var(--danger-soft),var(--danger)_8%)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--danger-soft)]",
            ].join(" ")}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
            Delete account
          </button>
        </div>
      </form>

      <DeleteWarningDialog 
        isOpen={isDeleteDialogOpen}
        isDeleting={isDeletingAccount}
        title="Delete account?"
        description="Are you sure you want to permanently delete your account, recipes, saved recipes, followers, following, notifications, and any other related data? This action cannot be undone."
        confirmLabel="Delete account"
        onCancel={() => {
          if (isDeletingAccount) return
          setIsDeleteDialogOpen(false)
        }}
        onConfirm={handleDeleteAccount}
      />
    </section>
  )
}
