import { createContext, useContext, useState } from "react"

interface AppLayoutContextValue {
  floatingMessagesRightOffset: number
  setFloatingMessagesRightOffset: (value: number) => void
}

const AppLayoutContext = createContext<AppLayoutContextValue | null>(null)

export function AppLayoutProvider({
   children 
}: {children: React.ReactNode}) {
    const [floatingMessagesRightOffset, setFloatingMessagesRightOffset] = useState(24)

    return (
        <AppLayoutContext.Provider
            value={{
                floatingMessagesRightOffset, 
                setFloatingMessagesRightOffset,
            }}
        >
            {children}
        </AppLayoutContext.Provider>
    )
}

export function useAppLayout() {
    const context = useContext(AppLayoutContext)

    if (!context) {
        throw new Error("useAppLayout must be used inside AppLayoutProvider")
    }

    return context
}


