import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { AnimatePresence, motion } from "motion/react"
import PostRecipeForm from "./PostRecipeForm"
import { useState } from "react"
import { CurrentUserCardData } from "../../types/recipeCard.types"
import PostRecipeSubmissionInfo from "./PostRecipeSubmissionInfo"
import { Recipe } from "../../types"

interface PostRecipeDrawerProps {
    currentUser: CurrentUserCardData | null
    onClose: () => void
    onSubmitSuccess: () => void
    mode?: "create" | "edit"
    recipeToEdit?: Recipe | null
    onUpdateSuccess?: () => void
    variant?: "modal" | "side"
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
    onSubmitSuccess, 
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
    const [showSubmissionInfo, setShowSubmissionInfo] = useState(mode !== "edit")
    const isSideVariant = variant === "side"
    
  return (
    <div 
        className={[
            "fixed right-0 z-[90]",
            isSideVariant ? "" : "inset-0",
        ].join(" ")}
        style={isSideVariant ? {top: topOffset, height: `calc(100vh - ${topOffset}px)`, width,} : undefined}
    >
        {!isSideVariant && (
            <motion.div
            className="absolute inset-0 bg-[#050506]/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            />
        )}
        
        <motion.aside
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "spring", stiffness: 240, damping: 30, mass: 1 }}
            style={isSideVariant ? { width } : undefined}
            className={[
                "absolute right-0 flex flex-col overflow-hidden bg-[#16181d] shadow-[-24px_0_80px_rgba(0,0,0,0.42)]",
                isSideVariant
                    ? "top-0 h-full border-l border-white/10"
                    : "top-0 h-full w-full max-w-[580px]",
            ].join(" ")}
        >

            {isSideVariant && onResizeStart && (
                <div
                    onMouseDown={onResizeStart}
                    className="absolute left-0 top-0 z-50 h-full w-3 -translate-x-1/2 cursor-col-resize before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:bg-white/10 hover:before:bg-orange-400/60"
                />
            )}

            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
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
            </div>
        </motion.aside>

        <AnimatePresence>
            {showSubmissionInfo && mode !== "edit" && !isSideVariant && (
                <PostRecipeSubmissionInfo onContinue={() => setShowSubmissionInfo(false)} />
            )}
        </AnimatePresence>
    </div>
  )
}
