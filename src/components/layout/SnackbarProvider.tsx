import { createContext, useCallback, useContext, useMemo, useState } from "react"
import AppSnackbar, { SnackbarType } from "./AppSnackbar"

interface SnackbarAction {
  label: string
  onClick: () => void
}

interface SnackbarContextValue {
  showSnackbar: (
    message: string,
    type?: SnackbarType,
    action?: SnackbarAction
  ) => void
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null)

export default function SnackbarProvider({children}: {children: React.ReactNode}) {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState("")
    const [type, setType] = useState<SnackbarType>("success")
    const [action, setAction] = useState<SnackbarAction | undefined>(undefined) 
    const [snackbarKey, setSnackbarKey] = useState(0)

    const showSnackbar = useCallback(
      (
        nextMessage: string,
        nextType: SnackbarType = "success",
        nextAction?: SnackbarAction
      ) => {
        setSnackbarKey((prev) => prev + 1)
        setMessage(nextMessage)
        setType(nextType)
        setAction(nextAction)
        setOpen(true)
      },
    [])

    const contextValue = useMemo(() => ({ showSnackbar }), [showSnackbar])

    const handleClose = () => {
      setOpen(false)
      setAction(undefined)
    }

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}

      <AppSnackbar
        key={snackbarKey}
        open={open}
        type={type}
        message={message}
        action={action}
        onClose={handleClose}
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
