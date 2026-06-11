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
}

export default function PostRecipeDrawer({currentUser, onClose, onSubmitSuccess, mode, recipeToEdit, onUpdateSuccess}: PostRecipeDrawerProps) {
    const [showSubmissionInfo, setShowSubmissionInfo] = useState(mode !== "edit")
    
  return (
    <div className="fixed inset-0 z-[90]">
        <motion.div
            className="absolute inset-0 bg-[#050506]/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
        />

        
        <motion.aside
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "spring", stiffness: 240, damping: 30, mass: 1 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[580px] flex-col overflow-hidden bg-[#16181d] shadow-[-24px_0_80px_rgba(0,0,0,0.42)]"
        >
            <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
                <PostRecipeForm 
                    currentUser={currentUser} 
                    onClose={onClose} 
                    onSubmitSuccess={onSubmitSuccess}
                    mode={mode}
                    recipeToEdit={recipeToEdit}
                    onUpdateSuccess={onUpdateSuccess}
                />
            </div>
        </motion.aside>

        <AnimatePresence>
            {showSubmissionInfo && mode !== "edit" && (
                <PostRecipeSubmissionInfo onContinue={() => setShowSubmissionInfo(false)} />
            )}
        </AnimatePresence>
    </div>
  )
}
