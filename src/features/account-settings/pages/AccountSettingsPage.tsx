import Navigation from "../../../components/layout/Navigation";
import AccountSettingsLayout from "../components/AccountSettingsLayout";


export default function AccountSettingsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0d0e11] text-white">
      <Navigation variant="solid" />

      <main className="mx-auto w-full max-w-[1240px] px-6 pt-28 xl:px-10">
        <AccountSettingsLayout />
      </main>
    </div>
  )
}
