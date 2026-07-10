import { useEffect, useMemo, useState } from "react"
import { Recipe, SavedRecipe } from "../../types"
import { CurrentUserCardData } from "../../types/recipeCard.types"
import { useRecipeCardActions } from "../../hooks/useRecipeCardActions"
import { useImageLoaded } from "../../hooks/useImageLoaded"
import { AnimatePresence, motion } from "motion/react"

import MuiRating from "@mui/material/Rating"
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import FavoriteIcon from '@mui/icons-material/Favorite'
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import SignalCellularAltRoundedIcon from "@mui/icons-material/SignalCellularAltRounded"
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded"
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded"

import { formatCompactCount, formatDurationMinutes, formatFollowersLabel } from "../../utils/recipeCardFormatters"
import { CircularProgress } from "@mui/material"
import { getUserRecipeRating, rateRecipe } from "../../services/ratings.service"
import { ViewRecipeComment } from "./ViewRecipeCommentList"
import { useRecipeComments } from "../../hooks/useRecipeComments"
import { 
    createRecipeComment, 
    createRecipeReply, 
    deleteRecipeComment, 
    listenToRecipeCommentReactions, 
    toggleRecipeCommentReaction, 
    updateRecipeComment 
} from "../../services/comments.service"
import ViewRecipeIngredients from "./ViewRecipeIngredients"
import ViewRecipeStepsSection from "./ViewRecipeStepsSection"
import ViewRecipeCommentsSection from "./ViewRecipeCommentsSection"
import DeleteWarningDialog from "./DeleteWarningDialog"
import { deleteRecipe } from "../../services/recipes.service"
import { doc, onSnapshot } from "@firebase/firestore"
import { db } from "../../../../firebase-config"

interface ViewRecipeDrawerProps {
    recipe: Recipe,
    onShareRecipe?: (recipe: Recipe) => void
    currentUser: CurrentUserCardData | null
    savedRecipes: SavedRecipe[]
    followingUserIds: string[]
    authorFollowersCount: number
    onAuthorClick?: (userId: string) => void
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
    onEditRecipe: (recipe: Recipe) => void
    onDeleteRecipe: (recipeId: string) => void
    presentation?: "overlay" | "inline"
    width?: number
    onBlockUser?: (user: {
        userId: string
        username: string
        profileImage?: string
    }) => void
    blockedUserIds?: string[]
    blockedByUserIds?: string[]
}

export default function ViewRecipeDrawer({
    recipe,
    onShareRecipe,
    currentUser,
    savedRecipes,
    followingUserIds,
    authorFollowersCount,
    onAuthorClick,
    onClose,
    onFollowStateChange,
    onFavoriteStateChange,
    onRatingStateChange,
    onCommentStateChange,
    onEditRecipe,
    onDeleteRecipe,
    presentation = "overlay",
    width = 540,
    onBlockUser,
    blockedUserIds = [],
    blockedByUserIds = [],
}: ViewRecipeDrawerProps) {
    type ViewRecipeTab = "ingredients" | "steps" | "comments"

    const isInline = presentation === "inline"
    const asideClassName = isInline
        ? [
            "flex h-[calc(100vh-96px)] w-full flex-col overflow-hidden",
            "rounded-2xl border border-white/10",
            "bg-gradient-to-b from-[#16181d]/80 via-[#16181d]/95 to-[#16181d]",
            "shadow-[-24px_0_80px_rgba(0,0,0,0.28)]",
        ].join(" ")
      : [
            "absolute right-0 top-0",
            "flex h-full w-full max-w-[540px] flex-col overflow-hidden",
            "bg-gradient-to-b from-[#16181d]/40 via-[#16181d]/80 to-[#16181d]",
            "shadow-[-24px_0_80px_rgba(0,0,0,0.38)]",
        ].join(" ")

    const [isDeleteRecipeDialogOpen, setIsDeleteRecipeDialogOpen] = useState(false)
    const [isDeletingRecipe, setIsDeletingRecipe] = useState(false)

    const isRecipePublic = recipe.status === "published"
    const showInteractions = isRecipePublic

    const canManageRecipe = Boolean(currentUser?.uid && recipe.userId === currentUser.uid)
    const [isRecipeMenuOpen, setIsRecipeMenuOpen] = useState(false)
    const [userRating, setUserRating] = useState<number | null>(null)
    const [ratingLoading, setRatingLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<ViewRecipeTab>("ingredients")

    const [ratingStats, setRatingStats] = useState({
        averageRating: Number(recipe?.stats?.averageRating || 0),
        ratingsCount: Number(recipe?.stats?.ratingsCount || 0)
    })

    const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({})
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

    const [liveAuthorFollowersCount, setLiveAuthorFollowersCount] = useState(Number(authorFollowersCount || 0))

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
    const totalLiveCommentsCount = useMemo(() => {
        return comments.reduce((total, comment) => {
            return total + 1 + (comment.replies?.length || 0)
        }, 0)
    }, [comments])

    useEffect(() => {
        if (!recipe.recipeId) return
        if (isLoadingComments) return

        onCommentStateChange(recipe.recipeId, totalLiveCommentsCount)
    }, [recipe.recipeId, totalLiveCommentsCount, isLoadingComments, onCommentStateChange])
    
    useEffect(() => {   
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose()
            }
        }
        
        window.addEventListener("keydown", handleKeyDown)
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [onClose])

    useEffect(() => {
        if (!recipe.userId) {
            setLiveAuthorFollowersCount(Number(authorFollowersCount || 0))
            return
        }

        const userRef = doc(db, "users", recipe.userId)

        const unsubscribe = onSnapshot(userRef, (snapshot) => {
            if (!snapshot.exists()) {
            setLiveAuthorFollowersCount(Number(authorFollowersCount || 0))
            return
            }

            const data = snapshot.data()

            setLiveAuthorFollowersCount(
            Number(data.stats?.followersCount || 0)
            )
        })

        return () => unsubscribe()
    }, [recipe.userId, authorFollowersCount])

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

    useEffect(() => {
        setExpandedSteps(
            Object.fromEntries(
                (recipe?.cookingSteps || []).map((_step, index) => [index + 1, true])
            )
        )
    }, [recipe?.id])

    const ingredients = useMemo(() => {
        return Array.isArray(recipe?.ingredients) ? recipe.ingredients : []
    }, [recipe?.ingredients])

    const steps = useMemo(() => {
        return Array.isArray(recipe?.cookingSteps) ? recipe.cookingSteps : []
    }, [recipe?.cookingSteps])

    const areAllStepsExpanded = useMemo(() => {
        if (!steps.length) return false
        return steps.every((_, index) => expandedSteps[index + 1])
    }, [steps, expandedSteps])

    const authorUsername = recipe?.author?.username || "Unknown"
    const authorProfileImage = recipe?.author?.profileImage || ""
    const averageRating = ratingStats.averageRating
    const ratingsCount = ratingStats.ratingsCount
    const commentsCount = totalLiveCommentsCount
    const description = recipe?.description || ""
    
    const followButtonDisabled = isFollowLoading || !currentUser?.uid || isOwner
    const shouldCollapseDescription = description.trim().length > 100

    const [isSubmittingComment, setIsSubmittingComment] = useState(false)
    const [commentReactions, setCommentReactions] = useState<Record<string, "like" | "dislike">>({})

    const commentsWithReactions = useMemo(() => {
        return comments.map((comment) => ({
            ...comment,
            currentUserReaction: commentReactions[comment.id] || null,
            replies: comment.replies?.map((reply) => ({
            ...reply,
            currentUserReaction: commentReactions[reply.id] || null,
            })),
        }))
    }, [comments, commentReactions])

    const hiddenCommentUserIds = useMemo(() => {
        return new Set(
            [...blockedUserIds, ...blockedByUserIds]
            .filter(Boolean)
            .map((id) => id.trim())
        )
    }, [blockedUserIds, blockedByUserIds])

    const visibleCommentsWithReactions = useMemo(() => {
        return commentsWithReactions
            .filter((comment) => {
            const commentUserId = comment.userId?.trim()
            return !commentUserId || !hiddenCommentUserIds.has(commentUserId)
            })
            .map((comment) => ({
            ...comment,
            replies: (comment.replies || []).filter((reply) => {
                const replyUserId = reply.userId?.trim()
                return !replyUserId || !hiddenCommentUserIds.has(replyUserId)
            }),
        }))
    }, [commentsWithReactions, hiddenCommentUserIds])

     const visibleCommentsCount = useMemo(() => {
        return visibleCommentsWithReactions.reduce((total, comment) => {
            return total + 1 + (comment.replies?.length || 0)
        }, 0)
    }, [visibleCommentsWithReactions])
    const displayedCommentsCount = visibleCommentsCount
    const showComments = isRecipePublic

    
    const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null)
    const [isSubmittingReply, setIsSubmittingReply] = useState(false)

    const [commentToDelete, setCommentToDelete] = useState<ViewRecipeComment | null>(null)
    const [isDeletingComment, setIsDeletingComment] = useState(false)
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
    const [isUpdatingComment, setIsUpdatingComment] = useState(false)

    useEffect(() => {
        if (!recipe.recipeId || !currentUser?.uid) {
            setCommentReactions({})
            return
        }

        const unsubscribe = listenToRecipeCommentReactions(
            recipe.recipeId,
            currentUser.uid,
            setCommentReactions
        )

        return () => unsubscribe()
    }, [recipe.recipeId, currentUser?.uid])

    useEffect(() => {
        setRatingStats({
            averageRating: Number(recipe?.stats?.averageRating || 0),
            ratingsCount: Number(recipe?.stats?.ratingsCount || 0),
        })

        setUserRating(null)
        setActiveTab("ingredients")
        setIsDescriptionExpanded(false)
        setIsRecipeMenuOpen(false)
    }, [recipe.recipeId])

    const handleRatingChange = async (_event: React.SyntheticEvent, value: number | null) => {
        if (!value || !currentUser?.uid || !recipe.recipeId || ratingLoading) return

        try {
            setRatingLoading(true)

            const result = await rateRecipe({
                recipeId: recipe.recipeId,
                userId: currentUser.uid,
                value,
                username: currentUser.username || "User",
                profileImage: currentUser.profileImage || "",
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
                replyToCommentId: comment.id,
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

    const handleToggleCommentReaction = async (
        comment: ViewRecipeComment,
        type: "like" | "dislike"
    ) => {
        if (!currentUser?.uid || !recipe.recipeId) return
        try {
            await toggleRecipeCommentReaction({
                recipeId: recipe.recipeId,
                commentId: comment.id,
                userId: currentUser.uid,
                username: currentUser.username || "User",
                profileImage: currentUser.profileImage || "",
                type,
            })
        } catch (error) {
            console.error("Failed to toggle comment reaction:", error)
        }
    }

    const tabs: {id: ViewRecipeTab; label: string, count?: number}[] = [
        {id: "ingredients", label: "Ingredients", count: ingredients.length},
        {id: "steps", label: "Steps", count: steps.length},
        ...(showComments
            ? [
                {
                    id: "comments" as const,
                    label: "Comments",
                    count: visibleCommentsCount,
                },
            ]
            : []),
    ]
    
    const toggleAllSteps = () => {
        if (areAllStepsExpanded) {
            setExpandedSteps({})
            return
        }

        setExpandedSteps(
            Object.fromEntries(steps.map((_, index) => [index + 1, true]))
        )
    }

    const toggleStep = (index: number) => {
        setExpandedSteps((prev) => ({
            ...prev,
            [index]: !prev[index],
        }))
    }

    const handleConfirmDeleteRecipe = async () => {
        if (!currentUser || !recipe.recipeId || isDeletingRecipe) return

        try {
            setIsDeletingRecipe(true)

            await deleteRecipe({
                recipeId: recipe.recipeId,
                currentUser,
            })

            onDeleteRecipe(recipe.recipeId)
        } catch (error) {
            console.error("Failed to delete recipe:", error)
        } finally {
            setIsDeletingRecipe(false)
            setIsDeleteRecipeDialogOpen(false)
        }
    }

    const drawer = (
        <aside        
            style={isInline ? { width, flexShrink: 0 } : undefined}
            className={asideClassName}
        >
            <div className="flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
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

                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#16181d] to-transparent" />
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#16181d]/90 text-[#a8b3cf] backdrop-blur-xl transition hover:bg-[#0b0b0c] hover:text-white active:scale-95"
                    >
                        <CloseRoundedIcon sx={{ fontSize: 20 }} />
                    </button>

                    <div className="absolute right-5 top-5 z-30">
                        <button
                            type="button"
                            onClick={() => setIsRecipeMenuOpen((prev) => !prev)}
                            className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#16181d]/90 text-[#a8b3cf] backdrop-blur-xl transition hover:bg-[#0b0b0c] hover:text-white active:scale-95"
                        >
                            <MoreVertRoundedIcon sx={{ fontSize: 21 }} />
                        </button>

                        <AnimatePresence>
                            {isRecipeMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                transition={{ duration: 0.16 }}
                                className="absolute right-0 top-[calc(100%+10px)] w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0c] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
                            >
                                {showInteractions && (
                                    <button
                                        type="button"
                                        onClick={() => onShareRecipe?.(recipe)}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#a8b3cf] transition hover:bg-[#16181d] hover:text-white"
                                    >
                                        <ShareRoundedIcon sx={{ fontSize: 18 }} />
                                        Share
                                    </button>
                                )}

                                {canManageRecipe && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => onEditRecipe(recipe)}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#a8b3cf] transition hover:bg-[#16181d] hover:text-white"
                                    >
                                    <EditRoundedIcon sx={{ fontSize: 18 }} />
                                        {recipe.status === "needs_revision" ? "Resolve revision" : "Edit recipe"}
                                    </button>

                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#db7668] transition hover:bg-[#db4633]/10 hover:text-[#ff8b7d]"
                                        onClick={() => {
                                            setIsRecipeMenuOpen(false)
                                            setIsDeleteRecipeDialogOpen(true)
                                        }}
                                    >
                                    <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                                        Delete recipe
                                    </button>
                                </>
                                )}
                            </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {showInteractions && (
                        <button
                            type="button"
                            onClick={handleToggleFavorite}
                            disabled={isFavoriteLoading}
                            className="absolute bottom-[10px] right-7 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[#23262f] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
                            >
                            <BookmarkRoundedIcon
                                sx={{
                                    color: isFavorite ? "#feaa2b" : "#ffffff",
                                    fontSize: 20,
                                }}
                            />
                        </button>
                    )}
                </div>

                <div className="relative z-10 -mt-10 rounded-t-[2.8rem] bg-[#16181d] px-7 pb-8 pt-10">
                    <div className="mb-3 flex flex-wrap gap-3">
                        {recipe.cuisine && (
                            <div className="inline-flex items-center gap-2 rounded-xl text-xs border border-orange-400/15 bg-orange-500/10 px-3 py-2 text-orange-200 capitalize">
                                <RestaurantRoundedIcon sx={{ fontSize: 17 }} />
                                {recipe.cuisine}
                            </div>
                        )}

                        <div className="flex items-center gap-2 rounded-xl text-xs border border-orange-400/15 bg-orange-500/10 px-3 py-2  text-orange-200 capitalize">
                            <span>{recipe.meal}</span>
                        </div>
                    </div>
                    
                    <h1 className="max-w-[92%] text-[1.6rem] font-bold leading-[2.35rem] text-white">
                        {recipe.title}
                    </h1>

                    {showInteractions && (

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
                    )}

                    <div className="mt-8">
                        <p className="text-sm font-medium text-[#9aa6c7]">Recipe by</p>

                        <div className="mt-3 flex items-center gap-8">
                            <button 
                                type="button"
                                onClick={() => {
                                    if (!recipe.userId) return
                                    onAuthorClick?.(recipe.userId)
                                }}
                                className="flex min-w-0 items-center gap-3 rounded-lg text-left transition hover:bg-white/[0.04] active:scale-[0.99]"
                            >
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
                                    <p className="truncate text-base font-medium text-[#c7d0e7]">{authorUsername}</p>
                                    <p className="text-sm text-[#7f89a6]">
                                        {formatFollowersLabel(liveAuthorFollowersCount)}
                                    </p>
                                </div>
                            </button>

                            {showInteractions && (
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
                            )}
                        </div>
                    </div>

                    <div className="mt-10 grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-[#0b0b0c] border border-white/[0.10] px-4 py-5 text-center">
                            <div className="flex justify-center text-white">
                                <AccessTimeOutlinedIcon sx={{ fontSize: 22 }} />
                            </div>

                            <p className="mt-3 text-sm font-semibold text-white">duration</p>
                        </div>

                        <div className="rounded-xl bg-[#0b0b0c] border border-white/[0.10] px-4 py-5 text-center">
                            <div className="flex justify-center text-white">
                                <SignalCellularAltRoundedIcon sx={{ fontSize: 22 }} />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-white">difficulty</p>
                        </div>

                        <div className="rounded-xl bg-[#0b0b0c] border border-white/[0.10] px-4 py-5 text-center">
                            <div className="flex justify-center text-white">
                                <RestaurantRoundedIcon sx={{ fontSize: 22 }} />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-white">portions</p>
                        </div>

                        <div className="flex justify-center">
                            <span className="rounded-lg bg-[#0b0b0c]/60 border border-white/[0.10] px-5 py-2 text-sm font-semibold text-white">
                                {formatDurationMinutes(recipe.durationMinutes)}
                            </span>
                        </div>

                        <div className="flex justify-center">
                            <span className="rounded-lg bg-[#0b0b0c]/60 border border-white/[0.10] px-5 py-2 text-sm font-semibold text-white">
                                {recipe.difficulty}
                            </span>
                        </div>

                        <div className="flex justify-center">
                            <span className="rounded-lg bg-[#0b0b0c]/60 border border-white/[0.10] px-5 py-2 text-sm font-semibold text-white">
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
                                maxHeight: shouldCollapseDescription &&  !isDescriptionExpanded ? 200 : 1000,
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

                    <div className="sticky top-0 z-20 mt-10 bg-[#16181d]/95 py-3 backdrop-blur-xl">
                        <div 
                            className="grid grid-cols-3 gap-2 rounded-xl bg-[#0b0b0c] p-1"
                            style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
                        >
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={[
                                            "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition active:scale-95",
                                            isActive
                                                ? "bg-orange-500/20 text-white"
                                                : "text-[#7f89a6] hover:bg-white/[0.06] hover:text-white",
                                        ].join(" ")}
                                    >
                                        <span>{tab.label}</span>

                                        {typeof tab.count === "number" && (
                                            <span className={[
                                                    "text-[0.68rem]",
                                                    isActive ? "text-white/90" : "text-[#7f89a6]"
                                                ].join(" ")}
                                            >
                                                {formatCompactCount(tab.count, true)}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="pt-2">
                        <AnimatePresence mode="wait" initial={false}>
                            {activeTab === "ingredients" && (
                                <motion.div
                                    key="ingredients"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <ViewRecipeIngredients ingredients={ingredients} />
                                </motion.div>
                            )}

                            {activeTab === "steps" && (
                                <motion.div
                                    key="steps"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <ViewRecipeStepsSection
                                        steps={steps}
                                        expandedSteps={expandedSteps}
                                        areAllStepsExpanded={areAllStepsExpanded}
                                        onToggleStep={toggleStep}
                                        onToggleAllSteps={toggleAllSteps}
                                    />
                                </motion.div>
                            )}

                            {showComments && activeTab === "comments" && (
                                <motion.div
                                    key="comments"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <ViewRecipeCommentsSection
                                        commentsCount={visibleCommentsCount}
                                        comments={visibleCommentsWithReactions}
                                        currentUser={currentUser}
                                        onAuthorClick={onAuthorClick}
                                        isLoadingComments={isLoadingComments}
                                        isSubmittingComment={isSubmittingComment}
                                        editingCommentId={editingCommentId}
                                        isUpdatingComment={isUpdatingComment}
                                        replyingCommentId={replyingCommentId}
                                        isSubmittingReply={isSubmittingReply}
                                        onSubmitComment={handleSubmitComment}
                                        onStartReplyComment={(comment) => setReplyingCommentId(comment.id)}
                                        onCancelReplyComment={() => setReplyingCommentId(null)}
                                        onReplyComment={handleSubmitReply}
                                        onToggleCommentReaction={handleToggleCommentReaction}
                                        onStartEditComment={(comment) => setEditingCommentId(comment.id)}
                                        onCancelEditComment={() => setEditingCommentId(null)}
                                        onUpdateComment={handleUpdateComment}
                                        onDeleteComment={setCommentToDelete}
                                        onBlockUser={onBlockUser}
                                        blockedUserIds={blockedUserIds}
                                        blockedByUserIds={blockedByUserIds}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </aside>
    )

    if (isInline) {
        return (
            <>
                {drawer}

                <DeleteWarningDialog
                    isOpen={Boolean(commentToDelete)} 
                    isDeleting={isDeletingComment}
                    title="Delete comment?"
                    description="This action cannot be undone. The comment will be permanently removed."
                    onCancel={() => setCommentToDelete(null)}
                    onConfirm={handleConfirmDeleteComment}
                />

                <DeleteWarningDialog
                    isOpen={isDeleteRecipeDialogOpen}
                    isDeleting={isDeletingRecipe}
                    title="Delete recipe?"
                    description={`Are you sure you want to delete "${recipe.title}"? This action cannot be undone. The recipe, its ingredients, steps, comments and ratings will no longer be available.`}
                    confirmLabel="Delete"
                    onCancel={() => setIsDeleteRecipeDialogOpen(false)}
                    onConfirm={handleConfirmDeleteRecipe}
                />
            </>
        )
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

            {drawer}
        </div>
    )
}
