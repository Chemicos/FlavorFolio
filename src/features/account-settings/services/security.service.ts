import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from "@firebase/firestore"
import { deleteUser, EmailAuthProvider, getAuth, reauthenticateWithCredential, updatePassword } from "firebase/auth"
import { db, storage } from "../../../firebase-config"
import { deleteObject, ref } from "firebase/storage"

export async function updateCurrentUserPassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string
  newPassword: string
}) {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user?.email) {
    throw new Error("No authenticated email user found.")
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword)

  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}

async function deleteDocsByQuery(collectionName: string, field: string, value: string) {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where(field, "==", value))
  )

  const chunks = []
  for (let i = 0; i < snapshot.docs.length; i += 450) {
    chunks.push(snapshot.docs.slice(i, i + 450))
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db)

    chunk.forEach((docSnap) => {
      batch.delete(docSnap.ref)
    })

    await batch.commit()
  }
}

async function deleteUserSubcollection(userId: string, subcollection: string) {
  const snapshot = await getDocs(collection(db, "users", userId, subcollection))

  const batch = writeBatch(db)

  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref)
  })

  await batch.commit()
}

async function deleteStorageFile(path: string) {
  try {
    await deleteObject(ref(storage, path))
  } catch (error: any) {
    if (error?.code === "storage/object-not-found") return
    console.error(`Failed to delete storage file: ${path}`, error)
  }
}

export async function deleteCurrentUserAccount(currentPassword?: string) {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) throw new Error("No authenticated user found.")

  const userId = user.uid

  if (user.email && currentPassword) {
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
  }

  await deleteDocsByQuery("recipes", "userId", userId)
  await deleteDocsByQuery("notifications", "userId", userId)

  await deleteUserSubcollection(userId, "savedRecipes")
  await deleteUserSubcollection(userId, "followers")
  await deleteUserSubcollection(userId, "following")
  await deleteUserSubcollection(userId, "blockedUsers")
  await deleteUserSubcollection(userId, "notifications")

  await deleteStorageFile(`user_images/${userId}`)

  const userRef = doc(db, "users", userId)
  await deleteDoc(userRef)

  await deleteUser(user)
}
