import { useState } from "react"
import AccountSettingsSidebar from "./AccountSettingsSidebar"
import SecuritySettingsSection from "./SecuritySettingsSection"
import BlockedAccountsSection from "./BlockedAccountsSection"
import PrivacySettingsSection from "./PrivacySettingsSection"
import PreferencesSettingsSection from "./PreferencesSettingsSection"

export type AccountSettingsTab = "security" | "blocked" | "privacy" | "preferences"

export default function AccountSettingsLayout() {
  const [activeTab, setActiveTab] = useState<AccountSettingsTab>("security")

  return (
    <section className="grid min-h-[calc(100vh-8rem)] w-full grid-cols-[320px_minmax(0,1fr)] gap-8">
      <AccountSettingsSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8 shadow-[var(--shadow-panel)] transition-colors duration-200">
        {activeTab === "security" && <SecuritySettingsSection />}
        {activeTab === "blocked" && <BlockedAccountsSection />}
        {activeTab === "privacy" && <PrivacySettingsSection />}
        {activeTab === "preferences" && <PreferencesSettingsSection />}
      </div>
    </section>
  )
}
