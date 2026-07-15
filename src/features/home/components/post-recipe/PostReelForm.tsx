import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import MovieCreationRoundedIcon from "@mui/icons-material/MovieCreationRounded"

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react"
import { useSnackbar } from "../../../../components/layout/SnackbarProvider"
import { CurrentUserCardData } from "../../types/recipeCard.types"
import { ReelVisibility } from "../../../reels/types/reel.types"
import { createReel } from "../../../reels/services/reels.service"
import { CircularProgress } from "@mui/material"

interface PostReelFormProps {
  currentUser: CurrentUserCardData | null
  onClose: () => void
  onSubmitSuccess: () => void
  onBackToRecipe?: () => void
}

const MAX_DESCRIPTION_LENGTH = 500
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024

const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
]

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds: number) {
  const roundedSeconds = Math.round(seconds)
  const minutes = Math.floor(roundedSeconds / 60)
  const remainingSeconds = roundedSeconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}


export default function PostReelForm({
    currentUser,
    onClose,
    onSubmitSuccess,
    onBackToRecipe,
}: PostReelFormProps) {
    const { showSnackbar } = useSnackbar()

    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [description, setDescription] = useState("")
    const [visibility, setVisibility] = useState<ReelVisibility>("public")

    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [videoPreviewUrl, setVideoPreviewUrl] = useState("")
    const [durationSeconds, setDurationSeconds] = useState(0)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        return () => {
            if (videoPreviewUrl) {
                URL.revokeObjectURL(videoPreviewUrl)
            }
        }
    }, [videoPreviewUrl])

    function clearVideo() {
        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl)
        }

        setVideoFile(null)
        setVideoPreviewUrl("")
        setDurationSeconds(0)

        if (fileInputRef.current) {
           fileInputRef.current.value = ""
        }
    }

    function handleVideoChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]

        if (!file) return

        setFormError(null)

        if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
            setFormError("Please upload an MP4, WebM or MOV video.")
            event.target.value = ""
            return
        }

        if (file.size > MAX_VIDEO_SIZE_BYTES) {
            setFormError("The video cannot exceed 200 MB.")
            event.target.value = ""
            return
        }

        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl)
        }

        setVideoFile(file)
        setVideoPreviewUrl(URL.createObjectURL(file))
        setDurationSeconds(0)
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const normalizedDescription = description.trim()

        if (!currentUser?.uid) {
            showSnackbar("You must be signed in to publish a reel.", "error")
            return
        }

        if (!videoFile) {
            setFormError("Please select a video.")
            return
        }

        if (!normalizedDescription) {
            setFormError("Please add a description.")
            return
        }

        if (!durationSeconds) {
            setFormError("Please wait for the video metadata to load.")
            return
        }

        try {
        setIsSubmitting(true)
        setFormError(null)

        await createReel({
            userId: currentUser.uid,
            username: currentUser.username || "Unknown",
            userProfileImage: currentUser.profileImage ||"",
            description: normalizedDescription,
            visibility,
            videoFile,
            durationSeconds,
        })

        onSubmitSuccess()
        } catch (error) {
            console.error("Failed to publish reel:", error)

            const message =
                error instanceof Error
                ? error.message
                : "Failed to publish reel."

            setFormError(message)
            showSnackbar(message, "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const canSubmit = Boolean(videoFile) && Boolean(description.trim()) && durationSeconds > 0 && !isSubmitting

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-full flex-col"
    >
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#16181d]/95 px-5 py-4 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          {onBackToRecipe && (
            <button
              type="button"
              onClick={onBackToRecipe}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8f97b1] transition hover:bg-white/[0.06] hover:text-white"
              aria-label="Back to recipe form"
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
            </button>
          )}

          <div>
            <h2 className="text-lg font-bold text-white">
              Create reel
            </h2>

            <p className="mt-0.5 text-xs text-[#8f97b1]">
              Share a short cooking video
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8f97b1] transition hover:bg-white/[0.06] hover:text-white"
          aria-label="Close reel form"
        >
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </button>
      </header>

      <div className="flex-1 space-y-6 p-5">
        <section>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">
              Reel video
            </h3>

            <p className="mt-1 text-xs leading-5 text-[#8f97b1]">
              Vertical videos work best. Maximum file size: 200 MB.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleVideoChange}
            className="hidden"
          />

          {videoPreviewUrl && videoFile ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0e11]">
              <div className="relative mx-auto aspect-[9/16] max-h-[520px] max-w-[292px] overflow-hidden bg-black">
                <video
                  src={videoPreviewUrl}
                  controls
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(event) => {
                    const duration = event.currentTarget.duration

                    setDurationSeconds(
                      Number.isFinite(duration) ? duration : 0
                    )
                  }}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {videoFile.name}
                  </p>

                  <p className="mt-1 text-xs text-[#8f97b1]">
                    {formatFileSize(videoFile.size)}
                    {durationSeconds > 0
                      ? ` • ${formatDuration(durationSeconds)}`
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearVideo}
                  disabled={isSubmitting}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8f97b1] transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                  aria-label="Remove video"
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 20 }} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="group flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-6 text-center transition hover:border-orange-400/40 hover:bg-orange-500/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200 transition group-hover:scale-105">
                <CloudUploadRoundedIcon sx={{ fontSize: 28 }} />
              </span>

              <span className="mt-4 text-sm font-semibold text-white">
                Upload reel video
              </span>

              <span className="mt-2 text-xs leading-5 text-[#8f97b1]">
                MP4, WebM or MOV
              </span>
            </button>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="reel-description"
              className="text-sm font-semibold text-white"
            >
              Description
            </label>

            <span className="text-xs text-[#737b94]">
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>

          <textarea
            id="reel-description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value.slice(0, MAX_DESCRIPTION_LENGTH)
              )
            }
            rows={5}
            disabled={isSubmitting}
            placeholder="Describe your reel, the recipe or the cooking moment..."
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-[#737b94] focus:border-orange-400/50 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </section>

        <section>
          <label
            htmlFor="reel-visibility"
            className="mb-2 block text-sm font-semibold text-white"
          >
            Visibility
          </label>

          <select
            id="reel-visibility"
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as ReelVisibility)
            }
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl border border-white/10 bg-[#1b1d22] px-3 text-sm text-white outline-none transition focus:border-orange-400/50 disabled:opacity-60"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>

          <p className="mt-2 text-xs leading-5 text-[#8f97b1]">
            Private reels are only visible to you.
          </p>
        </section>

        {formError && (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-200">
            {formError}
          </div>
        )}
      </div>

      <footer className="sticky bottom-0 z-20 border-t border-white/10 bg-[#16181d]/95 p-5 backdrop-blur-xl">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#feaa2b] px-4 text-sm font-bold text-[#17120a] transition hover:bg-[#ffb84d] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            <>
              <CircularProgress
                size={18}
                thickness={5}
                sx={{ color: "#17120a" }}
              />
              Publishing reel...
            </>
          ) : (
            <>
              <MovieCreationRoundedIcon sx={{ fontSize: 20 }} />
              Publish reel
            </>
          )}
        </button>
      </footer>
    </form>
  )
}
