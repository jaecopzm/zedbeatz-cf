import Sidebar from "@/components/sidebar";
import Player from "@/components/player/player";
import BottomNav from "@/components/bottom-nav";
import ToastContainer from "@/components/toast";
import MobileMenu from "@/components/mobile-menu";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scroll-to-top";
import ScrollRestoration from "@/components/scroll-restoration";
import { LikesProvider } from "@/lib/likes-context";
import Link from "next/link";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LikesProvider>
      <div className="flex h-screen flex-col bg-[var(--background)] relative">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center px-4 border-b border-[var(--border)] bg-[var(--glass)] backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)] supports-[backdrop-filter]:bg-[var(--glass)]">
          <MobileMenu />
          <Link href="/" className="flex-1 flex items-center justify-center">
            <img src="/Logo.png" alt="ZedBeatz" className="h-6 w-auto" />
          </Link>
          <div className="w-9" />
        </header>

        {/* Desktop: panels row with gap and padding */}
        <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden pt-14 lg:pt-2 lg:px-2 lg:gap-2 lg:pb-0">
          {/* Sidebar panel — elevated, rounded */}
          <div className="hidden lg:flex shrink-0 z-20 rounded-xl overflow-hidden bg-[var(--surface)]">
            <Sidebar />
          </div>

          {/* Main content panel — elevated, rounded, scrollable */}
          <main className="flex-1 lg:min-h-0 lg:overflow-y-auto scrollbar-hide lg:rounded-xl lg:bg-[var(--surface)]">
            {children}
            <Footer />
          </main>
        </div>

        {/* Player bar */}
        <Player />

        {/* Mobile bottom nav */}
        <BottomNav />

        <ScrollToTop />
        <ScrollRestoration />
        <ToastContainer />
      </div>
    </LikesProvider>
  );
}
