import { useEffect, useMemo, useState } from "react"
import { useDebounce } from "../../recipe-review/hooks/useDebounce"
import { collection, getDocs, limit, onSnapshot, query, where } from "@firebase/firestore"
import { auth, db } from "../../../firebase-config"
import { onAuthStateChanged } from "firebase/auth"

export type GlobalSearchResult =
    | {
        type: "recipe"
        id: string
        title: string
        subtitle: string
        image: string
    }
    | {
        type: "user"
        id: string
        title: string
        subtitle: string
        image: string
    }

// export function useGlobalSearch(searchValue: string) {
//   const debouncedSearch = useDebounce(searchValue, 350)
//   const [results, setResults] = useState<GlobalSearchResult[]>([])
//   const [isLoading, setIsLoading] = useState(false)

//   useEffect(() => {
//     const cleanSearch = debouncedSearch.trim().toLowerCase()

//     if (cleanSearch.length < 2) {
//       setResults([])
//       return
//     }

//     let isMounted = true

//     async function loadResults() {
//       try {
//         setIsLoading(true)

//         const [recipesSnap, usersSnap] = await Promise.all([
//           getDocs(
//             query(
//               collection(db, "recipes"),
//               where("status", "==", "published"),
//               where("searchKeywords", "array-contains", cleanSearch),
//               limit(6)
//             )
//           ),
//           getDocs(
//             query(
//               collection(db, "users"),
//               where("searchKeywords", "array-contains", cleanSearch),
//               limit(6)
//             )
//           ),
//         ])

//         if (!isMounted) return

//         const recipeResults: GlobalSearchResult[] = recipesSnap.docs.map((docSnap) => {
//           const data = docSnap.data()

//           return {
//             type: "recipe",
//             id: docSnap.id,
//             title: data.title || "Untitled recipe",
//             subtitle: `${data.cuisine || "Recipe"} · ${data.meal || "Meal"}`,
//             image: data.image || "",
//           }
//         })

//         const userResults: GlobalSearchResult[] = usersSnap.docs.map((docSnap) => {
//           const data = docSnap.data()

//           return {
//             type: "user",
//             id: docSnap.id,
//             title: data.username || "Unknown user",
//             subtitle: [data.firstName, data.lastName].filter(Boolean).join(" ") || "FlavorFolio user",
//             image: data.profileImage || "",
//           }
//         })

//         setResults([...recipeResults, ...userResults])
//       } finally {
//         if (isMounted) setIsLoading(false)
//       }
//     }

//     loadResults()

//     return () => {
//       isMounted = false
//     }
//   }, [debouncedSearch])

//   return {
//     results,
//     isLoading,
//     debouncedSearch,
//   }
// }

const MAX_VISIBLE_RECIPE_RESULTS = 20
const MAX_USER_RESULTS = 20
const RECIPE_SEARCH_CANDIDATES_LIMIT = 24

function getRelationshipUserId(
  docId: string,
  data: Record<string, unknown>
) {
  const storedUserId =
    typeof data.userId === "string"
      ? data.userId.trim()
      : ""

  return storedUserId || docId
}

function getRecipeAuthorId(
  data: Record<string, any>
) {
  return String(
    data.userId ||
      data.author?.userId ||
      data.author?.uid ||
      ""
  ).trim()
}

export function useGlobalSearch(
  searchValue: string
) {
  const debouncedSearch = useDebounce(
    searchValue,
    350
  )

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null)

  const [isAuthReady, setIsAuthReady] =
    useState(false)

  const [blockedUserIds, setBlockedUserIds] =
    useState<string[]>([])

  const [blockedByUserIds, setBlockedByUserIds] =
    useState<string[]>([])

  const [
    isBlockContextReady,
    setIsBlockContextReady,
  ] = useState(false)

  const [results, setResults] = useState<
    GlobalSearchResult[]
  >([])

  const [isLoading, setIsLoading] =
    useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid || null)
      setIsAuthReady(true)
    })
  }, [])

  useEffect(() => {
    if (!isAuthReady) return

    if (!currentUserId) {
      setBlockedUserIds([])
      setBlockedByUserIds([])
      setIsBlockContextReady(true)
      return
    }

    setIsBlockContextReady(false)

    let blockedUsersLoaded = false
    let blockedByLoaded = false

    const markPrivacyContextAsReady = () => {
      if (
        blockedUsersLoaded &&
        blockedByLoaded
      ) {
        setIsBlockContextReady(true)
      }
    }

    const blockedUsersRef = collection(
      db,
      "users",
      currentUserId,
      "blockedUsers"
    )

    const blockedByRef = collection(
      db,
      "users",
      currentUserId,
      "blockedBy"
    )

    const unsubscribeBlockedUsers =
      onSnapshot(
        blockedUsersRef,
        (snapshot) => {
          const nextBlockedUserIds =
            snapshot.docs
              .map((docSnap) =>
                getRelationshipUserId(
                  docSnap.id,
                  docSnap.data()
                )
              )
              .filter(Boolean)

          setBlockedUserIds([
            ...new Set(nextBlockedUserIds),
          ])

          blockedUsersLoaded = true
          markPrivacyContextAsReady()
        },
        (error) => {
          console.error(
            "Failed to load blocked users:",
            error
          )

          setBlockedUserIds([])
          blockedUsersLoaded = true
          markPrivacyContextAsReady()
        }
      )

    const unsubscribeBlockedBy =
      onSnapshot(
        blockedByRef,
        (snapshot) => {
          const nextBlockedByUserIds =
            snapshot.docs
              .map((docSnap) =>
                getRelationshipUserId(
                  docSnap.id,
                  docSnap.data()
                )
              )
              .filter(Boolean)

          setBlockedByUserIds([
            ...new Set(nextBlockedByUserIds),
          ])

          blockedByLoaded = true
          markPrivacyContextAsReady()
        },
        (error) => {
          console.error(
            "Failed to load users who blocked the current user:",
            error
          )

          setBlockedByUserIds([])
          blockedByLoaded = true
          markPrivacyContextAsReady()
        }
      )

    return () => {
      unsubscribeBlockedUsers()
      unsubscribeBlockedBy()
    }
  }, [currentUserId, isAuthReady])

  const hiddenRecipeAuthorIds =
    useMemo(() => {
      return new Set([
        ...blockedUserIds,
        ...blockedByUserIds,
      ])
    }, [
      blockedUserIds,
      blockedByUserIds,
    ])

  useEffect(() => {
    const cleanSearch = debouncedSearch
      .trim()
      .toLowerCase()

    if (cleanSearch.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    if (
      !isAuthReady ||
      !isBlockContextReady
    ) {
      setResults([])
      setIsLoading(true)
      return
    }

    let isMounted = true

    async function loadResults() {
      try {
        setIsLoading(true)

        const [recipesSnap, usersSnap] =
          await Promise.all([
            getDocs(
              query(
                collection(db, "recipes"),
                where(
                  "status",
                  "==",
                  "published"
                ),
                where(
                  "searchKeywords",
                  "array-contains",
                  cleanSearch
                ),
                limit(
                  RECIPE_SEARCH_CANDIDATES_LIMIT
                )
              )
            ),

            getDocs(
              query(
                collection(db, "users"),
                where(
                  "searchKeywords",
                  "array-contains",
                  cleanSearch
                ),
                limit(MAX_USER_RESULTS)
              )
            ),
          ])

        if (!isMounted) return

        const recipeResults =
          recipesSnap.docs
            .filter((docSnap) => {
              const data = docSnap.data()
              const authorId =
                getRecipeAuthorId(data)

              if (!authorId) {
                return false
              }

              return !hiddenRecipeAuthorIds.has(
                authorId
              )
            })
            .slice(
              0,
              MAX_VISIBLE_RECIPE_RESULTS
            )
            .map<GlobalSearchResult>(
              (docSnap) => {
                const data = docSnap.data()

                return {
                  type: "recipe",
                  id: docSnap.id,
                  title:
                    data.title ||
                    "Untitled recipe",
                  subtitle: `${
                    data.cuisine || "Recipe"
                  } · ${
                    data.meal || "Meal"
                  }`,
                  image: data.image || "",
                }
              }
            )

        const userResults =
          usersSnap.docs.map<GlobalSearchResult>(
            (docSnap) => {
              const data = docSnap.data()

              return {
                type: "user",
                id: docSnap.id,
                title:
                  data.username ||
                  "Unknown user",
                subtitle:
                  [
                    data.firstName,
                    data.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ") ||
                  "FlavorFolio user",
                image:
                  data.profileImage || "",
              }
            }
          )

        setResults([
          ...recipeResults,
          ...userResults,
        ])
      } catch (error) {
        console.error(
          "Failed to perform global search:",
          error
        )

        if (isMounted) {
          setResults([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadResults()

    return () => {
      isMounted = false
    }
  }, [
    debouncedSearch,
    hiddenRecipeAuthorIds,
    isAuthReady,
    isBlockContextReady,
  ])

  return {
    results,
    isLoading,
    debouncedSearch,
  }
}