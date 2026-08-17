import CircularProgress from "@mui/material/CircularProgress"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import SaveRoundedIcon from "@mui/icons-material/SaveRounded"

import { useEffect, useState } from "react"
import { MyProfileData, UpdateMyProfilePayload } from "../services/profile.service"

interface MyProfileEditFormProps {
  profile: (MyProfileData & {
    fullName: string
    joinedLabel: string
  }) | null
  isSaving?: boolean
  onCancel: () => void
  onSave: (payload: UpdateMyProfilePayload) => Promise<void> | void
}

const inputClass = [
  "h-11 w-full rounded-lg border px-4 text-sm outline-none transition",
  "border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]",
  "placeholder:text-[var(--input-placeholder)]",
  "hover:border-[var(--border-strong)] hover:bg-[var(--input-bg-hover)]",
  "focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]",
].join(" ")

const textareaClass = [
  "min-h-[110px] w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none transition",
  "border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]",
  "placeholder:text-[var(--input-placeholder)]",
  "hover:border-[var(--border-strong)] hover:bg-[var(--input-bg-hover)]",
  "focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]",
].join(" ")

export default function MyProfileEditForm({
    profile,
    isSaving = false,
    onCancel,
    onSave,
}: MyProfileEditFormProps) {
     const [form, setForm] = useState<UpdateMyProfilePayload>({
        firstName: "",
        lastName: "",
        username: "",
        bio: "",
        location: "",
        website: "",
    })

    useEffect(() => {
        if (!profile) return

        setForm({
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            username: profile.username || "",
            bio: profile.bio || "",
            location: profile.location || "",
            website: profile.website || "",
        })
    }, [profile])

    const handleChange = (field: keyof UpdateMyProfilePayload, value: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        await onSave(form)
    }
  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--profile-header-bg)] shadow-[var(--shadow-card)] transition-colors"
    >
      <div 
        className="border-b border-[var(--border)] px-8 py-7" 
         style={{
          background:
            "radial-gradient(circle at 20% 20%, var(--accent-soft-hover), transparent 34%), var(--bg-tertiary)",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Edit profile</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Update your public FlavorFolio profile details.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className={[
              "flex h-10 w-10 items-center justify-center rounded-lg border transition",
              "border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)]",
              "text-[var(--button-secondary-text)]",
              "hover:bg-[var(--button-secondary-hover)] hover:text-[var(--text-primary)]",
              "disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
          >
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
      </div>

      <div className="grid gap-5 px-8 py-7 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            First name
          </label>
          <input
            value={form.firstName}
            onChange={(event) => handleChange("firstName", event.target.value)}
            className={inputClass}
            placeholder="First name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Last name
          </label>
          <input
            value={form.lastName}
            onChange={(event) => handleChange("lastName", event.target.value)}
            className={inputClass}
            placeholder="Last name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Username
          </label>
          <input
            value={form.username}
            onChange={(event) => handleChange("username", event.target.value)}
            className={inputClass}
            placeholder="Username"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Location
          </label>
          <input
            value={form.location}
            onChange={(event) => handleChange("location", event.target.value)}
            className={inputClass}
            placeholder="Bucharest, RO"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Website
          </label>
          <input
            value={form.website}
            onChange={(event) => handleChange("website", event.target.value)}
            className={inputClass}
            placeholder="https://flavorfolio.com/username"
          />
        </div>

        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Bio</label>
            <span className="text-xs text-[var(--text-muted)]">
              {form.bio.length}/160 characters
            </span>
          </div>

          <textarea
            value={form.bio}
            maxLength={160}
            onChange={(event) => handleChange("bio", event.target.value)}
            className={textareaClass}
            placeholder="Tell people what you cook and share..."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--surface-subtle)] px-8 py-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className={[
            "h-10 rounded-lg border px-5 text-sm font-semibold transition",
            "border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)]",
            "text-[var(--button-secondary-text)]",
            "hover:bg-[var(--button-secondary-hover)] hover:text-[var(--text-primary)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
          ].join(" ")}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className={[
            "inline-flex h-10 min-w-[140px] items-center justify-center gap-2 rounded-lg border px-5 text-sm font-semibold transition",
            "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]",
            "hover:bg-[var(--accent-soft-hover)]",
            "disabled:cursor-not-allowed disabled:opacity-70",
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
    </form>
  )
}
