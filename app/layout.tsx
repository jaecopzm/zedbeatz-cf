import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import PwaManager from "@/components/pwa-manager";
import ToastContainer from "@/components/toast";
import KeyboardShortcutsModal from "@/components/keyboard-shortcuts-modal";
import "./globals.css";

const geist = Geist({ 
  variable: "--font-geist-sans", 
  subsets: ["latin"],
  display: "swap",
  preload: true
});

export const metadata: Metadata = {
  title: {
    default: "ZedBeatz - Zambian Music MP3 Download & Streaming",
    template: "%s | ZedBeatz"
  },
  description: "Download and stream latest Zambian music MP3. Yo Maps, Chile One, Kell Kay new songs. Free Zambian music download, aweah mp3, latest hits 2026.",
  keywords: [
    "Zambian music", "Zambian music download", "mp3 download", "aweah mp3 download",
    "Yo Maps", "Yo Maps new songs", "Yo Maps ft", "Yo Maps mp3 download",
    "Chile One", "Chile One new songs", "Kell Kay", "Kell Kay mp3",
    "Zambian artists", "Zambia music 2026", "latest Zambian songs",
    "free music download", "stream Zambian music", "African music",
    "ZedBeatz", "Zambia streaming", "new Zambian music"
  ],
  authors: [{ name: "ZedBeatz" }],
  creator: "ZedBeatz",
  openGraph: {
    type: "website",
    locale: "en_ZM",
    url: "https://zedbeatz.com",
    title: "ZedBeatz - Download Latest Zambian Music MP3",
    description: "Stream & download latest Zambian music. Yo Maps, Chile One, Kell Kay new songs. Free MP3 download.",
    siteName: "ZedBeatz",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZedBeatz - Zambian Music MP3 Download",
    description: "Download latest Zambian music MP3. Yo Maps, Chile One new songs & more.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} h-full`} data-scroll-behavior="smooth">
        <head>
          <meta name="google-adsense-account" content="ca-pub-2560191456415218" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="dns-prefetch" href="https://cdn.zedbeatz.com" />
        </head>
        <body className="h-full bg-background text-foreground antialiased selection:bg-[var(--primary)] selection:text-black">
          <Script src="https://www.googletagmanager.com/gtag/js?id=G-55D0XM6BJB" strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-55D0XM6BJB');
          `}</Script>
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2560191456415218"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
          <PwaManager />
          <ToastContainer />
          <KeyboardShortcutsModal />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
