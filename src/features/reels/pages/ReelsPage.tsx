import Navigation from "../../../components/layout/Navigation";
import ReelsFeed from "../components/ReelsFeed";


export default function ReelsPage() {
  return (
     <>
        <Navigation />
        <main className="fixed inset-x-0 bottom-0 top-16 overflow-hidden bg-[#0d0e11]">
            <ReelsFeed />
        </main>
    </>
  )
}
