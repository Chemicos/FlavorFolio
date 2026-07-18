import { useEffect, useState } from "react"
import { useDebounce } from "../../recipe-review/hooks/useDebounce"
import { collection, getDocs, limit, query, where } from "@firebase/firestore"
import { db } from "../../../firebase-config"

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

export function useGlobalSearch(searchValue: string) {
  const debouncedSearch = useDebounce(searchValue, 350)
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const cleanSearch = debouncedSearch.trim().toLowerCase()

    if (cleanSearch.length < 2) {
      setResults([])
      return
    }

    let isMounted = true

    async function loadResults() {
      try {
        setIsLoading(true)

        const [recipesSnap, usersSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, "recipes"),
              where("status", "==", "published"),
              where("searchKeywords", "array-contains", cleanSearch),
              limit(6)
            )
          ),
          getDocs(
            query(
              collection(db, "users"),
              where("searchKeywords", "array-contains", cleanSearch),
              limit(6)
            )
          ),
        ])

        if (!isMounted) return

        const recipeResults: GlobalSearchResult[] = recipesSnap.docs.map((docSnap) => {
          const data = docSnap.data()

          return {
            type: "recipe",
            id: docSnap.id,
            title: data.title || "Untitled recipe",
            subtitle: `${data.cuisine || "Recipe"} · ${data.meal || "Meal"}`,
            image: data.image || "",
          }
        })

        const userResults: GlobalSearchResult[] = usersSnap.docs.map((docSnap) => {
          const data = docSnap.data()

          return {
            type: "user",
            id: docSnap.id,
            title: data.username || "Unknown user",
            subtitle: [data.firstName, data.lastName].filter(Boolean).join(" ") || "FlavorFolio user",
            image: data.profileImage || "",
          }
        })

        setResults([...recipeResults, ...userResults])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadResults()

    return () => {
      isMounted = false
    }
  }, [debouncedSearch])

  return {
    results,
    isLoading,
    debouncedSearch,
  }
}