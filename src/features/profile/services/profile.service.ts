import { collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from "@firebase/firestore"
import { db, storage } from "../../../firebase-config"
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { buildRecipeKeywords, buildUserKeywords } from "../../../utils/searchKeywords"
import { ProfileVisibility } from "../../account-settings/services/privacy.service"

export interface MyProfileData {
  uid: string
  username: string
  firstName: string
  lastName: string
  bio: string
  profileImage: string
  bannerImage: string
  location: string
  website: string

  privacy: {
    profileVisibility: ProfileVisibility
    showInSearch: boolean
  }

  createdAt?: {
    seconds: number
    nanoseconds: number
  }
  stats: {
    recipesCount: number
    followersCount: number
    followingCount: number
    savedRecipesCount: number
  }
}

export interface UpdateMyProfilePayload {
  firstName: string
  lastName: string
  username: string
  bio: string
  location: string
  website: string
}

export async function updateMyProfile({
  userId,
  payload,
}: {
  userId: string
  payload: UpdateMyProfilePayload
}) {
  if (!userId) throw new Error("User id is required.")

  const userRef = doc(db, "users", userId)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    throw new Error("User profile not found.")
  }

  const userData = userSnap.data()
  const nextUsername = payload.username.trim()

  await updateDoc(userRef, {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    username: nextUsername,
    bio: payload.bio.trim(),
    userDescription: payload.bio.trim(),
    location: payload.location.trim(),
    website: payload.website.trim(),
    searchKeywords: buildUserKeywords({
      ...userData,
      firstName: payload.firstName,
      lastName: payload.lastName,
      username: payload.username,
      bio: payload.bio,
      userDescription: payload.bio,
      location: payload.location,
      website: payload.website,
      email: userData.email || "",
    }),
    updatedAt: serverTimestamp(),
  })

  await propagateUserProfileIdentity({
    userId,
    username: nextUsername,
    profileImage: userData.profileImage || "",
  })
}

async function propagateUserProfileIdentity({
  userId,
  username,
  profileImage,
}: {
  userId: string
  username: string
  profileImage?: string
}) {
  const recipesQuery = query(
    collection(db, "recipes"),
    where("userId", "==", userId)
  )

  const recipesSnapshot = await getDocs(recipesQuery)

  for (const recipeDoc of recipesSnapshot.docs) {
    const batch = writeBatch(db)
    const recipeData = recipeDoc.data()

    // batch.update(recipeDoc.ref, {
    //   user: username,
    //   "author.username": username,
    //   ...(profileImage ? { "author.profileImage": profileImage } : {}),
    //   searchKeywords: buildRecipeKeywords({
    //     ...recipeData,
    //     authorUsername: username,
    //   }),
    //   updatedAt: serverTimestamp(),
    // })

    batch.update(recipeDoc.ref, {
      user: username,
      "author.username": username,

      ...(profileImage
        ? {
            "author.profileImage": profileImage,
          }
        : {}),

      searchKeywords: buildRecipeKeywords({
        ...recipeData,
        authorUsername: username,
      }),

      authorIdentityUpdatedAt: serverTimestamp(),
    })

    const commentsRef = collection(db, "recipes", recipeDoc.id, "comments")
    const commentsQuery = query(commentsRef, where("userId", "==", userId))
    const commentsSnapshot = await getDocs(commentsQuery)

    commentsSnapshot.docs.forEach((commentDoc) => {
      // batch.update(commentDoc.ref, {
      //   username,
      //   ...(profileImage ? { profileImage } : {}),
      //   updatedAt: serverTimestamp(),
      // })

      batch.update(commentDoc.ref, {
        username,

        ...(profileImage
          ? {
              profileImage,
            }
          : {}),

        authorIdentityUpdatedAt: serverTimestamp(),
      })
    })

    await batch.commit()
  }
}

export async function updateProfileAvatarImage({
  userId,
  file,
}: {
  userId: string
  file: File
}) {
  if (!userId) throw new Error("User id is required.")
  if (!file) throw new Error("Profile image is required.")

  const userRef = doc(db, "users", userId)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    throw new Error("User profile not found.")
  }

  const userData = userSnap.data()
  const username = userData.username || ""

  const profileImageRef = ref(storage, `user_images/${userId}`)

  await uploadBytes(profileImageRef, file)

  const profileImage = await getDownloadURL(profileImageRef)

  await updateDoc(userRef, {
    profileImage,
    profileImageFileName: userId,
    updatedAt: serverTimestamp(),
  })

  await propagateUserProfileIdentity({
    userId,
    username,
    profileImage,
  })

  return {
    profileImage,
    profileImageFileName: userId,
  }
}

export function subscribeToMyProfile(
  userId: string,
  onChange: (profile: MyProfileData) => void,
  onError: (error: Error) => void
) {
  const userRef = doc(db, "users", userId)

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onError(new Error("User profile not found."))
        return
      }

      const data = snapshot.data()

      onChange({
        uid: snapshot.id,
        username: data.username || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        bio: data.bio || data.userDescription || "",
        profileImage: data.profileImage || "",
        bannerImage: data.bannerImage || "",
        location: data.location || "",
        website: data.website || "",
        createdAt: data.createdAt || undefined,

        privacy: {
          profileVisibility: data.privacy?.profileVisibility || "public",
          showInSearch: data.privacy?.showInSearch ?? true,
        },

        stats: {
          recipesCount: Number(data.stats?.recipesCount || 0),
          followersCount: Number(data.stats?.followersCount || 0),
          followingCount: Number(data.stats?.followingCount || 0),
          savedRecipesCount: Number(data.stats?.savedRecipesCount || 0),
        },
      })
    },
    onError
  )
}

async function deleteStorageFile(path: string) {
  try {
    await deleteObject(ref(storage, path))
  } catch (error: any) {
    if (error?.code === "storage/object-not-found") return
    console.error(`Failed to delete storage file: ${path}`, error)
  }
}

export async function updateProfileBannerImage({
  userId,
  file,
}: {
  userId: string
  file: File
}) {
  if (!userId) throw new Error("User id is required.")
  if (!file) throw new Error("Banner image is required.")

  const userRef = doc(db, "users", userId)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    throw new Error("User profile not found.")
  }

  const userData = userSnap.data()
  const previousBannerFileName = userData.bannerImageFileName || ""

  const bannerImageFileName = `${Date.now()}_${file.name}`
  const bannerRef = ref(storage, `user_banner_images/${userId}/${bannerImageFileName}`)

  await uploadBytes(bannerRef, file)

  const bannerImage = await getDownloadURL(bannerRef)

  await updateDoc(userRef, {
    bannerImage,
    bannerImageFileName,
    updatedAt: serverTimestamp(),
  })

  if (previousBannerFileName) {
    await deleteStorageFile(`user_banner_images/${userId}/${previousBannerFileName}`)
  }

  return {
    bannerImage,
    bannerImageFileName,
  }
}

export async function fetchMyProfile(userId: string): Promise<MyProfileData> {
  if (!userId) {
    throw new Error("User id is required.")
  }

  const userRef = doc(db, "users", userId)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    throw new Error("User profile not found.")
  }

  const data = userSnap.data()

  return {
    uid: userSnap.id,
    username: data.username || "",
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    bio: data.bio || data.userDescription || "",
    profileImage: data.profileImage || "",
    bannerImage: data.bannerImage || "",
    location: data.location || "",
    website: data.website || "",
    createdAt: data.createdAt || undefined,

    privacy: {
      profileVisibility: data.privacy?.profileVisibility || "public",
      showInSearch: data.privacy?.showInSearch ?? true,
    },

    stats: {
      recipesCount: Number(data.stats?.recipesCount || 0),
      followersCount: Number(data.stats?.followersCount || 0),
      followingCount: Number(data.stats?.followingCount || 0),
      savedRecipesCount: Number(data.stats?.savedRecipesCount || 0),
    },
  }
}