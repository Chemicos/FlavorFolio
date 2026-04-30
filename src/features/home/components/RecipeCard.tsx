/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState, useRef } from 'react'
import type { Recipe, SavedRecipe } from "../types"
import type { CurrentUserCardData } from '../types/recipeCard.types'
import { getAuth } from 'firebase/auth'

import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import MuiRating from "@mui/material/Rating"

import CircularProgress from "@mui/material/CircularProgress"
import { useRecipeCardActions } from '../hooks/useRecipeCardActions'
import { useImageLoaded } from '../hooks/useImageLoaded'
import { formatCompactCount, formatFollowersLabel, truncateText } from '../utils/recipeCardFormatters'

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
  currentUser: CurrentUserCardData | null
  savedRecipes: SavedRecipe[]
  followingUserIds: string[]
  authorFollowersCount: number
  onFollowStateChange: (authorId: string, isNowFollowing: boolean) => void
  onFavoriteStateChange: (recipeId: string, isNowSaved: boolean) => void
}

export default function RecipeCard({
   recipe, onClick, currentUser, savedRecipes, followingUserIds, 
   authorFollowersCount, onFollowStateChange, onFavoriteStateChange
}: RecipeCardProps) {
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
    imageRef: recipeImageRef,
    loaded: recipeImageLoaded,
    onLoad: handleRecipeImageLoad,
    onError: handleRecipeImageError,
  } = useImageLoaded(recipe.image)

  const {
    imageRef: authorImageRef,
    loaded: authorImageLoaded,
    onLoad: handleAuthorImageLoad,
    onError: handleAuthorImageError,
  } = useImageLoaded(recipe.author?.profileImage)

  const authorUsername = recipe?.author?.username || "Unknown"
  const authorProfileImage = recipe?.author?.profileImage || ""
  const averageRating = Number(recipe?.stats?.averageRating || 0)
  const ratingsCount = Number(recipe?.stats?.ratingsCount || 0)
  const commentsCount = Number(recipe?.stats?.commentsCount || 0)
  const truncatedTitle = useMemo(() => truncateText(recipe?.title, 25), [recipe?.title])

  const followButtonDisabled = isFollowLoading || !currentUser?.uid || isOwner

  const handleCardClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement

    const clickedInteractiveElement = target.closest(
      "button, a, input, textarea, select, [data-no-card-click]"
    )

    if (clickedInteractiveElement) return

    onClick()
  }

  const auth = getAuth()
  return (
    <article
      onClick={handleCardClick}
      className='group relative w-[300px] 2xl-plus:w-[350px] cursor-pointer transition duration-150 hover:-translate-y-2'
    >
      <div className='relative flex flex-col items-center'>
        <div className='relative z-0 h-[200px] 2xl-plus:h-[250px] w-full overflow-hidden rounded-t-[2.3rem] 2xl-plus:rounded-t-[3rem]'>
          {!recipeImageLoaded && (
            <div className='absolute inset-0 animate-pulse bg-white/10'></div>
          )}

          <img 
            ref={recipeImageRef}
            src={recipe.image} 
            alt={recipe.title} 
            onLoad={handleRecipeImageLoad}
            onError={handleRecipeImageError}
            className={[
              'h-full w-full object-cover transition duration-500',
              recipeImageLoaded ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          />

          <button
            type='button'
            data-no-card-click
            onClick={handleToggleFavorite}
            className='absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[#0b0b0c]/40 backdrop-blur-md transition hover:bg-[#0b0b0c]/60
            duration-150 active:scale-90 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={isFavoriteLoading}
          >
            <FavoriteIcon 
              sx={{
                color: isFavorite ? "#feaa2b" : "#ffffff",
                fontSize: 22,
              }}
            />
          </button>
        </div>

        <div className='relative z-10 -mt-10 w-full rounded-[2.3rem] 2xl-plus:rounded-[2.5rem] bg-[linear-gradient(180deg,_rgba(11,11,12,1)_50%,_rgba(11,11,12,0.56)_72%,_rgba(20,24,34,0)_100%)] 
        group-hover:bg-[#0b0b0c] px-5 pb-7 pt-5 2xl-plus:px-7 2xl-plus:pb-8 2xl-plus:pt-6 transition duration-300 ease-in-out
        '>
          <h2 className='line-clamp-2 text-[1rem] 2xl-plus:text-lg font-bold leading-7 2xl-plus:leading-8 text-white'>
            {truncatedTitle}
          </h2>

          <div className='mt-2 flex items-center gap-1.5 2xl-plus:gap-2 text-[#d9dde9]'>
            <MuiRating 
              value={averageRating}
              precision={0.5}
              readOnly
              size="small"
              sx={{
                color: "#feaa2b",
                "& .MuiRating-iconFilled": {
                  color: "#feaa2b",
                },
                "& .MuiRating-iconEmpty": {
                  color: "rgba(242, 193, 75, 0.28)",
                },
              }}
            />

            <div className='flex items-center gap-1'>
              <span className='text-[0.80rem] 2xl-plus:text-sm font-semibold text-white'>
                {averageRating.toFixed(1)}
              </span>

              <span className='text-[0.80rem] 2xl-plus:text-sm text-[#b5bdd2]'>
                {formatCompactCount(ratingsCount, true)}
              </span>
            </div>

            <div className='flex items-center gap-1 text-white'>
              <ChatBubbleOutlineIcon sx={{fontSize: 15}} />

              <span className='text-[0.80rem] 2xl-plus:text-sm text-[#a8b3cf]'>
                {formatCompactCount(commentsCount, true)}
              </span>
            </div>
          </div>
          
          <div className='mt-5'>
            <p className='text-[0.80rem] 2xl-plus:text-sm font-medium text-[#a8b3cf]'>Recipe by</p>

            <div className='mt-2 flex items-center justify-between gap-4'>
              <div className='flex min-w-0 items-center gap-4'>
                <div className='h-9 w-9 2xl-plus:h-10 2xl-plus:w-10 overflow-hidden rounded-lg 2xl-plus:rounded-xl bg-white/10'>
                  {authorProfileImage ? (
                    <>
                      {!authorImageLoaded && (
                        <div className='flex h-full w-full animate-pulse items-center justify-center bg-white/10 text-sm font-semibold text-white/70'>
                          {authorUsername?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}

                      <img
                        ref={authorImageRef}
                        src={authorProfileImage}
                        alt={authorUsername}
                        onLoad={handleAuthorImageLoad}
                        onError={handleAuthorImageError}
                        className={[
                          'h-full w-full object-cover transition-opacity duration-300',
                          authorImageLoaded ? 'opacity-100' : 'opacity-0',
                        ].join(' ')}
                      />
                    </>
                  ) : (
                    <div className='flex h-full w-full items-center justify-center text-sm font-semibold text-white/70'>
                      {authorUsername?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className='min-w-0'>
                  <p className='truncate text-[0.80rem] 2xl-plus:text-sm text-[#a8b3cf]'>
                    {authorUsername}
                  </p>
                  <p className='text-[0.80rem] 2xl-plus:text-sm text-[#a8b3cf]/50'>
                    {formatFollowersLabel(authorFollowersCount)}
                  </p>
                </div>
              </div>

              <button
                type='button'
                onClick={handleToggleFollow}
                data-no-card-click
                disabled={followButtonDisabled}
                className={[
                  'inline-flex min-w-[92px] items-center justify-center rounded-lg border px-5 py-1.5 2xl-plus:px-6 2xl-plus:py-2 text-[0.80rem] 2xl-plus:text-sm font-medium transition active:scale-90',
                  isFollowing
                  ? "border-[#a8b3cf]/20 bg-white/5 text-white hover:border-white/20 hover:bg-white/10"
                  : "border-white/10 text-[#c6cee0] hover:border-white/20 hover:bg-white/5 hover:text-white",
                  followButtonDisabled
                  ? "cursor-not-allowed opacity-60"
                  : ""
                ].join(" ")}

              >
                {isOwner ? (
                  "You"
                ) : isFollowLoading ? (
                  <CircularProgress 
                    size={15}
                    thickness={5}
                    sx={{
                      color: "rgba(255,255,255,0.8)"
                    }}
                  />
                ) : isFollowing ? ("Following") : ("Follow")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
