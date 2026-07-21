import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from "@firebase/firestore"
import { CreateReelInput, CreateReelResult, Reel, ReelMealType } from "../types/reel.types"
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

    title:
      data.title ||
      data.description ||
      "Recipe inspiration",

    description: data.description || "",
    meal: (data.meal || "dinner") as ReelMealType,

    videoUrl: data.videoUrl || "",
    videoFileName: data.videoFileName || "",

    thumbnail:
      data.thumbnail ||
      data.thumbnailUrl ||
      "",

    duration: Number(
      data.duration ||
      data.durationSeconds ||
      0
    ),

    visibility: data.visibility || "public",

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
  }
}

export async function fetchPublicReels(limitCount = 20): Promise<Reel[]> {
    const reelsQuery = query(
        collection(db, "reels"),
        where("visibility", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    )

    const snapshot = await getDocs(reelsQuery)

    return snapshot.docs
        .map(mapReelDoc)
        .filter((reel) => Boolean(reel.videoUrl))
}

export async function createReel(
  input: CreateReelInput
): Promise<CreateReelResult> {
  validateCreateReelInput(input)

  const reelRef = doc(collection(db, "reels"))
  const reelId = reelRef.id

  const safeFileName =
    sanitizeFileName(input.videoFile.name) || "reel-video.mp4"

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
    isPublished: true,

    likesCount: 0,
    commentsCount: 0,
    savesCount: 0,
    sharesCount: 0,
    viewsCount: 0,

    recipeId: null,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return {
    reelId,
    videoUrl,
  }
}