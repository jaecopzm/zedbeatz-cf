import Sidebar from "@/components/sidebar";
import Player from "@/components/player/player";
import BottomNav from "@/components/bottom-nav";
import ToastContainer from "@/components/toast";
import MobileMenu from "@/components/mobile-menu";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scroll-to-top";
import { LikesProvider } from "@/lib/likes-context";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LikesProvider>
      <div className="flex flex-col h-full bg-[var(--background)] relative">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 border-b border-white/[0.07] bg-[rgba(10,10,15,0.55)] backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)] supports-[backdrop-filter]:bg-[rgba(10,10,15,0.45)]">
          <MobileMenu />
          <img src="/Logo.png" alt="ZedBeatz" className="h-6 w-auto absolute left-1/2 -translate-x-1/2" />
          <div className="w-9" />{/* spacer to balance the hamburger */}
        </header>

        <div className="flex flex-1 overflow-hidden pt-14 lg:pt-0">
          {/* Sidebar — desktop only */}
          <div className="hidden lg:block shrink-0 z-20">
            <Sidebar />
          </div>

          {/* Main scrollable area */}
          <main className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </main>
        </div>

        {/* Player bar — sits at bottom on desktop */}
        <Player />

        {/* Mobile bottom nav */}
        <BottomNav />

        {/* Scroll to top button */}
        <ScrollToTop />

        {/* Toast notifications */}
        <ToastContainer />
      </div>
    </LikesProvider>
  );
}
