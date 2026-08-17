import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded"

import { PostRecipeStepDraft } from "../../types/postRecipe.types"

import { motion } from "motion/react"

interface AddStepMiniFormProps {
  value: PostRecipeStepDraft
  onChange: (value: PostRecipeStepDraft) => void
  onCancel: () => void
  onConfirm: () => void
}

const fieldClass = "w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--input-placeholder)] hover:border-[var(--border-strong)] hover:bg-[var(--input-bg-hover)] focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]"

export default function AddStepMiniForm({
    value,
    onChange,
    onCancel,
    onConfirm
}: AddStepMiniFormProps) {
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        onChange({
            ...value,
            image: file,
            imagePreview: URL.createObjectURL(file),
        })
    }

    const canConfirm = value.description.trim().length > 0

  return (
    <motion.div
      initial={{ height: 0, opacity: 0, y: -6 }}
      animate={{ height: "auto", opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: -6 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
        <div className="flex flex-col gap-3">
          <input
            value={value.title}
            onChange={(event) =>
              onChange({ ...value, title: event.target.value })
            }
            placeholder="Step title (optional)"
            className={fieldClass}
          />

          <textarea
            value={value.description}
            onChange={(event) =>
              onChange({ ...value, description: event.target.value })
            }
            placeholder="Describe this cooking step..."
            rows={4}
            className={`${fieldClass} resize-none leading-7`}
          />

          <label className="group relative flex h-[190px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--input-bg)] transition hover:border-[var(--accent-border)]">
            {value.imagePreview ? (
              <>
                <img
                  src={value.imagePreview}
                  alt="Step preview"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-black/0 transition duration-200 group-hover:bg-black/25" />

                <div className="absolute right-3 top-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--dropdown-bg)] px-4 py-2 text-sm text-[var(--text-primary)] backdrop-blur-xl"
                >
                  <CameraAltRoundedIcon sx={{ fontSize: 15 }} />
                  Change
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-[var(--text-muted)] transition group-hover:text-[var(--accent-text)]">
                <ImageOutlinedIcon sx={{ fontSize: 30 }} />
                <span className="text-sm">Upload step image</span>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--button-danger-border)] bg-[var(--button-danger-bg)] text-[var(--button-danger-text)] transition hover:bg-[var(--button-danger-hover)] active:scale-95"
            >
              <CloseRoundedIcon sx={{ fontSize: 19 }} />
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--button-success-border)] bg-[var(--button-success-bg)] text-[var(--button-success-text)] transition hover:bg-[var(--button-success-hover)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckRoundedIcon sx={{ fontSize: 20 }} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
