import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import MovieCreationRoundedIcon from "@mui/icons-material/MovieCreationRounded"

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { useSnackbar } from "../../../../components/layout/SnackbarProvider"
import { CurrentUserCardData } from "../../types/recipeCard.types"
import { ReelMealType, ReelVisibility } from "../../../reels/types/reel.types"
import { createReel } from "../../../reels/services/reels.service"
import { CircularProgress } from "@mui/material"
import PostRecipeSelectDropdown from "./PostRecipeSelectDropdown"

interface PostReelFormProps {
  currentUser: CurrentUserCardData | null
  onClose: () => void
  onSubmitSuccess: () => void
  onBackToRecipe?: () => void
}

const MIN_TITLE_LENGTH = 3
const MAX_TITLE_LENGTH = 100
const MIN_DESCRIPTION_LENGTH = 10
const MAX_DESCRIPTION_LENGTH = 500
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024

const MEAL_TYPE_OPTIONS: Array<{ label: string, value: ReelMealType }> = [
  {
    label: "Breakfast",
    value: "breakfast",
  },
  {
    label: "Lunch",
    value: "lunch",
  },
  {
    label: "Dinner",
    value: "dinner",
  },
  {
    label: "Dessert",
    value: "dessert",
  },
  {
    label: "Snack",
    value: "snack",
  },
]

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
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [meal, setMeal] = useState<ReelMealType | "">("")
    const [visibility, setVisibility] = useState<ReelVisibility>("public")

    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [videoPreviewUrl, setVideoPreviewUrl] = useState("")
    const [durationSeconds, setDurationSeconds] = useState(0)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const fieldClassName = [
      "w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)]",
      "px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition",
      "placeholder:text-[var(--input-placeholder)]",
      "hover:border-[var(--border-strong)] hover:bg-[var(--input-bg-hover)]",
      "focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]",
      "disabled:cursor-not-allowed disabled:opacity-60",
    ].join(" ")
    const labelClassName = "mb-2 block text-xs font-medium text-[var(--text-secondary)]"

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

        const normalizedTitle = title.trim()
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

        if (!meal) {
          setFormError("Please select a meal type.")
          return
        }

        if (!durationSeconds) {
            setFormError("Please wait for the video metadata to load.")
            return
        }

        if (!normalizedTitle) {
          setFormError("Please add a title.")
          return
        }

        if (normalizedTitle.length < MIN_TITLE_LENGTH) {
          setFormError(
            `Title must contain at least ${MIN_TITLE_LENGTH} characters.`
          )
          return
        }

        if (normalizedDescription.length < MIN_DESCRIPTION_LENGTH) {
          setFormError(
            `Description must contain at least ${MIN_DESCRIPTION_LENGTH} characters.`
          )
          return
        }

        try {
        setIsSubmitting(true)
        setFormError(null)

        await createReel({
            userId: currentUser.uid,
            username: currentUser.username || "Unknown",
            userProfileImage: currentUser.profileImage ||"",
            title: normalizedTitle,
            description: normalizedDescription,
            meal,
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

    const completionPercentage = useMemo(() => {
      let percentage = 0

      if (videoFile && durationSeconds > 0) {
        percentage += 35
      }

      if (title.trim().length >= MIN_TITLE_LENGTH) {
        percentage += 20
      }

      if (description.trim().length >= MIN_DESCRIPTION_LENGTH) {
        percentage += 20
      }

      if (meal) {
        percentage += 10
      }

      if (visibility) {
        percentage += 15
      }

      return percentage
    }, [ videoFile, durationSeconds, title, description, meal, visibility, ])

    const canSubmit = completionPercentage === 100 && !isSubmitting

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-full flex-col bg-[var(--recipe-form-bg)] text-[var(--text-primary)] transition-colors"
    >
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--recipe-form-bg)] px-6 py-5">
        <div className="flex min-w-0 items-center gap-3">
          {onBackToRecipe && (
            <button
              type="button"
              onClick={onBackToRecipe}
              disabled={isSubmitting}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] transition hover:bg-[var(--button-secondary-hover)] hover:text-[var(--text-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Back to recipe form"
            >
              <ArrowBackRoundedIcon
                sx={{ fontSize: 20 }}
              />
            </button>
          )}

          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Create reel
            </p>

            <h2 className="mt-0.5 truncate text-[1.35rem] font-medium text-[var(--text-primary)]">
              New post
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] transition hover:bg-[var(--button-secondary-hover)] hover:text-[var(--text-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Close reel form"
        >
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </button>
      </header>

      <div className="flex-1 px-6 py-7">
        <div className="rounded-[2rem] border border-[var(--recipe-form-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)] transition-colors">
          <section>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Reel video
              </h3>

              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
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
              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--recipe-upload-bg)]">
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

                <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] bg-[var(--card-bg)] px-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {videoFile.name}
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
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
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-3 text-xs font-semibold text-[var(--button-secondary-text)] transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Replace
                    </button>

                    <button
                      type="button"
                      onClick={clearVideo}
                      disabled={isSubmitting}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--button-danger-border)] bg-[var(--button-danger-bg)] text-[var(--button-danger-text)] transition hover:bg-[var(--button-danger-hover)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="group flex min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--recipe-upload-bg)] px-6 text-center transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)] transition group-hover:scale-105 group-hover:border-[var(--accent-border)] group-hover:bg-[var(--accent-soft-hover)] group-hover:text-[var(--accent-text)] group-active:scale-95">
                  <CloudUploadRoundedIcon
                    sx={{ fontSize: 32 }}
                  />
                </span>

                <span className="mt-5 text-sm font-semibold text-[var(--text-primary)]">
                  Upload reel video
                </span>

                <span className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  MP4 • MOV • WebM • Max 200 MB
                </span>
              </button>
            )}
          </section>

          <div className="my-7 h-px bg-[var(--border-subtle)]" />

          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="reel-title"
                className={labelClassName}
              >
                Title *
              </label>

              <span className="text-xs text-[var(--text-muted)]">
                {title.length} / {MAX_TITLE_LENGTH}
              </span>
            </div>

            <input
              id="reel-title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value.slice(
                    0,
                    MAX_TITLE_LENGTH
                  )
                )
              }
              disabled={isSubmitting}
              placeholder="Give your reel a title..."
              className={fieldClassName}
            />

            <div className="my-6 h-px bg-[var(--border-subtle)]" />

            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="reel-description"
                className={labelClassName}
              >
                Description *
              </label>

              <span className="text-xs text-[var(--text-muted)]">
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

          <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                Meal type *
              </label>

              <PostRecipeSelectDropdown
                value={meal}
                options={MEAL_TYPE_OPTIONS}
                onChange={(value) => {
                  setMeal(value as ReelMealType)
                  setFormError(null)
                }}
                placeholder="Select meal type"
                disabled={isSubmitting}
                placement="top"
              />

              <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                Choose the meal category that best matches your reel.
              </p>
            </div>

            <div>
              <label className={labelClassName}>
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

              <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                {visibility === "private"
                  ? "Private reels are only visible to you."
                  : "Public reels can be viewed by other FlavorFolio users."}
              </p>
            </div>
          </section>

          {formError && (
            <div className="mt-6 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm leading-6 text-[var(--danger-text)] shadow-[var(--shadow-card)]">
              {formError}
            </div>
          )}
        </div>
      </div>

      <footer className="sticky bottom-0 z-50 border-t border-[var(--border)] bg-[var(--recipe-form-bg)] px-6 py-5">
        <div className="flex items-center justify-end gap-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              "relative h-11 min-w-[180px] overflow-hidden rounded-lg border",
              "text-sm font-semibold transition active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-60",
              completionPercentage === 100
                ? "border-[var(--accent-border)] bg-[var(--accent-soft-hover)] text-[var(--accent-text)] hover:bg-[var(--accent-soft-hover)]"
                : "border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] text-[var(--text-muted)]",
            ].join(" ")}
          >
            {!isSubmitting && (
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 bg-[var(--accent-soft)] transition-[width] duration-300 ease-out"
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            )}

            <span className="relative z-10 flex h-full items-center justify-center gap-2 px-5">
              {isSubmitting ? (
                <>
                  <CircularProgress
                    size={17}
                    thickness={5}
                    sx={{ color: "var(--accent-text)" }}
                  />

                  Submitting...
                </>
              ) : completionPercentage < 100 ? (
                `${completionPercentage}%`
              ) : (
                <>
                  <MovieCreationRoundedIcon
                    sx={{ fontSize: 19 }}
                  />

                  Submit for review
                </>
              )}
            </span>
          </button>
        </div>
      </footer>
    </form>
  )
}
