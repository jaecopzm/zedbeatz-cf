"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Music2, 
  LayoutDashboard, 
  Users, 
  Disc, 
  ListMusic, 
  Upload, 
  Bot, 
  Home,
  Menu,
  X,
  Star
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Tracks", href: "/admin", icon: Music2 },
  { name: "Artists", href: "/admin/artists", icon: Users },
  { name: "Albums", href: "/admin/albums", icon: Disc },
  { name: "Playlists", href: "/admin/playlists", icon: ListMusic },
  { name: "Hero", href: "/admin/hero", icon: Star },
  { name: "Upload", href: "/admin/upload", icon: Upload },
  { name: "Agent Upload", href: "/admin/agent-upload", icon: Bot, highlight: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-white/5 z-40 px-4 flex items-center justify-between">
        <Link href="/admin/dashboard">
          <img src="/Logo.png" alt="ZedBeatz Admin" className="h-8 w-auto" />
        </Link>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/70 hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 h-screen fixed left-0 top-0 bg-[var(--surface)] border-r border-white/5 z-50 overflow-hidden">
        {/* Logo Section */}
        <div className="px-5 py-5">
          <Link href="/admin/dashboard" className="group inline-block">
            <img src="/Logo.png" alt="ZedBeatz Admin" className="h-7 w-auto group-hover:scale-105 transition-transform duration-300" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/admin" && pathname === "/admin");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20" 
                    : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className={isActive ? "text-[var(--primary)]" : "text-white/40 group-hover:text-white"} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {item.name}
                  </span>
                </div>
                {isActive && (
                  <motion.div layoutId="active-pill" className="w-1 h-1 rounded-full bg-[var(--primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-3 mt-auto">
          <Link 
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all group"
          >
            <Home size={15} />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Site</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-[var(--surface)] border-r border-white/10 z-[101] lg:hidden flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                    <Music2 size={18} className="text-black" />
                  </div>
                  <span className="font-black text-sm tracking-tighter uppercase">ZedBeatz Admin</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-white/40">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href === "/admin" && pathname === "/admin");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                        isActive 
                          ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20" 
                          : "text-white/40 border border-transparent"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-sm font-black uppercase tracking-widest leading-none">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
                <Link href="/" className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/5 text-white/40">
                  <Home size={20} />
                  <span className="text-sm font-black uppercase tracking-widest leading-none">Back to Site</span>
                </Link>
                <div className="text-[10px] text-center font-black uppercase tracking-[0.3em] text-white/10">Version 2.0 Premium Admin</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
