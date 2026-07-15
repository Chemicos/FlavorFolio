import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { AnimatePresence, motion } from "motion/react"
import PostRecipeForm from "./PostRecipeForm"
import { useState } from "react"
import { CurrentUserCardData } from "../../types/recipeCard.types"
import PostRecipeSubmissionInfo from "./PostRecipeSubmissionInfo"
import { Recipe } from "../../types"
import { CreatePostType } from "../../pages/Home"
import PostReelForm from "./PostReelForm"

interface PostRecipeDrawerProps {
    currentUser: CurrentUserCardData | null
    onClose: () => void

    postType?: CreatePostType

    onSubmitSuccess: () => void
    onReelSubmitSuccess?: () => void

    mode?: "create" | "edit"
    recipeToEdit?: Recipe | null
    onUpdateSuccess?: () => void
    variant?: "modal" | "side" | "inline"
    width?: number
    topOffset?: number
    onResizeStart?: (event: React.MouseEvent<HTMLDivElement>) => void
    updateMode?: "default" | "revision_draft"
    onRevisionDraftUpdate?: (payload: {
        recipeId: string
        payload: Record<string, any>
    }) => Promise<void>
}

export default function PostRecipeDrawer({
    currentUser, 
    onClose, 
    postType = "recipe",
    onSubmitSuccess, 
    onReelSubmitSuccess,
    mode, 
    recipeToEdit, 
    onUpdateSuccess,
    variant = "modal",
    width = 580,
    topOffset = 0,
    onResizeStart,
    updateMode = "default",
    onRevisionDraftUpdate,
}: PostRecipeDrawerProps) {
    const [showSubmissionInfo, setShowSubmissionInfo] = useState(mode !== "edit" && postType === "recipe")
    const isSideVariant = variant === "side"
    const isInlineVariant = variant === "inline"
    
  return (
    <div
        style={
            isInlineVariant
            ? { width: "100%" }
            : isSideVariant
                ? {
                    top: topOffset,
                    height: `calc(100vh - ${topOffset}px)`,
                    width,
                }
                : undefined
        }
        className={[
            isInlineVariant
            ? "h-[calc(100vh-96px)] w-full overflow-hidden"
            : "fixed right-0 z-[90]",
            !isSideVariant && !isInlineVariant ? "inset-0" : "",
        ].join(" ")}
    >
        {!isSideVariant && !isInlineVariant && (
            <motion.div
            className="absolute inset-0 bg-[#050506]/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            />
        )}
        
        <motion.aside
            initial={isInlineVariant ? { opacity: 0 } : { x: "105%" }}
            animate={isInlineVariant ? { opacity: 1 } : { x: 0 }}
            exit={isInlineVariant ? { opacity: 0 } : { x: "105%" }}
            transition={
                isInlineVariant
                ? { duration: 0.18, ease: "easeOut" }
                : { type: "spring", stiffness: 240, damping: 30, mass: 1 }
            }
            style={{ width: isInlineVariant ? "100%" : width, }}
            className={[
                "flex h-full flex-col overflow-hidden bg-[#16181d] shadow-[-24px_0_80px_rgba(0,0,0,0.42)]",
                isInlineVariant
                    ? "w-full rounded-2xl border border-white/10"
                    : isSideVariant
                    ? "absolute right-0 top-0 border-l border-white/10"
                    : "absolute right-0 top-0 w-full max-w-[580px]",
            ].join(" ")}
        >

            {onResizeStart && (isSideVariant || isInlineVariant) && (
                <div
                    onMouseDown={onResizeStart}
                    className="absolute left-0 top-0 z-50 h-full w-3 -translate-x-1/2 cursor-col-resize before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:bg-white/10 hover:before:bg-orange-400/60"
                />
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
                {postType === "reel" && mode !== "edit" ? (
                    <PostReelForm 
                        currentUser={currentUser}
                        onClose={onClose}
                        onSubmitSuccess={onReelSubmitSuccess || onSubmitSuccess}
                    />
                ): (
                    <PostRecipeForm 
                        currentUser={currentUser} 
                        onClose={onClose} 
                        onSubmitSuccess={onSubmitSuccess}
                        mode={mode}
                        recipeToEdit={recipeToEdit}
                        onUpdateSuccess={onUpdateSuccess}
                        updateMode={updateMode}
                        onRevisionDraftUpdate={onRevisionDraftUpdate}
                    />
                )}
                
            </div>
        </motion.aside>

        <AnimatePresence>
            {showSubmissionInfo && mode !== "edit" && postType === "recipe" && (
                <PostRecipeSubmissionInfo
                    onContinue={() => setShowSubmissionInfo(false)}
                />
            )}
        </AnimatePresence>
    </div>
  )
}
