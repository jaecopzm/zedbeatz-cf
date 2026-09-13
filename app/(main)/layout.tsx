import Sidebar from "@/components/sidebar";
import Player from "@/components/player/player";
import BottomNav from "@/components/bottom-nav";
import ToastContainer from "@/components/toast";
import MobileMenu from "@/components/mobile-menu";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scroll-to-top";
import ScrollRestoration from "@/components/scroll-restoration";
import Topbar from "@/components/layout/topbar";
import NowPlayingPanel from "@/components/layout/now-playing-panel";
import { LikesProvider } from "@/lib/likes-context";
import Link from "next/link";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LikesProvider>
      <div className="flex h-screen supports-[height:100dvh]:h-dvh flex-col bg-[var(--background)] relative">
        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center px-4 border-b border-[var(--border)] bg-[var(--glass)] backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)] supports-[backdrop-filter]:bg-[var(--glass)]">
          <MobileMenu />
          <Link href="/" className="flex-1 flex items-center justify-center">
            <img src="/zedbeatz-logo.png" alt="ZedBeatz" className="h-6 w-auto" />
          </Link>
          <div className="w-9" />
        </header>

        {/* Desktop: panels row with gap and padding */}
        <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden pt-14 md:pt-2.5 md:px-2.5 md:gap-2.5 md:pb-0">
          {/* Sidebar panel — floating glass rail */}
          <div className="hidden md:flex shrink-0 z-20 rounded overflow-hidden bg-[var(--surface)] ring-1 ring-white/[0.06]">
            <Sidebar />
          </div>

          {/* Main content panel — floating, rounded, scrollable */}
          <main className="flex-1 min-w-0 md:min-h-0 md:overflow-y-auto scrollbar-hide md:rounded md:bg-[var(--surface)] md:ring-1 md:ring-white/[0.06] md:pb-6">
            <Topbar />
            {children}
            <Footer />
          </main>

          {/* Right Now-Playing panel — desktop only */}
          <NowPlayingPanel />
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
