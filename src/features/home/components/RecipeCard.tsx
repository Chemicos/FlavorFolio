/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState, useRef } from 'react'
import type { Recipe, SavedRecipe } from "../types"
import { 
  arrayUnion, 
  deleteDoc, 
  doc, 
  getDoc, 
  runTransaction, 
  serverTimestamp, 
  setDoc, 
  updateDoc 
} from '@firebase/firestore'
import { db } from '../../../firebase-config'
import { getAuth } from 'firebase/auth'

import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import MuiRating from "@mui/material/Rating"

import CircularProgress from "@mui/material/CircularProgress"

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
  currentUserId: string | null
  savedRecipes: SavedRecipe[]
  followingUserIds: string[]
  authorFollowersCount: number
  onFollowStateChange: (authorId: string, isNowFollowing: boolean) => void
  onFavoriteStateChange: (recipeId: string, isNowSaved: boolean) => void
}

export default function RecipeCard({
   recipe, onClick, currentUserId, savedRecipes, followingUserIds, authorFollowersCount, onFollowStateChange, onFavoriteStateChange
}: RecipeCardProps) {
  const [currentUsername, setCurrentUsername] = useState("")
  const [currentProfileImage, setCurrentProfileImage] = useState("")

  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)

  const authorUsername = recipe?.author?.username
  const authorProfileImage = recipe?.author?.profileImage
  const followersCount = authorFollowersCount

  const recipeImageRef = useRef<HTMLImageElement | null>(null)
  const authorImageRef = useRef<HTMLImageElement | null>(null)

  const [recipeImageLoaded, setRecipeImageLoaded] = useState(false)
  const [authorImageLoaded, setAuthorImageLoaded] = useState(false)

  const auth = getAuth()

  useEffect(() => {
    if (recipeImageRef.current?.complete && recipeImageRef.current.naturalWidth > 0) {
      setRecipeImageLoaded(true)
    }
  }, [recipe?.image])

  useEffect(() => {
    if (authorImageRef.current?.complete && authorImageRef.current.naturalWidth > 0) {
      setAuthorImageLoaded(true)
    }
  }, [authorProfileImage])

  useEffect(() => {
    if (!currentUserId || !recipe?.userId || currentUserId === recipe.userId) {
      setIsFollowing(false)
      return
    }

    setIsFollowing(followingUserIds.includes(recipe.userId))
  }, [currentUserId, followingUserIds, recipe?.userId])

  const isFavorite = useMemo(() => {
    if (!currentUserId || !recipe.recipeId) return false

    return savedRecipes.some((savedRecipe) => {
      if (typeof savedRecipe === "string") return savedRecipe === recipe.recipeId
      if (savedRecipe?.recipeId) return savedRecipe.recipeId === recipe.recipeId
      if (savedRecipe?.id) return savedRecipe.id === recipe.recipeId
      return false
    })
  }, [currentUserId, recipe.recipeId, savedRecipes])

  useEffect(() => {
    const fetchCurrentUserData = async () => {
      const user = auth.currentUser
      if (!user) return

      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        setCurrentUsername(userData.username)
        setCurrentProfileImage(userData.profileImage || user.photoURL)
      } else {
        setCurrentUsername(user.displayName || "")
        setCurrentProfileImage(user.photoURL || "")
      }
    }

    fetchCurrentUserData()
  }, [auth])

  const addFavoriteNotification = async (message: string) => {
    if (!recipe.userId) return

    try {
      const notificationRef = doc(db, "users", recipe.userId, "notifications", crypto.randomUUID())

      await setDoc(notificationRef, {
        type: isFavorite ? "recipe_unsaved" : "recipe_saved",
        actorUserId: currentUserId || "",
        actorUsername: currentUsername || "",
        actorProfileImage: currentProfileImage || "",
        recipeId: recipe.recipeId,
        recipeTitle: recipe.title,
        message,
        read: false,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error adding notification:", error)
    }
  }

  const toggleFollow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()

    const authorId = recipe.userId

    if (!currentUserId || !authorId || currentUserId === authorId || isFollowLoading) return

    setIsFollowLoading(true)

    const currentUserRef = doc(db, "users", currentUserId)
    const authorUserRef = doc(db, "users", authorId)

    const followingRef = doc(db, "users", currentUserId, "following", authorId)
    const followerRef = doc(db, "users", authorId, "followers", currentUserId)

    try {
      const didFollow = await runTransaction(db, async (transaction) => {
        const followingSnap = await transaction.get(followingRef)
        const authorSnap = await transaction.get(authorUserRef)
        const currentUserSnap = await transaction.get(currentUserRef)

        if (!authorSnap.exists() || !currentUserSnap.exists()) {
          throw new Error("User documents missing.")
        }

        const authorData = authorSnap.data()
        const currentData = currentUserSnap.data()

        const currentFollowersCount = Number(authorData?.stats?.followersCount || 0)
        const currentFollowingCount = Number(currentData?.stats?.followingCount || 0)

        if (followingSnap.exists()) {
          transaction.delete(followingRef)
          transaction.delete(followerRef)

          transaction.set(
            authorUserRef,
            {
              stats: {
                ...authorData?.stats,
                followersCount: Math.max(0, currentFollowersCount - 1),
              },
            },
            { merge: true }
          )

          transaction.set(
            currentUserRef,
            {
              stats: {
                ...currentData?.stats,
                followingCount: Math.max(0, currentFollowingCount - 1),
              },
            },
            { merge: true }
          )

          return false
        }

        transaction.set(followingRef, {
          userId: authorId,
          username: authorUsername || "",
          profileImageUrl: authorProfileImage || "",
          followedAt: serverTimestamp(),
        })

        transaction.set(followerRef, {
          userId: currentUserId,
          username: currentUsername || "",
          profileImageUrl: currentProfileImage || "",
          followedAt: serverTimestamp(),
        })

        transaction.set(
          authorUserRef,
          {
            stats: {
              ...authorData?.stats,
              followersCount: currentFollowersCount + 1,
            },
          },
          { merge: true }
        )

        transaction.set(
          currentUserRef,
          {
            stats: {
              ...currentData?.stats,
              followingCount: currentFollowingCount + 1,
            },
          },
          { merge: true }
        )

        return true
      })

      setIsFollowing(didFollow)
      onFollowStateChange(authorId, didFollow)

    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  const toggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (!currentUserId || !recipe.recipeId || isFavoriteLoading) return

    setIsFavoriteLoading(true)

    const savedRecipeRef = doc(db, "users", currentUserId, "savedRecipes", recipe.recipeId)
    const recipeRef = doc(db, "recipes", recipe.recipeId)
    const currentUserRef = doc(db, "users", currentUserId)

    try {
      const didSave = await runTransaction(db, async (transaction) => {
        const savedRecipeSnap = await transaction.get(savedRecipeRef)
        const recipeSnap = await transaction.get(recipeRef)
        const currentUserSnap = await transaction.get(currentUserRef)

        if (!recipeSnap.exists()) {
          throw new Error("Recipe document missing.")
        }

        if (!currentUserSnap.exists()) {
          throw new Error("Current user document missing.")
        }        

        const recipeData = recipeSnap.data()
        const currentUserData = currentUserSnap.data()

        const currentSavesCount = Number(recipeData?.stats.savesCount || 0)
        const currentSavedRecipesCount = Number(currentUserData?.stats?.savedRecipesCount || 0)

        if (savedRecipeSnap.exists()) {
          transaction.delete(savedRecipeRef)

          transaction.set(
            recipeRef,
            {
              stats: {
                ...recipeData?.stats,
                savesCount: Math.max(0, currentSavesCount - 1),
              },
            },
            { merge: true }
          )

          transaction.set(
            currentUserRef,
            {
              stats: {
                ...currentUserData?.stats,
                savedRecipesCount: Math.max(0, currentSavedRecipesCount - 1),
              },
            },
            { merge: true }
          )

          return false
        }

        transaction.set(savedRecipeRef, {
          recipeId: recipe.recipeId,
          userId: currentUserId,
          savedAt: serverTimestamp()
        })

        transaction.set(recipeRef, {
            stats: {
              ...recipeData?.stats,
              savesCount: currentSavesCount + 1
            }
          },
          {merge: true}
        )

        return true
      })

      await addFavoriteNotification(
        didSave
          ? `User ${currentUsername} added ${recipe.title} to their favorite recipes.`
          : `User ${currentUsername} removed ${recipe.title} from their favorite recipes.`
      )

      onFavoriteStateChange(recipe.recipeId, didSave)

      // const savedRecipeRef = doc(db, "users", currentUserId, "savedRecipes", recipe.recipeId)

      // if (isFavorite) {
      //   await deleteDoc(savedRecipeRef)
      //   await addFavoriteNotification(
      //     `User ${currentUsername} removed ${recipe.title} from their favorite recipes.`
      //   )
      // } else {
      //   await setDoc(savedRecipeRef, {
      //     recipeId: recipe.recipeId,
      //     userId: currentUserId,
      //     savedAt: serverTimestamp()
      //   })
      //   await addFavoriteNotification(
      //     `User ${currentUsername} added ${recipe.title} to their favorite recipes.`
      //   )
      // }

    } catch (error) {
      console.error("Error toggling favorite", error)
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  const averageRating = useMemo(() => {
    return Number(recipe?.stats?.averageRating || 0)
  }, [recipe?.stats?.averageRating])

  const ratingsCount = useMemo(() => {
    return Number(recipe?.stats?.ratingsCount || 0)
  }, [recipe?.stats?.ratingsCount])

  const commentsCount = useMemo(() => {
    return Number(recipe?.stats?.commentsCount || 0)
  }, [recipe?.stats?.commentsCount])

  const truncatedTitle = useMemo(() => {
    const title = recipe?.title || ""

    if(title.length <= 25) return title
    return `${title.slice(0, 25)}...`
  }, [recipe?.title])

  const formattedFollowers = useMemo(() => {
    if (followersCount === null || followersCount === undefined) return ""
    if (followersCount < 1000) return `${followersCount} followers`
    return `${(followersCount / 1000).toFixed(1)}k followers`
  }, [followersCount])

  const formattedRatingsCount = useMemo(() => {
    if (!ratingsCount) return "(0)"
    if (ratingsCount < 1000) return `(${ratingsCount})`
    return `(${(ratingsCount / 1000).toFixed(1)}k)`
  }, [ratingsCount])

  const formattedCommentsCount = useMemo(() => {
    if (!commentsCount) return "(0)"
    if (commentsCount < 1000) return `(${commentsCount})`
    return `(${(commentsCount / 1000).toFixed(1)}k)`
  }, [commentsCount])

  return (
    <article
      onClick={onClick}
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
            onLoad={() => setRecipeImageLoaded(true)}
            onError={() => setRecipeImageLoaded(true)}
            className={[
              'h-full w-full object-cover transition duration-500',
              recipeImageLoaded ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          />

          <button
            type='button'
            onClick={toggleFavorite}
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

              <span className='text-[0.80rem] 2xl-plus:text-sm text-[#b5bdd2]'>{formattedRatingsCount}</span>
            </div>

            <div className='flex items-center gap-1 text-white'>
              <ChatBubbleOutlineIcon sx={{fontSize: 15}} />
              <span className='text-[0.80rem] 2xl-plus:text-sm text-[#a8b3cf]'>{formattedCommentsCount}</span>
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
                        onLoad={() => setAuthorImageLoaded(true)}
                        onError={() => setAuthorImageLoaded(true)}
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
                    {formattedFollowers}
                  </p>
                </div>
              </div>

              <button
                type='button'
                onClick={toggleFollow}
                className={[
                  'inline-flex min-w-[92px] items-center justify-center rounded-lg border px-5 py-1.5 2xl-plus:px-6 2xl-plus:py-2 text-[0.80rem] 2xl-plus:text-sm font-medium transition active:scale-90',
                  isFollowing
                  ? "border-[#a8b3cf]/20 bg-white/5 text-white hover:border-white/20 hover:bg-white/10"
                  : "border-white/10 text-[#c6cee0] hover:border-white/20 hover:bg-white/5 hover:text-white",
                  isFollowLoading || !currentUserId || currentUserId === recipe.userId
                  ? "cursor-not-allowed opacity-60"
                  : ""
                ].join(" ")}

              >
                {currentUserId === recipe.userId ? (
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
