import { useEffect, useRef, useState } from "react"
import type { Recipe, SavedRecipe } from "../types"
import RecipeCard from "./RecipeCard"
import CircularProgress from '@mui/material/CircularProgress'
import { motion, useInView } from "motion/react"

interface RecipeSectionProps {
  title: string
  recipes: Recipe[]
  visibleCount: number
  onShowMore: () => void
  currentUserId: string | null
  savedRecipes: SavedRecipe[]
  onRecipeClick: (recipe: Recipe) => void
  isLoading: boolean
}

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.05
        }
    }
}

const cardVariants = {
    hidden: {
        opacity: 0,
        y: 42,
        filter: "blur(10px)"
    },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            duration: 1,
            ease: [0.22, 1, 0.36, 1] as const
        }
    }
}

export default function RecipeSection({
    title,
    recipes,
    visibleCount,
    onShowMore,
    currentUserId,
    savedRecipes,
    onRecipeClick,
    isLoading
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
    <section ref={sectionRef} className="w-full">
        <div className="mb-10 flex items-center justify-between">
            <h2 className="text-[1.6rem] font-semibold text-white">
                {title}
            </h2>

            {hasMore && (
                <button
                    type="button"
                    onClick={onShowMore}
                    className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-[#a8b3cf] transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                >
                    Show more
                </button>
            )}
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
                variants={containerVariants}
                initial="hidden"
                animate={hasAnimated ? "visible" : "hidden"}
            >
                {visibleRecipes.map(recipe => (
                    <motion.div
                        key={recipe.recipeId}
                        variants={cardVariants}
                        className="will-change-transform"
                    >
                        <RecipeCard
                            key={recipe.recipeId}
                            recipe={recipe}
                            onClick={() => onRecipeClick(recipe)}
                            currentUserId={currentUserId}
                            savedRecipes={savedRecipes}
                        />                    
                    </motion.div>
                ))}
            </motion.div>
        )}
    </section>
  )
}
