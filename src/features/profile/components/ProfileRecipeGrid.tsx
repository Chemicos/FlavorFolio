import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded"
import StarRoundedIcon from "@mui/icons-material/StarRounded"
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded"
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import ShareRoundedIcon from "@mui/icons-material/ShareRounded"

import { ProfileRecipeViewMode } from "./ProfileRecipeToolbar"
import { useEffect, useRef, useState } from "react"
// import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"

export type ProfileRecipeStatus =
  | "published"
  | "pending"
  | "needs_revision"
  | "draft"

export interface ProfileRecipeGridItem {
    id: string
    title: string
    image: string
    meal: string
    difficulty: string
    durationMinutes: number
    category: string
    status: ProfileRecipeStatus
    rating: number
    commentsCount: number
    savesCount: number
    createdAt?: string
}

interface ProfileRecipeGridProps {
  recipes: ProfileRecipeGridItem[]
  viewMode: ProfileRecipeViewMode
  onRecipeClick?: (recipe: ProfileRecipeGridItem) => void
   onRecipeEdit?: (recipe: ProfileRecipeGridItem) => void
  onRecipeDelete?: (recipe: ProfileRecipeGridItem) => void
  onRecipeShare?: (recipe: ProfileRecipeGridItem) => void
}

const statusConfig: Record<
  ProfileRecipeStatus,
  {
    label: string
    className: string
  }
> = {
  published: {
    label: "Published",
    className: "bg-emerald-600/50 text-white",
  },
  pending: {
    label: "Pending review",
    className: "bg-yellow-400/60 text-white",
  },
  needs_revision: {
    label: "Needs revision",
    className: "bg-orange-600/50 text-white",
  },
  draft: {
    label: "Draft",
    className: "bg-white/10 text-white",
  },
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (!remainingMinutes) return `${hours} h`

  return `${hours} h ${remainingMinutes} min`
}

function ProfileRecipeEmptyState() {
  return (
    <div className="mt-8 flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.025] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#a8b3cf]">
        <RestaurantRoundedIcon sx={{ fontSize: 28 }} />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-white">
        No recipes found
      </h3>

      <p className="mt-2 max-w-[420px] text-sm leading-6 text-[#8f97b1]">
        Try changing the search, category, or selected profile tab.
      </p>
    </div>
  )
}

function ProfileRecipeActionsMenu({
  recipe,
  buttonClassName,
  onEdit,
  onDelete,
  onShare,
}: {
  recipe: ProfileRecipeGridItem
  buttonClassName: string
  onEdit?: (recipe: ProfileRecipeGridItem) => void
  onDelete?: (recipe: ProfileRecipeGridItem) => void
  onShare?: (recipe: ProfileRecipeGridItem) => void
}) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAction = (
    event: React.MouseEvent,
    action?: (recipe: ProfileRecipeGridItem) => void
  ) => {
    event.stopPropagation()
    action?.(recipe)
    setIsOpen(false)
  }

  return (
    <div
      ref={menuRef}
      className="relative z-50"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Recipe actions"
        onClick={(event) => {
          event.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        className={buttonClassName}
      >
        <MoreHorizRoundedIcon sx={{ fontSize: 21 }} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 bottom-[calc(100%+8px)] z-50 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0c] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
          >
            <button
              type="button"
              onClick={(event) => handleAction(event, onShare)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#a8b3cf] transition hover:bg-[#16181d] hover:text-white"
            >
              <ShareRoundedIcon sx={{ fontSize: 18 }} />
              Share
            </button>

            <button
              type="button"
              onClick={(event) => handleAction(event, onEdit)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#a8b3cf] transition hover:bg-[#16181d] hover:text-white"
            >
              <EditRoundedIcon sx={{ fontSize: 18 }} />
              Edit recipe
            </button>

            <button
              type="button"
              onClick={(event) => handleAction(event, onDelete)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#db7668] transition hover:bg-[#db4633]/10 hover:text-[#ff8b7d]"
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
              Delete recipe
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProfileRecipeGridCard({
  recipe,
  onRecipeClick,
  onRecipeEdit,
  onRecipeDelete,
  onRecipeShare,
}: {
  recipe: ProfileRecipeGridItem
  onRecipeClick?: (recipe: ProfileRecipeGridItem) => void
  onRecipeEdit?: (recipe: ProfileRecipeGridItem) => void
  onRecipeDelete?: (recipe: ProfileRecipeGridItem) => void
  onRecipeShare?: (recipe: ProfileRecipeGridItem) => void
}) {
  const status = statusConfig[recipe.status]

  return (
    <article
      onClick={() => onRecipeClick?.(recipe)}
      className="group relative aspect-auto min-h-[370px] cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-black shadow-[0_18px_55px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-1 hover:border-white/15"
    >
        <img
            src={recipe.image}
            alt={recipe.title}
            className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/10" />

        <div className="absolute inset-x-0 bottom-0 h-[58%] origin-bottom bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[58%] origin-bottom opacity-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent transition-opacity duration-200 ease-out group-hover:opacity-100" />

        <span
            className={[
            "absolute left-4 top-4 z-10 rounded-md px-3 py-1 text-xs font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-2xl",
            status.className,
            ].join(" ")}
        >
            {status.label}
        </span>

        <div className="absolute inset-x-0 bottom-0 z-10">
            <div className="px-4 pb-4 pt-3">
                <h3 className="line-clamp-1 text-[1rem] font-semibold text-white">
                    {recipe.title}
                </h3>

                <p className="mt-2 line-clamp-1 text-sm text-[#a8b3cf]">
                    {recipe.meal} · {recipe.difficulty} ·{" "}
                    {formatDuration(recipe.durationMinutes)}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-amber-300">
                        <StarRoundedIcon sx={{ fontSize: 18 }} />
                        <span className="text-sm font-semibold text-[#f8d36b]">
                            {recipe.rating.toFixed(1)}
                        </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[#a8b3cf]">
                        <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 17 }} />
                        <span className="text-sm font-semibold">
                            {formatCompactNumber(recipe.commentsCount)}
                        </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[#a8b3cf]">
                        <BookmarkRoundedIcon sx={{ fontSize: 17 }} />
                        <span className="text-sm font-semibold">
                            {formatCompactNumber(recipe.savesCount)}
                        </span>
                        </div>
                    </div>

                    <ProfileRecipeActionsMenu
                      recipe={recipe}
                      onEdit={onRecipeEdit}
                      onDelete={onRecipeDelete}
                      onShare={onRecipeShare}
                      buttonClassName="flex h-8 w-8 items-center justify-center rounded-lg text-[#a8b3cf] transition hover:bg-white/[0.10] hover:text-white"
                    />
                </div>
            </div>
        </div>
    </article>
  )
}

function ProfileRecipeListCard({
  recipe,
  onRecipeClick,
  onRecipeMenuClick,
  onRecipeEdit,
  onRecipeDelete,
  onRecipeShare,
}: {
  recipe: ProfileRecipeGridItem
  onRecipeClick?: (recipe: ProfileRecipeGridItem) => void
  onRecipeMenuClick?: (recipe: ProfileRecipeGridItem) => void
  onRecipeEdit?: (recipe: ProfileRecipeGridItem) => void
  onRecipeDelete?: (recipe: ProfileRecipeGridItem) => void
  onRecipeShare?: (recipe: ProfileRecipeGridItem) => void
}) {
  const status = statusConfig[recipe.status]

  return (
    <article
      onClick={() => onRecipeClick?.(recipe)}
      className="group flex cursor-pointer gap-4 rounded-2xl border border-white/10 bg-[#0b0b0c] p-3 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#111318]"
    >
      <div className="h-28 w-36 shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span
              className={[
                "rounded-md px-2.5 py-1 text-[0.7rem] font-semibold",
                status.className,
              ].join(" ")}
            >
              {status.label}
            </span>

            <ProfileRecipeActionsMenu
              recipe={recipe}
              onEdit={onRecipeEdit}
              onDelete={onRecipeDelete}
              onShare={onRecipeShare}
              buttonClassName="flex h-8 w-8 items-center justify-center rounded-lg text-[#8f97b1] transition hover:bg-white/[0.06] hover:text-white"
            />
          </div>

          <h3 className="mt-3 line-clamp-1 text-base font-semibold text-white">
            {recipe.title}
          </h3>

          <p className="mt-1 text-sm text-[#8f97b1]">
            {recipe.meal} · {recipe.difficulty} ·{" "}
            {formatDuration(recipe.durationMinutes)}
          </p>
        </div>

        <div className="flex items-center gap-5 text-sm">
            <span className="inline-flex items-center gap-1.5 text-[#f8d36b]">
                <StarRoundedIcon sx={{ fontSize: 18 }} />
                {recipe.rating.toFixed(1)}
            </span>

            <span className="inline-flex items-center gap-1.5 text-[#8f97b1]">
                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 17 }} />
                {formatCompactNumber(recipe.commentsCount)}
            </span>

            <span className="inline-flex items-center gap-1.5 text-[#8f97b1]">
                <BookmarkRoundedIcon sx={{ fontSize: 17 }} />
                {formatCompactNumber(recipe.savesCount)}
            </span>
        </div>
      </div>
    </article>
  )
}

export default function ProfileRecipeGrid({
    recipes,
    viewMode,
    onRecipeClick,
    onRecipeEdit,
    onRecipeDelete,
    onRecipeShare,
}: ProfileRecipeGridProps) {
    if (recipes.length === 0) {
        return <ProfileRecipeEmptyState />
    }

    if (viewMode === "list") {
        return (
        <section className="mt-6 grid gap-2">
            {recipes.map((recipe) => (
            <ProfileRecipeListCard
                key={recipe.id}
                recipe={recipe}
                onRecipeClick={onRecipeClick}
                onRecipeEdit={onRecipeEdit}
                onRecipeDelete={onRecipeDelete}
                onRecipeShare={onRecipeShare}
            />
            ))}
        </section>
        )
    }
  return (
    <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {recipes.map((recipe) => (
        <ProfileRecipeGridCard
          key={recipe.id}
          recipe={recipe}
          onRecipeClick={onRecipeClick}
          onRecipeEdit={onRecipeEdit}
          onRecipeDelete={onRecipeDelete}
          onRecipeShare={onRecipeShare}
        />
      ))}
    </section>
  )
}
