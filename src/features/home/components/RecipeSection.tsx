import { useEffect, useRef, useState } from "react"
import type { Recipe, SavedRecipe } from "../types"
import RecipeCard from "./RecipeCard"
import CircularProgress from '@mui/material/CircularProgress'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { motion, useInView } from "motion/react"

import TuneIcon from '@mui/icons-material/Tune'

interface RecipeSectionProps {
  title: string
  recipes: Recipe[]
  visibleCount: number
  onShowMore: () => void
  currentUserId: string | null
  savedRecipes: SavedRecipe[]
  followingUserIds: string[]
  authorFollowersCountMap: Record<string, number>
  onFollowStateChange: (authorId: string, isNowFollowing: boolean) => void
  onFavoriteStateChange: (recipeId: string, isNowSaved: boolean) => void
  onRecipeClick: (recipe: Recipe) => void
  isLoading: boolean
  onOpenFilters: () => void
}

const initial_staggered_count = 20

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 42,
    filter: "blur(10px)",
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      delay: index < initial_staggered_count ? index * 0.1 + 0.05 : 0,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  })
}

export default function RecipeSection({
    title,
    recipes,
    visibleCount,
    onShowMore,
    currentUserId,
    savedRecipes,
    followingUserIds,
    authorFollowersCountMap,
    onFollowStateChange,
    onFavoriteStateChange,
    onRecipeClick,
    isLoading,
    onOpenFilters
}: RecipeSectionProps) {
    const sectionRef = useRef<HTMLElement | null>(null)
    const isInView = useInView(sectionRef, {
        amount: 0.2,
        margin: "0px 0px -10% 0px"
    })

    const [hasAnimated, setHasAnimated] = useState(false)

    useEffect(() => {
        if (isInView && !hasAnimated) {
            setHasAnimated(true)
        }
    }, [isInView, hasAnimated])

    if (!isLoading && !recipes.length) return null

    const visibleRecipes = recipes.slice(0, visibleCount)
    const hasMore = recipes.length > visibleCount


  return (
    <section ref={sectionRef} className="w-full min-h-[calc(100vh-140px)]">
        <div className="mb-12 flex items-center justify-between gap-4">
            <h2 className="text-[1.3rem] 2xl-plus:text-[1.6rem] text-white/50">
                {title}
            </h2>

            <button
                type="button"
                onClick={onOpenFilters}
                aria-label="Open filters"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0b0b0c]/40 text-[#a8b3cf] backdrop-blur-xl transition duration-200 hover:scale-105 hover:bg-[#0b0b0c] hover:text-white active:scale-100"
            >
                <TuneIcon sx={{ fontSize: 20 }} />
            </button>
        </div>

        {isLoading ? (
            <div className="flex min-h-[320px] w-full items-center justify-center">
                <CircularProgress
                    size={42}
                    thickness={4.2}
                    sx={{
                    color: "#fff",
                    }}
                />
            </div>
        ) : (
            <motion.div 
                className="flex flex-wrap justify-center gap-[25px]"
            >
                {visibleRecipes.map((recipe, index) => (
                    <motion.div
                        key={recipe.recipeId}
                        custom={index}
                        variants={cardVariants}
                        initial="hidden"
                        animate={hasAnimated ? "visible" : "hidden"}
                        className="will-change-transform"
                    >
                        <RecipeCard
                            recipe={recipe}
                            onClick={() => onRecipeClick(recipe)}
                            currentUserId={currentUserId}
                            followingUserIds={followingUserIds}
                            authorFollowersCount={authorFollowersCountMap[recipe.userId || ""] ?? Number(recipe?.author?.followersCount || 0)}
                            onFollowStateChange={onFollowStateChange}
                            onFavoriteStateChange={onFavoriteStateChange}
                            savedRecipes={savedRecipes}
                        />                    
                    </motion.div>
                ))}
            </motion.div>
        )}
        
        {hasMore && !isLoading && (
            <div className="my-10 flex w-full justify-center">
                <button 
                    onClick={onShowMore}
                    className="
                    group relative flex items-center justify-center h-14 w-14 rounded-full bg-[#0b0b0c]/40 backdrop-blur-xl
                    border border-[#a8b3cf]/10 transition duration-200 hover:bg-[#0b0b0c] hover:border-[#a8b3cf]/20 hover:scale-105
                    active:scale-95 
                    "
                >
                    <KeyboardArrowDownIcon
                        className="
                        text-[#a8b3cf]
                        transition duration-300
                        group-hover:text-white
                        "
                        sx={{ fontSize: 30 }}
                    />
                </button>
            </div>
        )}
    </section>
  )
}
