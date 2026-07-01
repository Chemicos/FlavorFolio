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

const inputClass = "h-11 w-full rounded-lg border border-white/10 bg-[#0b0b0c] px-4 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-orange-400/50 focus:ring-2 focus:ring-orange-500/10"

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

      showSnackbar(
        "Failed to delete account. Please enter your current password or sign in again.",
        "error"
      )
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
        <div className="rounded-2xl border border-white/10 p-7">
          <div>
            <h3 className="text-base font-bold text-white">Change password</h3>
            <p className="mt-1 text-sm leading-6 text-[#8f97b1]">
              Use a strong password with uppercase, lowercase, numbers and special characters.
            </p>
          </div>

          <div className="mt-7 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#d7def0]">
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
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8f97b1] transition hover:bg-white/[0.06] hover:text-white"
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
              <label className="mb-2 block text-sm font-medium text-[#d7def0]">
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
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8f97b1] transition hover:bg-white/[0.06] hover:text-white"
                >
                  {showNewPassword ? (
                    <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                  )}
                </button>
              </div>

              {newPassword.trim() && (
                <PasswordStrength password={newPassword} />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#d7def0]">
                Confirm new password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className={`${inputClass} pr-11`}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8f97b1] transition hover:bg-white/[0.06] hover:text-white"
                >
                  {showConfirmPassword ? (
                    <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                  )}
                </button>
              </div>

              {!passwordsMatch && (
                <p className="mt-2 text-xs text-[#ff8b7d]">
                  Passwords do not match.
                </p>
              )}
            </div>
          </div>

          <div className="mt-7 flex justify-end">
            <button
              type="submit"
              disabled={!canSave}
              className="inline-flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-lg border border-orange-400/25 bg-orange-500/20 px-5 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <CircularProgress size={17} thickness={5} sx={{ color: "#fed7aa" }} />
              ) : (
                <SaveRoundedIcon sx={{ fontSize: 18 }} />
              )}
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-red-400/10 bg-red-500/[0.04] p-6">
          <h3 className="text-base font-bold text-white">Danger Zone</h3>
          <p className="mt-1 text-sm leading-6 text-[#8f97b1]">
            Permanently delete your account and all related data. This action cannot be undone.
          </p>

          <button
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-red-400/15 bg-red-500/10 px-4 text-sm font-semibold text-[#ff8b7d] transition hover:bg-red-500/15"
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
        description="Are you sure you want to permanently delete your account, profile, recipes, saved recipes, followers, following, notifications, and related data? This action cannot be undone."
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
