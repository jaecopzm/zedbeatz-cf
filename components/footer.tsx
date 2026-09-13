import Link from "next/link";

function FacebookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

const socials = [
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61579237109236", Icon: FacebookIcon },
  { label: "YouTube", href: "https://www.youtube.com/@zedbeatzm", Icon: YouTubeIcon },
  { label: "WhatsApp", href: "https://wa.me/260971185807", Icon: WhatsAppIcon },
];

const linkCls = "hover:text-[var(--primary)] transition-colors";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] w-full mb-36 md:mb-0">
      <div className="w-full px-4 md:px-8 pt-4 md:pt-6 pb-3 md:pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
          {/* Brand — full row on mobile, single row of logo + socials */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center justify-between gap-3">
              <Link href="/"><img src="/zedbeatz-logo.png" alt="ZedBeatz" className="h-5 md:h-6 w-auto" /></Link>
              <div className="flex items-center gap-1.5">
                {socials.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="w-8 h-8 rounded-full bg-white/[0.05] ring-1 ring-white/[0.06] flex items-center justify-center text-[var(--muted)] hover:bg-[var(--primary)] hover:text-black hover:ring-transparent transition-all"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
            <p className="hidden md:block text-xs text-[var(--muted)] mt-2">Zambian music, streaming free.</p>
          </div>

          {/* Link columns — one row of 3 on mobile */}
          <div className="col-span-2 md:col-span-3 grid grid-cols-3 gap-3 md:gap-8">
            <div className="min-w-0">
              <h3 className="font-semibold mb-1.5 text-xs md:text-[13px]">Company</h3>
              <ul className="space-y-1 text-[11px] md:text-xs text-[var(--muted)]">
                <li><Link href="/about" className={linkCls}>About Us</Link></li>
                <li><Link href="/contact" className={linkCls}>Contact</Link></li>
              </ul>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold mb-1.5 text-xs md:text-[13px]">Legal</h3>
              <ul className="space-y-1 text-[11px] md:text-xs text-[var(--muted)]">
                <li><Link href="/terms" className={linkCls}>Terms</Link></li>
                <li><Link href="/privacy" className={linkCls}>Privacy</Link></li>
                <li><Link href="/dmca" className={linkCls}>DMCA</Link></li>
              </ul>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold mb-1.5 text-xs md:text-[13px]">Support</h3>
              <ul className="space-y-1 text-[11px] md:text-xs text-[var(--muted)]">
                <li className="truncate" title="support@zedbeatz.com"><a href="mailto:support@zedbeatz.com" className={linkCls}>Email us</a></li>
                <li><a href="https://wa.me/260971185807" target="_blank" rel="noopener noreferrer" className={linkCls}>+260 971 185807</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-3 md:mt-4 pt-2.5 border-t border-[var(--border)] text-[10px] md:text-[11px] text-[var(--muted-2)]">
          <p>&copy; {currentYear} ZedBeatz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
