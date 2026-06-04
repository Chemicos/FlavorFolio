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

const fieldClass = "w-full rounded-lg border border-white/10 bg-[#0b0b0c] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-orange-400/50 focus:ring-2 focus:ring-orange-500/10"

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
      <div className="rounded-xl border border-white/10 bg-[#0b0b0c]/70 p-3">
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

          <label className="group relative flex h-[190px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/10 bg-[#090909] transition hover:border-orange-400/30">
            {value.imagePreview ? (
              <>
                <img
                  src={value.imagePreview}
                  alt="Step preview"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-black/0 transition duration-200 group-hover:bg-black/25" />

                <div className="absolute right-3 top-3 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b0b0c]/70 px-4 py-2 text-sm text-white backdrop-blur-xl"
                >
                  <CameraAltRoundedIcon sx={{ fontSize: 15 }} />
                  Change
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#7f89a6] transition group-hover:text-orange-200">
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
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 transition hover:bg-red-500/20 active:scale-95"
            >
              <CloseRoundedIcon sx={{ fontSize: 19 }} />
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-green-500/20 bg-green-500/10 text-green-300 transition hover:bg-green-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckRoundedIcon sx={{ fontSize: 20 }} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
