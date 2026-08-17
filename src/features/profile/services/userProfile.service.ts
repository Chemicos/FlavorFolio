import { collection, doc, getCountFromServer, getDoc, getDocs, limit, onSnapshot, orderBy, query, where } from "@firebase/firestore"
import { ProfileRecipeGridItem } from "../components/ProfileRecipeGrid"
import { MyProfileData, normalizeUserRestrictions } from "./profile.service"
import { ProfileRecipeDocument } from "./profileRecipes.service"
import { db } from "../../../firebase-config"
import { ProfileVisibility } from "../../account-settings/services/privacy.service"

function getDateMs(value: any) {
  if (!value) return 0
  if (typeof value?.toDate === "function") return value.toDate().getTime()
  if (typeof value?.seconds === "number") return value.seconds * 1000
  return 0
}

function normalizeProfileVisibility(
  value: unknown
): ProfileVisibility {
  if (
    value === "public" ||
    value === "followers"
  ) {
    return value
  }

  return "public"
}

function mapUserProfileData(
  userId: string,
  data: Record<string, any>
): MyProfileData {
  return {
    uid: userId,
    username: data.username || "",
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    bio: data.bio || data.userDescription || "",
    profileImage: data.profileImage || "",
    bannerImage: data.bannerImage || "",
    location: data.location || "",
    website: data.website || "",

    privacy: {
      profileVisibility: normalizeProfileVisibility(
        data.privacy?.profileVisibility
      ),
      showInSearch:
        typeof data.privacy?.showInSearch === "boolean"
          ? data.privacy.showInSearch
          : true,
    },

    createdAt: data.createdAt || undefined,

    stats: {
      recipesCount: Number(
        data.stats?.recipesCount || 0
      ),
      followersCount: Number(
        data.stats?.followersCount || 0
      ),
      followingCount: Number(
        data.stats?.followingCount || 0
      ),
      savedRecipesCount: Number(
        data.stats?.savedRecipesCount || 0
      ),
    },

    restrictions: normalizeUserRestrictions(
      data.restrictions
    )
  }
}

function mapPublicProfileRecipe(
  docId: string,
  data: ProfileRecipeDocument
): ProfileRecipeGridItem {
  return {
    id: data.recipeId || docId,
    userId: data.userId || "",
    title: data.title || "Untitled recipe",
    image: data.image || "",
    meal: data.meal || "Meal",
    difficulty: data.difficulty || "Easy",
    durationMinutes: Number(data.durationMinutes || 0),
    category: data.meal || data.cuisine || "all",
    status: "published",
    rating: Number(data.stats?.averageRating || 0),
    commentsCount: Number(data.stats?.commentsCount || 0),
    savesCount: Number(data.stats?.savesCount || 0),
    createdAt: String(getDateMs(data.createdAt || data.updatedAt)),
  }
}

export async function fetchUserPublishedRecipesCount(
  userId: string
): Promise<number> {
  if (!userId) {
    throw new Error("User id is required.")
  }

  const recipesCountQuery = query(
    collection(db, "recipes"),
    where("userId", "==", userId),
    where("status", "==", "published"),
    where("visibility", "==", "public")
  )

  const snapshot = await getCountFromServer(recipesCountQuery)

  return snapshot.data().count
}

// export async function fetchUserProfile(userId: string): Promise<MyProfileData> {
//   const userSnap = await getDoc(doc(db, "users", userId))

//   if (!userSnap.exists()) {
//     throw new Error("User profile not found.")
//   }

//   const data = userSnap.data()

//   return {
//     uid: userSnap.id,
//     username: data.username || "",
//     firstName: data.firstName || "",
//     lastName: data.lastName || "",
//     bio: data.bio || data.userDescription || "",
//     profileImage: data.profileImage || "",
//     bannerImage: data.bannerImage || "",
//     location: data.location || "",
//     website: data.website || "",
//     createdAt: data.createdAt || undefined,
//     stats: {
//       recipesCount: Number(data.stats?.recipesCount || 0),
//       followersCount: Number(data.stats?.followersCount || 0),
//       followingCount: Number(data.stats?.followingCount || 0),
//       savedRecipesCount: Number(data.stats?.savedRecipesCount || 0),
//     },
//   }
// }

export async function fetchUserProfile(
  userId: string
): Promise<MyProfileData> {
  if (!userId) {
    throw new Error("User id is required.")
  }

  const userSnap = await getDoc(doc(db, "users", userId))

  if (!userSnap.exists()) {
    throw new Error("User profile not found.")
  }

  return mapUserProfileData(
    userSnap.id,
    userSnap.data()
  )
}

export async function fetchUserPublicRecipes(
  userId: string
): Promise<ProfileRecipeGridItem[]> {
  const recipesQuery = query(
    collection(db, "recipes"),
    where("userId", "==", userId),
    where("status", "==", "published"),
    where("visibility", "==", "public"),
    orderBy("updatedAt", "desc"),
    limit(80)
  )

  const snapshot = await getDocs(recipesQuery)

  return snapshot.docs.map((docSnap) =>
    mapPublicProfileRecipe(
      docSnap.id,
      docSnap.data() as ProfileRecipeDocument
    )
  )
}

// export function subscribeToUserProfile(
//   userId: string,
//   onChange: (profile: MyProfileData) => void,
//   onError: (error: Error) => void
// ) {
//   const userRef = doc(db, "users", userId)

//   return onSnapshot(
//     userRef,
//     (snapshot) => {
//       if (!snapshot.exists()) {
//         onError(new Error("User profile not found."))
//         return
//       }

//       const data = snapshot.data()

//       onChange({
//         uid: snapshot.id,
//         username: data.username || "",
//         firstName: data.firstName || "",
//         lastName: data.lastName || "",
//         bio: data.bio || data.userDescription || "",
//         profileImage: data.profileImage || "",
//         bannerImage: data.bannerImage || "",
//         location: data.location || "",
//         website: data.website || "",
//         createdAt: data.createdAt || undefined,
//         stats: {
//           recipesCount: Number(data.stats?.recipesCount || 0),
//           followersCount: Number(data.stats?.followersCount || 0),
//           followingCount: Number(data.stats?.followingCount || 0),
//           savedRecipesCount: Number(data.stats?.savedRecipesCount || 0),
//         },
//       })
//     },
//     onError
//   )
// }


export function subscribeToUserProfile(
  userId: string,
  onChange: (profile: MyProfileData) => void,
  onError: (error: Error) => void
) {
  const userRef = doc(db, "users", userId)

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onError(
          new Error(
            "User profile not found."
          )
        )

        return
      }

      onChange(
        mapUserProfileData(
          snapshot.id,
          snapshot.data()
        )
      )
    },
    onError
  )
}