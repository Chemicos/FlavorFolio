import { Outlet } from "react-router-dom";
import Navigation from "./components/layout/Navigation";
import FloatingMessagesButton from "./features/messages/components/FloatingMessagesButton";
import { AppLayoutProvider, useAppLayout } from "./components/layout/AppLayoutContext";
import { UserCapabilitiesProvider } from "./components/permissions/UserCapabilitiesContext";

function AppLayoutContent() {
    const {floatingMessagesRightOffset} = useAppLayout()
  return (
    <>
        <Navigation />

        <Outlet />

        <FloatingMessagesButton rightOffset={floatingMessagesRightOffset} />
    </>
  )
}

export default function AppLayout() {
    return (
        <AppLayoutProvider>
            <UserCapabilitiesProvider>
                <AppLayoutContent />
            </UserCapabilitiesProvider>
        </AppLayoutProvider>
    )
}
