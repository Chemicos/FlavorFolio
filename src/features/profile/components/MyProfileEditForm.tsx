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

const inputClass = "h-11 w-full rounded-lg border border-white/10 bg-[#0b0b0c] px-4 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-orange-400/50 focus:ring-2 focus:ring-orange-500/10"

const textareaClass = "min-h-[110px] w-full resize-none rounded-lg border border-white/10 bg-[#0b0b0c] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-orange-400/50 focus:ring-2 focus:ring-orange-500/10"

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
      className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0c]"
    >
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.12),transparent_32%),linear-gradient(135deg,#171a20,#0b0b0c)] px-8 py-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Edit profile</h2>
            <p className="mt-1 text-sm text-[#8f97b1]">
              Update your public FlavorFolio profile details.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#a8b3cf] transition hover:bg-white/[0.08] hover:text-white disabled:opacity-60"
          >
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
      </div>

      <div className="grid gap-5 px-8 py-7 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#d7def0]">
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
          <label className="mb-2 block text-sm font-medium text-[#d7def0]">
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
          <label className="mb-2 block text-sm font-medium text-[#d7def0]">
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
          <label className="mb-2 block text-sm font-medium text-[#d7def0]">
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
          <label className="mb-2 block text-sm font-medium text-[#d7def0]">
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
            <label className="text-sm font-medium text-[#d7def0]">Bio</label>
            <span className="text-xs text-[#6f7892]">
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

      <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-[#111318]/70 px-8 py-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="h-10 rounded-lg border border-white/10 px-5 text-sm font-semibold text-[#a8b3cf] transition hover:bg-white/[0.06] hover:text-white disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-10 min-w-[140px] items-center justify-center gap-2 rounded-lg border border-orange-400/25 bg-orange-500/20 px-5 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? (
            <CircularProgress size={17} thickness={5} sx={{ color: "#fed7aa" }} />
          ) : (
            <SaveRoundedIcon sx={{ fontSize: 18 }} />
          )}
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  )
}
