import { RefObject, useEffect, useRef } from "react"

interface UseDismissibleLayerOptions {
  isOpen: boolean
  refs: RefObject<HTMLElement | null>[]
  onDismiss: () => void
  closeOnEscape?: boolean
  closeOnOutsidePointer?: boolean
  closeOnScroll?: boolean
  closeOnResize?: boolean
}

export function useDismissibleLayer({
  isOpen,
  refs,
  onDismiss,
  closeOnEscape = true,
  closeOnOutsidePointer = true,
  closeOnScroll = true,
  closeOnResize = true,
}: UseDismissibleLayerOptions) {
  const onDismissRef = useRef(onDismiss)
  const refsRef = useRef(refs)

  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    refsRef.current = refs
  }, [refs])

  useEffect(() => {
    if (!isOpen) return

    const dismiss = () => {
      onDismissRef.current()
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return

      const isInsideLayer = refsRef.current.some((ref) => ref.current?.contains(target))

      if (!isInsideLayer) {
        dismiss()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss()
      }
    }

    if (closeOnOutsidePointer) {
      document.addEventListener("pointerdown", handlePointerDown)
    }

    if (closeOnEscape) {
      document.addEventListener("keydown", handleKeyDown)
    }

    if (closeOnScroll) {
      window.addEventListener("scroll", dismiss, {
        capture: true,
        passive: true,
      })
    }

    if (closeOnResize) {
      window.addEventListener("resize", dismiss)
    }

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("scroll", dismiss, true)
      window.removeEventListener("resize", dismiss)
    }
  }, [
    isOpen,
    closeOnEscape,
    closeOnOutsidePointer,
    closeOnScroll,
    closeOnResize,
  ])
}