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
import PostRecipeSelectDropdown from "./PostRecipeSelectDropdown"

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

    const fieldClassName = [
      "w-full rounded-md border border-white/10 bg-[#0b0b0c]",
      "px-4 py-3 text-sm text-white outline-none transition",
      "placeholder:text-[#6f7892]",
      "hover:border-white/20",
      "focus:border-orange-400/50",
      "focus:ring-2 focus:ring-orange-500/10",
      "disabled:cursor-not-allowed disabled:opacity-60",
    ].join(" ")
    const labelClassName = "mb-2 block text-xs font-medium text-[#a8b3cf]"

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
      className="flex min-h-full flex-col bg-[#16181d]"
    >
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#16181d]/95 px-6 py-5 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          {onBackToRecipe && (
            <button
              type="button"
              onClick={onBackToRecipe}
              disabled={isSubmitting}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0b0b0c]/70 text-[#a8b3cf] transition hover:border-white/20 hover:bg-[#0b0b0c] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Back to recipe form"
            >
              <ArrowBackRoundedIcon
                sx={{ fontSize: 20 }}
              />
            </button>
          )}

          <div className="min-w-0">
            <p className="text-sm font-medium text-[#a8b3cf]">
              Create reel
            </p>

            <h2 className="mt-0.5 truncate text-[1.35rem] font-medium text-white">
              New post
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#0b0b0c]/70 text-[#a8b3cf] transition hover:border-white/20 hover:bg-[#0b0b0c] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Close reel form"
        >
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </button>
      </header>

      <div className="flex-1 px-6 py-7">
        <div className="rounded-[2rem] border border-white/[0.08] bg-[#17181d] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <section>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">
                Reel video
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#8f97b1]">
                Vertical videos work best. MP4, WebM or MOV,
                maximum 200 MB.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoChange}
              disabled={isSubmitting}
              className="hidden"
            />

            {videoPreviewUrl && videoFile ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0c]">
                <div className="relative mx-auto aspect-[9/16] max-h-[520px] max-w-[292px] overflow-hidden bg-black">
                  <video
                    src={videoPreviewUrl}
                    controls
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(event) => {
                      const duration =
                        event.currentTarget.duration

                      setDurationSeconds(
                        Number.isFinite(duration)
                          ? duration
                          : 0
                      )
                    }}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {videoFile.name}
                    </p>

                    <p className="mt-1 text-xs text-[#8f97b1]">
                      {formatFileSize(videoFile.size)}

                      {durationSeconds > 0
                        ? ` • ${formatDuration(
                            durationSeconds
                          )}`
                        : " • Loading duration..."}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={isSubmitting}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-[#d7def0] transition hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-orange-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Replace
                    </button>

                    <button
                      type="button"
                      onClick={clearVideo}
                      disabled={isSubmitting}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-[#8f97b1] transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Remove video"
                    >
                      <DeleteOutlineRoundedIcon
                        sx={{ fontSize: 20 }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={isSubmitting}
                className="group flex min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0b0b0c] px-6 text-center transition hover:border-orange-400/40 hover:bg-orange-500/[0.035] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-[#7f89a6] transition group-hover:scale-105 group-hover:border-orange-400/50 group-hover:bg-orange-500/20 group-hover:text-orange-200 group-active:scale-95">
                  <CloudUploadRoundedIcon
                    sx={{ fontSize: 32 }}
                  />
                </span>

                <span className="mt-5 text-sm font-semibold text-white">
                  Upload reel video
                </span>

                <span className="mt-2 text-xs leading-5 text-[#8f97b1]">
                  Drag and drop or browse your files
                </span>

                <span className="mt-1 text-xs leading-5 text-[#6f7892]">
                  MP4 • MOV • WebM • Max 200 MB
                </span>
              </button>
            )}
          </section>

          <div className="my-7 h-px bg-white/[0.07]" />

          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="reel-description"
                className={labelClassName}
              >
                Description *
              </label>

              <span className="text-xs text-[#6f7892]">
                {description.length} /{" "}
                {MAX_DESCRIPTION_LENGTH}
              </span>
            </div>

            <textarea
              id="reel-description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value.slice(
                    0,
                    MAX_DESCRIPTION_LENGTH
                  )
                )
              }
              rows={6}
              disabled={isSubmitting}
              placeholder="Describe your reel, recipe or cooking moment..."
              className={`${fieldClassName} resize-y leading-7`}
            />
          </section>

          <section className="mt-6">
            <label
              htmlFor="reel-visibility"
              className={labelClassName}
            >
              Visibility
            </label>

            <PostRecipeSelectDropdown
              value={visibility}
              options={[
                {
                  label: "Public",
                  value: "public",
                },
                {
                  label: "Private",
                  value: "private",
                },
              ]}
              onChange={(value) => {
                setVisibility(value as ReelVisibility)
              }}
              placeholder="Select visibility"
              disabled={isSubmitting}
              placement="top"
            />

            <p className="mt-2 text-xs leading-5 text-[#8f97b1]">
              {visibility === "private"
                ? "Private reels are only visible to you."
                : "Public reels can be viewed by other FlavorFolio users."}
            </p>
          </section>

          {formError && (
            <div className="mt-6 rounded-xl border border-red-400/20 bg-[#140b0b] px-4 py-3 text-sm leading-6 text-red-200 shadow-[0_12px_32px_rgba(0,0,0,0.25)]">
              {formError}
            </div>
          )}
        </div>
      </div>

      <footer className="sticky bottom-0 z-50 flex items-center justify-end gap-3 border-t border-white/10 bg-[#16181d]/95 px-6 py-5 backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-[#a8b3cf] transition hover:bg-white/[0.04] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-lg border border-orange-400/40 bg-orange-500/20 text-orange-100 hover:bg-orange-500/30 active:scale-95 px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.04] disabled:text-[#6f7892]"
        >
          {isSubmitting ? (
            <>
              <CircularProgress
                size={17}
                thickness={5}
                sx={{ color: "#fff0d1" }}
              />

              Publishing...
            </>
          ) : (
            <>
              <MovieCreationRoundedIcon
                sx={{ fontSize: 19 }}
              />

              Publish reel
            </>
          )}
        </button>
      </footer>
    </form>
  )
}
