import { createContext, useCallback, useContext, useMemo, useState } from "react"
import AppSnackbar, { SnackbarType } from "./AppSnackbar"

interface SnackbarContextValue {
  showSnackbar: (message: string, type?: SnackbarType) => void
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null)

export default function SnackbarProvider({children}: {children: React.ReactNode}) {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState("")
    const [type, setType] = useState<SnackbarType>("success")
    const [snackbarKey, setSnackbarKey] = useState(0)

    const showSnackbar = useCallback(
      (
        nextMessage: string,
        nextType: SnackbarType = "success"
      ) => {
        setSnackbarKey((prev) => prev + 1)
        setMessage(nextMessage)
        setType(nextType)
        setOpen(true)
      },
    [])

    const contextValue = useMemo(() => ({ showSnackbar }), [showSnackbar])

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}

      <AppSnackbar
        key={snackbarKey}
        open={open}
        type={type}
        message={message}
        onClose={() => setOpen(false)}
      />
    </SnackbarContext.Provider>
  )
}

export function useSnackbar() {
    const context = useContext(SnackbarContext)

    if (!context) {
        throw new Error("useSnackbar must be used inside SnackbarProvider")
    }

    return context
}
