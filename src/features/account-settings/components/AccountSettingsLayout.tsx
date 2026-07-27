import { useState } from "react"
import AccountSettingsSidebar from "./AccountSettingsSidebar"
import SecuritySettingsSection from "./SecuritySettingsSection"
import BlockedAccountsSection from "./BlockedAccountsSection"
import PrivacySettingsSection from "./PrivacySettingsSection"

export type AccountSettingsTab = "security" | "blocked" | "privacy"

export default function AccountSettingsLayout() {
  const [activeTab, setActiveTab] = useState<AccountSettingsTab>("security")

  return (
    <section className="grid min-h-[calc(100vh-8rem)] w-full grid-cols-[320px_minmax(0,1fr)] gap-8">
      <AccountSettingsSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="min-w-0 rounded-2xl border border-white/10 bg-[#16181d]/80 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        {activeTab === "security" && <SecuritySettingsSection />}
        {activeTab === "blocked" && <BlockedAccountsSection />}
        {activeTab === "privacy" && <PrivacySettingsSection />}
      </div>
    </section>
  )
}
