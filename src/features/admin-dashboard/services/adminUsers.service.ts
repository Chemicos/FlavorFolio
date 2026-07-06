import { collection, collectionGroup, doc, getCountFromServer, getDocs, limit, orderBy, query, where, writeBatch } from "@firebase/firestore"
import { AdminUserRole, AdminUserRow } from "../types/adminUsers.types"
import { db, storage } from "../../../firebase-config"
import { deleteObject, ref } from "firebase/storage"

function getDateMs(value: any) {
  if (!value) return 0
  if (typeof value?.toDate === "function") return value.toDate().getTime()
  if (typeof value?.seconds === "number") return value.seconds * 1000
  return 0
}

function normalizeRole(value: unknown): AdminUserRole {
  return value === "admin" ? "admin" : "member"
}

async function getUserRecipesCount(userId: string) {
  const recipesQuery = query(
    collection(db, "recipes"),
    where("userId", "==", userId)
  )

  const snapshot = await getCountFromServer(recipesQuery)
  return snapshot.data().count
}

async function getUserSavedRecipesCount(userId: string) {
  const savedRecipesRef = collection(db, "users", userId, "savedRecipes")
  const snapshot = await getCountFromServer(savedRecipesRef)

  return snapshot.data().count
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const usersQuery = query(
    collection(db, "users"),
    orderBy("createdAt", "desc"),
    limit(120)
  )

  const snapshot = await getDocs(usersQuery)

  return Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data()
      const stats = data.stats || {}

      const [recipesCount, savedRecipesCount] = await Promise.all([
        getUserRecipesCount(docSnap.id),
        getUserSavedRecipesCount(docSnap.id),
      ])

      return {
        uid: docSnap.id,
        username: data.username || "Unknown",
        email: data.email || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        role: normalizeRole(data.role),
        profileImage: data.profileImage || "",
        bannerImage: data.bannerImage || "",
        bio: data.bio || data.userDescription || "",
        location: data.location || "",
        website: data.website || "",
        recipesCount,
        followersCount: Math.max(0, Number(stats.followersCount || 0)),
        followingCount: Math.max(0, Number(stats.followingCount || 0)),
        savedRecipesCount,
        createdAtMs: getDateMs(data.createdAt),
      }
    })
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

async function deleteDocsInChunks(refs: ReturnType<typeof doc>[]) {
  const chunkSize = 450

  for (let index = 0; index < refs.length; index += chunkSize) {
    const batch = writeBatch(db)
    refs.slice(index, index + chunkSize).forEach((ref) => batch.delete(ref))
    await batch.commit()
  }
}

async function getQueryRefs(q: ReturnType<typeof query>) {
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => docSnap.ref)
}

export async function deleteAdminUsers(userIds: string[]) {
  const allRefs: ReturnType<typeof doc>[] = []
  const storageDeleteTasks: Promise<void>[] = []

  for (const userId of userIds) {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", userId)))

    const userData = userSnap.docs[0]?.data()

    if (userData?.profileImageFileName) {
      storageDeleteTasks.push(deleteStorageFile(`user_images/${userData.profileImageFileName}`))
    }

    if (userData?.bannerImageFileName) {
      storageDeleteTasks.push(deleteStorageFile(`user_banner_images/${userId}/${userData.bannerImageFileName}`))
    }

    const [
      recipesRefs,
      savedRecipesRefs,
      followersRefs,
      followingRefs,
      notificationsRefs,
      blockedUsersRefs,
      commentReactionsRefs,
      commentsRefs,
      repliesRefs,
    ] = await Promise.all([
      getQueryRefs(query(collection(db, "recipes"), where("userId", "==", userId))),
      getQueryRefs(query(collection(db, "users", userId, "savedRecipes"))),
      getQueryRefs(query(collection(db, "users", userId, "followers"))),
      getQueryRefs(query(collection(db, "users", userId, "following"))),
      getQueryRefs(query(collection(db, "users", userId, "notifications"))),
      getQueryRefs(query(collection(db, "users", userId, "blockedUsers"))),
      getQueryRefs(query(collection(db, "commentReactions"), where("userId", "==", userId))),
      getQueryRefs(query(collectionGroup(db, "comments"), where("userId", "==", userId))),
      getQueryRefs(query(collectionGroup(db, "replies"), where("userId", "==", userId))),
    ])

    allRefs.push(
      ...recipesRefs,
      ...savedRecipesRefs,
      ...followersRefs,
      ...followingRefs,
      ...notificationsRefs,
      ...blockedUsersRefs,
      ...commentReactionsRefs,
      ...commentsRefs,
      ...repliesRefs,
      userRef
    )
  }

  await Promise.all(storageDeleteTasks)
  await deleteDocsInChunks(allRefs)
}