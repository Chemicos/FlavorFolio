import { useEffect, useRef, useState } from "react"

export function useImageLoaded(src?: string) {
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)

    if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
      setLoaded(true)
    }
  }, [src])

  return {
    imageRef,
    loaded,
    onLoad: () => setLoaded(true),
    onError: () => setLoaded(true),
  }
}