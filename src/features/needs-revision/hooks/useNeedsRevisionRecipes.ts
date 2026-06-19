import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import { NeedsRevisionRecipe } from "../types/needsRevision.types"
import { fetchNeedsRevisionRecipes } from "../services/needsRevision.service"

export function useNeedsRevisionRecipes() {
  const [recipes, setRecipes] = useState<NeedsRevisionRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isMounted) {
          setRecipes([])
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const result = await fetchNeedsRevisionRecipes(user.uid)

        if (isMounted) {
          setRecipes(result)
        }
      } catch (err) {
        console.error("Failed to fetch needs revision recipes:", err)

        if (isMounted) {
          setError("Failed to load recipes that need revision.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  return {
    recipes,
    isLoading,
    error,
  }
}