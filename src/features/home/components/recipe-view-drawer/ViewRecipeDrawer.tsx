import { useEffect, useMemo, useState } from "react"
import { Recipe, SavedRecipe } from "../../types"
import { CurrentUserCardData } from "../../types/recipeCard.types"
import { useRecipeCardActions } from "../../hooks/useRecipeCardActions"
import { useImageLoaded } from "../../hooks/useImageLoaded"
import { AnimatePresence, motion } from "motion/react"

import MuiRating from "@mui/material/Rating"
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import SignalCellularAltRoundedIcon from "@mui/icons-material/SignalCellularAltRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import LunchDiningRoundedIcon from "@mui/icons-material/LunchDiningRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { formatCompactCount, formatDurationMinutes, formatFollowersLabel } from "../../utils/recipeCardFormatters";
import { CircularProgress } from "@mui/material"
import ViewRecipeCommentComposer from "./ViewRecipeCommentComposer"
import { getUserRecipeRating, rateRecipe } from "../../services/ratings.service"
import ViewRecipeCommentList, { ViewRecipeComment } from "./ViewRecipeCommentList"
import { useRecipeComments } from "../../hooks/useRecipeComments"
import { createRecipeComment, createRecipeReply, deleteRecipeComment, updateRecipeComment } from "../../services/comments.service"
import DeleteCommentWarningDialog from "./DeleteCommentWarningDialog"

interface ViewRecipeDrawerProps {
    recipe: Recipe,
    currentUser: CurrentUserCardData | null
    savedRecipes: SavedRecipe[]
    followingUserIds: string[]
    authorFollowersCount: number
    onClose: () => void
    onFollowStateChange: (authorId: string, isNowFollowing: boolean) => void
    onFavoriteStateChange: (recipeId: string, isNowSaved: boolean) => void
    onRatingStateChange: (
        recipeId: string, 
        stats: {
            averageRating: number
            ratingsCount: number
            ratingSum?: number
        }
    ) => void
    onCommentStateChange: (recipeId: string, commentsCount: number) => void
}

export default function ViewRecipeDrawer({
    recipe,
    currentUser,
    savedRecipes,
    followingUserIds,
    authorFollowersCount,
    onClose,
    onFollowStateChange,
    onFavoriteStateChange,
    onRatingStateChange,
    onCommentStateChange
}: ViewRecipeDrawerProps) {
    const [userRating, setUserRating] = useState<number | null>(null)
    const [ratingLoading, setRatingLoading] = useState(false)

    const [ratingStats, setRatingStats] = useState({
        averageRating: Number(recipe?.stats?.averageRating || 0),
        ratingsCount: Number(recipe?.stats?.ratingsCount || 0)
    })

    const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({1: true})
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

    const {
        isOwner,
        isFollowing,
        isFavorite,
        isFollowLoading,
        isFavoriteLoading,
        handleToggleFollow,
        handleToggleFavorite,
    } = useRecipeCardActions({
        recipe,
        currentUser,
        savedRecipes,
        followingUserIds,
        onFollowStateChange,
        onFavoriteStateChange,
    })
    
    const {
        imageRef,
        loaded: imageLoaded,
        onLoad: handleImageLoad,
        onError: handleImageError,
    } = useImageLoaded(recipe.image)

    const {comments, isLoadingComments} = useRecipeComments(recipe.recipeId)
    const liveCommentsCount = comments.length || Number(recipe?.stats?.commentsCount || 0)

    useEffect(() => {
        if (!recipe.recipeId) return
        if (isLoadingComments) return

        onCommentStateChange(recipe.recipeId, comments.length)
    }, [recipe.recipeId, comments.length, isLoadingComments, onCommentStateChange])
    
    useEffect(() => {
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose()
            }
        }
        
        window.addEventListener("keydown", handleKeyDown)
        
        return () => {
            document.body.style.overflow = originalOverflow
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [onClose])

    useEffect(() => {
        const fetchUserRating = async () => {
            if (!currentUser?.uid || !recipe.recipeId) {
                setUserRating(null)
                return
            }

            try {
            const rating = await getUserRecipeRating(recipe.recipeId, currentUser.uid)
            setUserRating(rating)
            } catch (error) {
            console.error("Failed to fetch user rating:", error)
            }
        }

        fetchUserRating()
    }, [currentUser?.uid, recipe.recipeId])
    
    const authorUsername = recipe?.author?.username || "Unknown"
    const authorProfileImage = recipe?.author?.profileImage || ""
    const averageRating = ratingStats.averageRating
    const ratingsCount = ratingStats.ratingsCount
    const commentsCount = liveCommentsCount
    const description = recipe?.description || ""
    
    const followButtonDisabled = isFollowLoading || !currentUser?.uid || isOwner
    const shouldCollapseDescription = description.trim().length > 100

    const [isSubmittingComment, setIsSubmittingComment] = useState(false)
    const displayedCommentsCount = comments.length || commentsCount
    const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null)
    const [isSubmittingReply, setIsSubmittingReply] = useState(false)

    const [commentToDelete, setCommentToDelete] = useState<ViewRecipeComment | null>(null)
    const [isDeletingComment, setIsDeletingComment] = useState(false)
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
    const [isUpdatingComment, setIsUpdatingComment] = useState(false)

    const handleRatingChange = async (_event: React.SyntheticEvent, value: number | null) => {
        if (!value || !currentUser?.uid || !recipe.recipeId || ratingLoading) return

        try {
            setRatingLoading(true)

            const result = await rateRecipe({
                recipeId: recipe.recipeId,
                userId: currentUser.uid,
                value,
            })

            setUserRating(result.userRating)

            setRatingStats({
                averageRating: result.averageRating,
                ratingsCount: result.ratingsCount,
            })

            onRatingStateChange(recipe.recipeId, {
                averageRating: result.averageRating,
                ratingsCount: result.ratingsCount,
                ratingSum: result.ratingsSum
            })
        } catch (error) {
            console.error("Failed to rate recipe:", error)
        } finally {
            setRatingLoading(false)
        }
    }

    const handleSubmitComment = async (value: string) => {
        if (!currentUser?.uid || !recipe.recipeId || isSubmittingComment) return

        try {
            setIsSubmittingComment(true)

            await createRecipeComment({
                recipeId: recipe.recipeId,
                userId: currentUser.uid,
                username: currentUser.username || "Unknown",
                profileImage: currentUser.profileImage || "",
                comment: value,
            })
        } catch (error) {
            console.error("Failed to submit comment:", error)
        } finally {
            setIsSubmittingComment(false)
        }
    }

    const handleSubmitReply = async (comment: ViewRecipeComment, value: string) => {
        if (!currentUser?.uid || !recipe.recipeId || isSubmittingReply) return

        try {
            setIsSubmittingReply(true)

            await createRecipeReply({
            recipeId: recipe.recipeId,
            parentCommentId: comment.parentCommentId || comment.id,
            userId: currentUser.uid,
            username: currentUser.username || "Unknown",
            profileImage: currentUser.profileImage || "",
            comment: value,
            replyToUserId: comment.userId,
            replyToUsername: comment.username,
            })

            setReplyingCommentId(null)
        } catch (error) {
            console.error("Failed to submit reply:", error)
        } finally {
            setIsSubmittingReply(false)
        }
    }

    const handleUpdateComment = async (comment: ViewRecipeComment, value: string) => {
        if (!recipe.recipeId || !currentUser?.uid || comment.userId !== currentUser.uid || isUpdatingComment) return

        try {
            setIsUpdatingComment(true)

            await updateRecipeComment({
                recipeId: recipe.recipeId,
                commentId: comment.id,
                comment: value
            })

            setEditingCommentId(null)
        } catch (error) {
            console.error("Failed to update comment:", error)
        } finally {
            setIsUpdatingComment(false)
        }
    }

    const handleConfirmDeleteComment = async () => {
        if (!commentToDelete || !recipe.recipeId || isDeletingComment) return

        try {
            setIsDeletingComment(true)

            await deleteRecipeComment({
                recipeId: recipe.recipeId,
                commentId: commentToDelete.id,
            })

            setCommentToDelete(null)
        } catch (error) {
            console.error("Failed to delete comment:", error)
        } finally {
            setIsDeletingComment(false)
        }
    }

    const steps = useMemo(() => {
        return Array.isArray(recipe?.cookingSteps) ? recipe.cookingSteps : []
    }, [recipe?.cookingSteps])

    const areAllStepsExpanded = useMemo(() => {
        if (!steps.length) return false
        return steps.every((_, index) => expandedSteps[index + 1])
    }, [steps, expandedSteps])
    
    const toggleAllSteps = () => {
        if (areAllStepsExpanded) {
            setExpandedSteps({})
            return
        }

        setExpandedSteps(
            Object.fromEntries(steps.map((_, index) => [index + 1, true]))
        )
    }

    const ingredients = useMemo(() => {
        return Array.isArray(recipe?.ingredients) ? recipe.ingredients : []
    }, [recipe?.ingredients])

    const toggleStep = (index: number) => {
        setExpandedSteps((prev) => ({
        ...prev,
        [index]: !prev[index],
        }))
    }

    return (
        <div className="fixed inset-0 z-[80]">
            <motion.div
                className="absolute inset-0 bg-[#050506]/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={onClose}
            />

            <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "105%" }}
                transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 30,
                    mass: 1,
                }}
                className="absolute right-0 top-0 flex h-full w-full max-w-[540px] flex-col overflow-hidden 
                    bg-[#16181d] shadow-[-24px_0_80px_rgba(0,0,0,0.38)]"
            >
                <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
                    <div className="relative">
                        <div className="relative h-[340px] w-full overflow-hidden">
                            {!imageLoaded && (
                                <div className="absolute inset-0 animate-pulse bg-white/10" />
                            )}

                            <img
                                ref={imageRef}
                                src={recipe.image}
                                alt={recipe.title}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                                className={[
                                    "h-full w-full object-cover transition duration-500",
                                    imageLoaded ? "opacity-100" : "opacity-0",
                                ].join(" ")}
                                />

                            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/40" />
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#0b0b0c]/60 backdrop-blur-xl text-[#a8b3cf] transition duration-200 hover:scale-105 hover:bg-[#0b0b0c] hover:text-white
                            active:scale-90"
                            >
                            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
                        </button>

                        <button
                            type="button"
                            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#0b0b0c]/60 text-[#a8b3cf] backdrop-blur-xl transition duration-200 hover:scale-105 hover:bg-[#0b0b0c] hover:text-white"
                            >
                            <ShareRoundedIcon sx={{ fontSize: 19 }} />
                        </button>

                        <button
                            type="button"
                            onClick={handleToggleFavorite}
                            disabled={isFavoriteLoading}
                            className="absolute bottom-[10px] right-7 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[#23262f] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
                            >
                            <FavoriteIcon
                                sx={{
                                color: isFavorite ? "#feaa2b" : "#ffffff",
                                fontSize: 20,
                                }}
                            />
                        </button>
                    </div>

                    <div className="relative z-10 -mt-10 rounded-t-[2.8rem] bg-[#16181d] px-7 pb-8 pt-10">
                        <h1 className="max-w-[92%] text-[1.6rem] font-bold leading-[2.35rem] text-white">
                            {recipe.title}
                        </h1>

                        <div className="mt-3 flex items-center gap-2 text-[#d9dde9]">
                            <MuiRating
                                value={userRating ?? averageRating}
                                precision={1}
                                size="small"
                                disabled={!currentUser?.uid || ratingLoading}
                                onChange={handleRatingChange}
                                sx={{
                                color: "#feaa2b",
                                "& .MuiRating-iconFilled": {
                                    color: "#feaa2b",
                                },
                                "& .MuiRating-iconEmpty": {
                                    color: "rgba(242, 193, 75, 0.28)",
                                },
                                "&.Mui-disabled": {
                                    opacity: 0.8,
                                },
                                }}
                            />
                            
                            <span className="text-sm font-semibold text-white">
                                {averageRating.toFixed(1)}
                            </span>

                            <span className="text-sm text-[#a8b3cf]">
                                {formatCompactCount(ratingsCount, true)}
                            </span>

                            <span className="text-[#8d97b1]">•</span>

                            <div className="flex items-center gap-1 text-white  ">
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 17 }} />
                                <span className="text-sm text-[#a8b3cf]">{formatCompactCount(displayedCommentsCount, true)}</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <p className="text-sm font-medium text-[#9aa6c7]">Recipe by</p>

                            <div className="mt-3 flex items-center gap-8">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-white/10">
                                        {authorProfileImage ? (
                                        <img
                                            src={authorProfileImage}
                                            alt={authorUsername}
                                            className="h-full w-full object-cover"
                                        />
                                        ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/70">
                                            {authorUsername.charAt(0).toUpperCase()}
                                        </div>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-base font-medium text-[#c7d0e7]">
                                            {authorUsername}
                                        </p>
                                        <p className="text-sm text-[#7f89a6]">
                                            {formatFollowersLabel(authorFollowersCount)}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleToggleFollow}
                                    disabled={followButtonDisabled}
                                    className={[
                                        "inline-flex min-w-[96px] items-center justify-center rounded-lg border px-5 py-2 text-sm font-medium transition active:scale-95",
                                        isFollowing
                                        ? "border-[#a8b3cf]/20 bg-white/5 text-white hover:border-white/20 hover:bg-white/10"
                                        : "border-white/10 bg-[#0b0b0c]/70 text-white hover:border-white/20 hover:bg-[#0b0b0c]",
                                        followButtonDisabled ? "cursor-not-allowed opacity-60" : "",
                                    ].join(" ")}
                                    >
                                    {isOwner ? (
                                        "You"
                                    ) : isFollowLoading ? (
                                        <CircularProgress
                                        size={16}
                                        thickness={5}
                                        sx={{ color: "rgba(255,255,255,0.8)" }}
                                        />
                                    ) : isFollowing ? (
                                        "Following"
                                    ) : (
                                        "Follow"
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="mt-10 grid grid-cols-3 gap-3">
                            <div className="rounded-xl bg-[#0b0b0c] px-4 py-5 text-center">
                                <div className="flex justify-center text-white">
                                    <AccessTimeOutlinedIcon sx={{ fontSize: 22 }} />
                                </div>

                                <p className="mt-3 text-sm font-semibold text-white">duration</p>
                            </div>

                            <div className="rounded-xl bg-[#0b0b0c] px-4 py-5 text-center">
                                <div className="flex justify-center text-white">
                                    <SignalCellularAltRoundedIcon sx={{ fontSize: 22 }} />
                                </div>
                                <p className="mt-3 text-sm font-semibold text-white">difficulty</p>
                            </div>

                            <div className="rounded-xl bg-[#0b0b0c] px-4 py-5 text-center">
                                <div className="flex justify-center text-white">
                                    <RestaurantRoundedIcon sx={{ fontSize: 22 }} />
                                </div>
                                <p className="mt-3 text-sm font-semibold text-white">portions</p>
                            </div>

                            <div className="flex justify-center">
                                <span className="rounded-full bg-[#0b0b0c]/60 px-5 py-2 text-sm font-semibold text-white">
                                    {formatDurationMinutes(recipe.durationMinutes)}
                                </span>
                            </div>

                            <div className="flex justify-center">
                                <span className="rounded-full bg-[#0b0b0c]/60 px-5 py-2 text-sm font-semibold text-white">
                                    {recipe.difficulty}
                                </span>
                            </div>

                            <div className="flex justify-center">
                                <span className="rounded-full bg-[#0b0b0c]/60 px-5 py-2 text-sm font-semibold text-white">
                                    {recipe.servings ? `${recipe.servings}` : "info"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-10">
                            <h2 className="text-[1.2rem] font-bold text-white">Description</h2>
                            <div className="relative mt-3">
                                <motion.div
                                initial={false}
                                animate={{
                                    maxHeight: shouldCollapseDescription &&  !isDescriptionExpanded ? 150 : 1000,
                                }}
                                transition={{
                                    duration: 0.5,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="relative overflow-hidden"
                                >
                                <p className="text-[1rem] leading-8 text-[#8f97b1]">
                                    {description}
                                </p>

                                {shouldCollapseDescription && !isDescriptionExpanded && (
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#16181d] via-[#16181d]/80 to-transparent backdrop-blur-[1px]" />
                                )}
                                </motion.div>

                                {shouldCollapseDescription && (
                                <button
                                    type="button"
                                    onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                                    className="mt-2 text-sm text-[#a8b3cf] underline underline-offset-2 transition hover:text-white"
                                >
                                    {isDescriptionExpanded ? "View less" : "View more"}
                                </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-10">
                            <div className="flex items-center gap-3">
                                <LunchDiningRoundedIcon sx={{ fontSize: 20, color: "#ffffff" }} />
                                <h2 className="text-[1.2rem] font-bold text-white">
                                    Ingredients ({ingredients.length})
                                </h2>
                            </div>

                            <div className="mt-5 flex flex-col gap-2 border-l-[1px] border-white/20 pl-4">
                                {ingredients.map((ingredient, index) => {
                                    const quantity = ingredient?.quantity ? String(ingredient.quantity) : ""
                                    const unit = ingredient?.unit || ""
                                    const amountLabel = [quantity, unit].filter(Boolean).join(" ").trim()

                                    return (
                                        <div
                                        key={`${ingredient?.ingredient || "ingredient"}-${index}`}
                                        className="flex items-center gap-3"
                                        >
                                        <div className="shrink-0 rounded-full bg-white/[0.06] px-3 py-1.5 text-sm font-semibold text-[#cbd3ea]">
                                            {amountLabel || "-"}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-[0.98rem] font-medium text-white">
                                            {ingredient?.ingredient || "Unknown ingredient"}
                                            </p>
                                        </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="mt-12">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-[1.2rem] font-bold text-white">Steps</h2>

                                {steps.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={toggleAllSteps} 
                                        className={[
                                            "rounded-md px-4 py-2 text-sm text-[#a8b3cf]/60 transition hover:bg-[#0b0b0c] hover:text-white active:scale-95",
                                            areAllStepsExpanded ? "bg-[#0b0b0c] text-white" : ""
                                        ].join(" ")}
                                    >
                                        {areAllStepsExpanded ? "Collapse all" : "Expand all"}
                                    </button>
                                )}
                            </div>

                            <div className="mt-5 flex flex-col gap-3">
                                {steps.map((step, index) => {
                                    const stepNumber = index + 1
                                    const isExpanded = Boolean(expandedSteps[stepNumber])

                                    return (
                                        <div key={stepNumber} className={[
                                            "overflow-hidden rounded-lg hover:bg-[#0b0b0c] active:bg-white/[0.04] transition",
                                            isExpanded ? "bg-[#0b0b0c] border border-[#a8b3cf]/20" : "bg-[#0b0b0c]/40"
                                        ].join(" ")}>
                                            <button
                                                type="button"
                                                onClick={() => toggleStep(stepNumber)}
                                                className="flex w-full items-center justify-between px-5 py-4 text-left"
                                            >
                                                <span className="text-sm font-semibold text-white">
                                                    Step {stepNumber}
                                                </span>

                                                <span className="ml-2 font-sm text-[#9ba6c6]">
                                                    {step?.title?.trim() ? ` - ${step.title}` : ""}
                                                </span>

                                                <motion.span
                                                    animate={{rotate: isExpanded ? 180 : 0}}
                                                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1]}}
                                                    className="text-[#b8c2df]"
                                                >
                                                    <ExpandMoreRoundedIcon />
                                                </motion.span>
                                            </button>

                                            <AnimatePresence initial={false}>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                                                        <div className="px-5 pb-5">
                                                        {step?.imageUrl && (
                                                            <div className="mb-4 overflow-hidden rounded-2xl bg-white/10">
                                                            <img
                                                                src={step.imageUrl}
                                                                alt={`Step ${stepNumber}`}
                                                                className="h-[210px] w-full object-cover"
                                                            />
                                                            </div>
                                                        )}

                                                        <p className="text-[0.98rem] leading-7 text-white">
                                                            {step?.description || "No description available."}
                                                        </p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="mt-12">
                            <div className="flex items-center gap-3">
                                <ChatBubbleOutlineRoundedIcon sx={{fontSize: 20, color: "#ffffff"}} />
                                <h2 className="text-[1.2rem] font-bold text-white">
                                    Comments {formatCompactCount(commentsCount, true)}
                                </h2>
                            </div>

                            <div className="mt-5 flex flex-col gap-10">
                                <ViewRecipeCommentComposer 
                                    currentUser={currentUser} 
                                    isSubmiting={isSubmittingComment}
                                    onSubmit={handleSubmitComment}
                                />

                                {isLoadingComments ? (
                                    <p className="text-sm text-[#7f89a6]">Loading comments...</p>
                                ): (
                                    <ViewRecipeCommentList 
                                        comments={comments} 
                                        currentUserId={currentUser?.uid}
                                        editingCommentId={editingCommentId}
                                        isUpdatingComment={isUpdatingComment}
                                        replyingCommentId={replyingCommentId}
                                        isSubmittingReply={isSubmittingReply}
                                        onStartReplyComment={(comment) => setReplyingCommentId(comment.id)}
                                        onCancelReplyComment={() => setReplyingCommentId(null)}
                                        onReplyComment={handleSubmitReply}
                                        onStartEditComment={(comment) => setEditingCommentId(comment.id)}
                                        onCancelEditComment={() => setEditingCommentId(null)}
                                        onUpdateComment={handleUpdateComment}
                                        onDeleteComment={setCommentToDelete} 
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.aside>

            <DeleteCommentWarningDialog 
                isOpen={Boolean(commentToDelete)} 
                isDeleting={isDeletingComment}
                onCancel={() => setCommentToDelete(null)}
                onConfirm={handleConfirmDeleteComment}
            />
        </div>
    )
}
