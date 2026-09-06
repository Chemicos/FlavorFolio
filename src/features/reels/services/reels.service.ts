import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "@firebase/firestore"
import { CreateReelInput, CreateReelResult, Reel, ReelMealType, ReelStatus, updateReelDraftInput } from "../types/reel.types"
import { db, storage } from "../../../firebase-config"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"

const MIN_REEL_TITLE_LENGTH = 3
const MAX_REEL_TITLE_LENGTH = 100
const MAX_REEL_DESCRIPTION_LENGTH = 500
const MAX_REEL_SIZE_BYTES = 200 * 1024 * 1024
const ALLOWED_REEL_MEAL_TYPES: ReelMealType[] = ["breakfast", "lunch", "dinner", "dessert", "snack",]

const ALLOWED_REEL_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
]

const ALLOWED_REEL_STATUSES: ReelStatus[] = ["published", "pending", "needs_revision", "draft"]

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase()
}

function validateCreateReelInput(input: CreateReelInput) {
  const title = input.title.trim()
  const description = input.description.trim()

  if (!input.userId) {
    throw new Error("You must be signed in to publish a reel.")
  }

  if (!title) {
    throw new Error("Reel title is required.")
  }

  if (title.length < MIN_REEL_TITLE_LENGTH) {
    throw new Error(
      `Title must contain at least ${MIN_REEL_TITLE_LENGTH} characters.`
    )
  }

  if (title.length > MAX_REEL_TITLE_LENGTH) {
    throw new Error(
      `Title cannot exceed ${MAX_REEL_TITLE_LENGTH} characters.`
    )
  }

  if (!description) {
    throw new Error("Reel description is required.")
  }

  if (description.length > MAX_REEL_DESCRIPTION_LENGTH) {
    throw new Error(
      `Description cannot exceed ${MAX_REEL_DESCRIPTION_LENGTH} characters.`
    )
  }

  if (!input.meal) {
    throw new Error("Meal type is required.")
  }

  if (!ALLOWED_REEL_MEAL_TYPES.includes(input.meal)) {
    throw new Error("Please select a valid meal type.")
  }

  if (!input.videoFile) {
    throw new Error("A video is required.")
  }

  if (!ALLOWED_REEL_VIDEO_TYPES.includes(input.videoFile.type)) {
    throw new Error("Please upload an MP4, WebM or MOV video.")
  }

  if (input.videoFile.size > MAX_REEL_SIZE_BYTES) {
    throw new Error("The video cannot exceed 200 MB.")
  }

  if (
    !Number.isFinite(input.durationSeconds) ||
    input.durationSeconds <= 0
  ) {
    throw new Error("The video duration could not be detected.")
  }
}

function mapReelDoc(docSnap: any): Reel {
  const data = docSnap.data()

  const status: ReelStatus = ALLOWED_REEL_STATUSES.includes(data.status)
    ? data.status : data.isPublished
      ? "published" : "pending"

  return {
    reelId: data.reelId || docSnap.id,
    userId: data.userId || data.author?.userId || "",

    author: {
      userId: data.author?.userId || data.userId || "",
      username:
        data.author?.username ||
        data.username ||
        "Unknown",
      profileImage:
        data.author?.profileImage ||
        data.userProfileImage ||
        "",
    },

    title: data.title || data.description || "Recipe inspiration",

    description: data.description || "",
    meal: (data.meal || "dinner") as ReelMealType,

    videoUrl: data.videoUrl || "",
    videoFileName: data.videoFileName || "",

    thumbnail: data.thumbnail || data.thumbnailUrl || "",

    duration: Number(data.duration || data.durationSeconds || 0),

    visibility: data.visibility || "public",
    status,

    stats: {
      likesCount: Number(
        data.stats?.likesCount ??
        data.likesCount ??
        0
      ),
      commentsCount: Number(
        data.stats?.commentsCount ??
        data.commentsCount ??
        0
      ),
      sharesCount: Number(
        data.stats?.sharesCount ??
        data.sharesCount ??
        0
      ),
      viewsCount: Number(
        data.stats?.viewsCount ??
        data.viewsCount ??
        0
      ),
    },

    createdAt: data.createdAt || undefined,
    updatedAt: data.updatedAt || undefined,
    submittedAt: data.submittedAt || undefined,
    publishedAt: data.publishedAt || undefined,
  }
}

export async function fetchReelById(reelId: string): Promise<Reel | null> {
  const reelSnapshot = await getDoc(doc(db, "reels", reelId))

  if (!reelSnapshot.exists()) {
    return null
  }

  return mapReelDoc(reelSnapshot)
}

export async function fetchUserReels(userId: string, status?: ReelStatus): Promise<Reel[]> {
  if (!userId) return []

  const reelsQuery = status ? query(
    collection(db, "reels"),
    where("userId", "==", userId),
    where("status", "==", status),
    orderBy("createdAt", "desc")
  ) : query(
    collection(db, "reels"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  )

  const snapshot = await getDocs(reelsQuery)

  return snapshot.docs.map(mapReelDoc).filter((reel) => Boolean(reel.videoUrl))
}

export async function fetchPublicReels(limitCount = 20): Promise<Reel[]> {
    const reelsQuery = query(
        collection(db, "reels"),
        where("status", "==", "published"),
        where("visibility", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    )

    const snapshot = await getDocs(reelsQuery)

    const reels = snapshot.docs.map(mapReelDoc).filter((reel) => Boolean(reel.videoUrl))

    const authorIds = [
      ...new Set(
        reels
          .map((reel) => reel.userId || reel.author?.userId)
          .filter((userId): userId is string => Boolean(userId))
      ),
    ]

    const authorEntries = await Promise.all(
      authorIds.map(async (userId) => {
        try {
          const userSnapshot = await getDoc(doc(db, "users", userId))

          if (!userSnapshot.exists()) {
            return [userId, null] as const
          }

          const userData = userSnapshot.data()

          return [
            userId,
            {
              username:
                userData.username ||
                userData.displayName ||
                userData.firstName ||
                "User",

              profileImage:
                userData.profileImage ||
                userData.profileImageUrl ||
                "",
            },
          ] as const
        } catch (error) {
          console.error(`Failed to fetch reel author ${userId}:`, error)

          return [userId, null] as const
        }
      })
    )

  const authorsById = new Map(authorEntries)

  return reels.map((reel) => {
    const authorId =
      reel.userId ||
      reel.author?.userId ||
      ""

    const liveAuthor = authorsById.get(authorId)

    if (!liveAuthor) {
      return reel
    }

    return {
      ...reel,

      author: {
        ...reel.author,
        userId: authorId,
        username: liveAuthor.username,
        profileImage: liveAuthor.profileImage,
      },
    }
  })
}

export async function createReel(input: CreateReelInput): Promise<CreateReelResult> {
  validateCreateReelInput(input)

  const reelRef = doc(collection(db, "reels"))
  const reelId = reelRef.id

  const safeFileName = sanitizeFileName(input.videoFile.name) || "reel-video.mp4"

  const videoStorageRef = ref(storage, `reels/${input.userId}/${reelId}/${Date.now()}-${safeFileName}`)

  const uploadSnapshot = await uploadBytes(
    videoStorageRef,
    input.videoFile,
    {
      contentType: input.videoFile.type,
      customMetadata: {
        userId: input.userId,
        reelId,
      },
    }
  )

  const videoUrl = await getDownloadURL(uploadSnapshot.ref)

  await setDoc(reelRef, {
    reelId,
    userId: input.userId,

    author: {
      userId: input.userId,
      username: input.username.trim() || "Unknown",
      profileImage: input.userProfileImage || "",
    },

    title: input.title.trim(),
    description: input.description.trim(),
    meal: input.meal,
    
    videoUrl,
    videoFileName: uploadSnapshot.ref.fullPath,

    thumbnailUrl: "",
    durationSeconds: Math.round(input.durationSeconds),

    visibility: input.visibility,

    status: "pending",
    isPublished: false,

    likesCount: 0,
    commentsCount: 0,
    savesCount: 0,
    sharesCount: 0,
    viewsCount: 0,

    recipeId: null,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    submittedAt: serverTimestamp(),
    publishedAt: null,
  })

  return {
    reelId,
    videoUrl,
  }
}

export async function saveReelDraft(input: updateReelDraftInput) {
  const reelRef = doc(db, "reels", input.reelId)
  const snapshot = await getDoc(reelRef)

  if (!snapshot.exists()) {
    throw new Error("Reel not found.")
  }

  const reel = mapReelDoc(snapshot)

  if (reel.userId !== input.userId) {
    throw new Error("You cannot edit this reel.")
  }

  const nextStatus: ReelStatus = reel.status === "needs_revision" ? "needs_revision" : "draft"

  await updateDoc(reelRef, {
    title: input.title.trim(),
    description: input.description.trim(),
    meal: input.meal,
    visibility: input.visibility,

    status: nextStatus,
    isPublished: false,

    updatedAt: serverTimestamp(),
  })

  return {
    ...reel,
    title: input.title.trim(),
    description: input.description.trim(),
    meal: input.meal,
    visibility: input.visibility,
    status: nextStatus,
  }
}

export async function submitReelForReview(reelId: string, userId: string) {
  const reelRef = doc(db, "reels", reelId)
  const snapshot = await getDoc(reelRef)

  if (!snapshot.exists()) {
    throw new Error("Reel not found.")
  }

  const reel = mapReelDoc(snapshot)

  if (reel.userId !== userId) {
    throw new Error("You cannot submit this reel.")
  }

  if (
    reel.status !== "draft" &&
    reel.status !== "needs_revision"
  ) {
    throw new Error("This reel cannot be submitted for review.")
  }

  await updateDoc(reelRef, {
    status: "pending",
    isPublished: false,

    //To add: a revision reason for types and service

    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function publishReel(reelId: string) {
  const reelRef = doc(db, "reels", reelId)
  const snapshot = await getDoc(reelRef)

  if (!snapshot.exists()) {
    throw new Error("Reel not found.")
  }

  const reel = mapReelDoc(snapshot)

  if (reel.status !== "pending") {
    throw new Error("Only pending reels can be published.")
  }

  await updateDoc(reelRef, {
    status: "published",
    isPublished: true,

    revisionReason: "",

    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function requestReelRevision(reelId: string, reason: string) {
  const normalizedReason = reason.trim()

  if (!normalizedReason) {
    throw new Error("A revision reason is required.")
  }

  const reelRef = doc(db, "reels", reelId)
  const snapshot = await getDoc(reelRef)

  if (!snapshot.exists()) {
    throw new Error("Reel not found.")
  }

  const reel = mapReelDoc(snapshot)

  if (reel.status !== "pending") {
    throw new Error("Only pending reels can be sent back for revision.")
  }

  await updateDoc(reelRef, {
    status: "needs_revision",
    isPublished: false,

    revisionReason: normalizedReason,

    updatedAt: serverTimestamp(),
  })
}