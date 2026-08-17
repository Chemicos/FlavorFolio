import { useEffect, useRef, useState } from "react"
import { Reel } from "../types/reel.types"

interface ReelVideoProps {
  reel: Reel
}


export default function ReelVideo({reel}: ReelVideoProps) {

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting && entry.intersectionRatio >= 0.65)
      },
      {
        threshold: [0, 0.35, 0.65, 1],
      }
    )

    observer.observe(video)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isActive) {
      video.play().catch(() => null)
    } else {
      video.pause()
    }
  }, [isActive])
  
  return (
    <video
      ref={videoRef}
      src={reel.videoUrl}
      poster={reel.thumbnail || undefined}
      muted
      loop
      playsInline
      preload="metadata"
      className="h-full w-full object-cover"
    />
  )
}
