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
    onUpdateSuccess?: (recipe?: Recipe) => void
    variant?: "modal" | "side"
    width?: number
    topOffset?: number
    onResizeStart?: (event: React.MouseEvent<HTMLDivElement>) => void
    updateMode?: "default" | "revision_draft"
    onRevisionDraftUpdate?: (payload: {
        recipeId: string
        payload: Record<string, any>
    }) => Promise<Recipe>
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
    
  return (
    <>
        <motion.aside
            initial={isSideVariant ? { x: "105%" } : { opacity: 0, y: 10, scale: 0.985 }}
            animate={isSideVariant ? { x: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isSideVariant ? { x: "105%" } : { opacity: 0, y: 8, scale: 0.985 }}
            transition={
                isSideVariant
                ? { type: "spring", stiffness: 240, damping: 30, mass: 1 }
                : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
            }
            style={
                isSideVariant 
                    ? {
                        top: topOffset,
                        height: `calc(100vh - ${topOffset}px)`,
                        width,
                    }
                    : undefined
            }
            className={[
                "flex flex-col overflow-hidden bg-[var(--bg-secondary)] shadow-[var(--shadow-panel)]",
                isSideVariant
                    ? "fixed right-0 z-[90] border-l border-[var(--border)]"
                    : "relative z-10 h-full max-h-[900px] w-full max-w-[820px] rounded-[2rem] border border-[var(--border)]",
            ].join(" ")}
        >

            {onResizeStart && isSideVariant && (
                <div
                    onMouseDown={onResizeStart}
                    className="absolute left-0 top-0 z-50 h-full w-3 -translate-x-1/2 cursor-col-resize before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:bg-[var(--border)] hover:before:bg-[var(--focus-border)]"
                />
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
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
    </>
  )
}
