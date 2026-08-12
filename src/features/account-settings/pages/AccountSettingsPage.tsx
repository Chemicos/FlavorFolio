import AccountSettingsLayout from "../components/AccountSettingsLayout";

export default function AccountSettingsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">

      <main className="mx-auto w-full max-w-[1240px] px-6 pt-20 xl:px-10">
        <AccountSettingsLayout />
      </main>
    </div>
  )
}
