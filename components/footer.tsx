import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] w-full mb-24 lg:mb-0">
      <div className="w-full px-4 md:px-8 py-5 md:py-8">
        {/* Desktop: 4-col grid. Mobile: brand + flex row of 3 */}
        <div className="mb-4">
          {/* Brand */}
          <div className="mb-6 md:hidden">
            <Link href="/"><img src="/Logo.png" alt="ZedBeatz" className="h-6 w-auto mb-2" /></Link>
            <p className="text-xs text-[var(--muted)] mb-3">Zambia's premier music streaming platform</p>
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/profile.php?id=61579237109236" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--primary)] transition-colors" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://www.youtube.com/@zedbeatzm" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--primary)] transition-colors" aria-label="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
              </a>
            </div>
          </div>

          {/* Mobile: 3 cols in a row */}
          <div className="flex flex-row gap-6 md:hidden">
            <div className="flex-1">
              <h3 className="font-semibold mb-2 text-sm">Company</h3>
              <ul className="space-y-1.5 text-xs text-[var(--muted)]">
                <li><Link href="/about" className="hover:text-[var(--primary)] transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[var(--primary)] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2 text-sm">Legal</h3>
              <ul className="space-y-1.5 text-xs text-[var(--muted)]">
                <li><Link href="/terms" className="hover:text-[var(--primary)] transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-[var(--primary)] transition-colors">Privacy</Link></li>
                <li><Link href="/dmca" className="hover:text-[var(--primary)] transition-colors">DMCA</Link></li>
              </ul>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2 text-sm">Support</h3>
              <ul className="space-y-1.5 text-xs text-[var(--muted)]">
                <li><a href="mailto:support@zedbeatz.com" className="hover:text-[var(--primary)] transition-colors">support@zedbeatz.com</a></li>
                <li><a href="https://wa.me/260971185807" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary)] transition-colors">+260 971 185807</a></li>
              </ul>
            </div>
          </div>

          {/* Desktop: proper 4-col grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-12">
            <div>
              <Link href="/"><img src="/Logo.png" alt="ZedBeatz" className="h-8 w-auto mb-2" /></Link>
              <p className="text-xs text-[var(--muted)] mb-3">Zambia's premier music streaming platform</p>
              <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/profile.php?id=61579237109236" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--primary)] transition-colors" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://www.youtube.com/@zedbeatzm" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--primary)] transition-colors" aria-label="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
              </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm">Company</h3>
              <ul className="space-y-2 text-xs text-[var(--muted)]">
                <li><Link href="/about" className="hover:text-[var(--primary)] transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[var(--primary)] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm">Legal</h3>
              <ul className="space-y-2 text-xs text-[var(--muted)]">
                <li><Link href="/terms" className="hover:text-[var(--primary)] transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-[var(--primary)] transition-colors">Privacy</Link></li>
                <li><Link href="/dmca" className="hover:text-[var(--primary)] transition-colors">DMCA</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm">Support</h3>
              <ul className="space-y-2 text-xs text-[var(--muted)]">
                <li><a href="mailto:support@zedbeatz.com" className="hover:text-[var(--primary)] transition-colors">support@zedbeatz.com</a></li>
                <li><a href="https://wa.me/260971185807" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary)] transition-colors">+260 971 185807</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
          <p>&copy; {currentYear} ZedBeatz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
