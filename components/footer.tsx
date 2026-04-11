import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-auto w-full mb-32 lg:mb-0">
      <div className="w-full px-4 md:px-8 py-8 md:py-12">
        {/* Desktop: 4-col grid. Mobile: brand + flex row of 3 */}
        <div className="mb-8">
          {/* Brand */}
          <div className="mb-6 md:hidden">
            <Link href="/"><img src="/Logo.png" alt="ZedBeatz" className="h-6 w-auto mb-2" /></Link>
            <p className="text-xs text-[var(--muted)]">Zambia's premier music streaming platform</p>
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
              <p className="text-xs text-[var(--muted)]">Zambia's premier music streaming platform</p>
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
