import type { Metadata } from "next";

import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import PwaManager from "@/components/pwa-manager";
import ToastContainer from "@/components/toast";
import KeyboardShortcutsModal from "@/components/keyboard-shortcuts-modal";
import ThemeProvider from "@/components/theme-provider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
const ogImage = new URL("/og-image.png", siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ZedBeatz - Zambian Music MP3 Download & Streaming",
    template: "%s | ZedBeatz"
  },
  description: "Download and stream latest Zambian music MP3. Yo Maps, Chile One, Kell Kay new songs. Free Zambian music download, aweah mp3, latest hits 2026.",
  keywords: [
    "Zambian music", "Zambian music download", "Zambian music 2026",
    "mp3 download", "aweah mp3 download", "latest Zambian songs",
    "Yo Maps new songs", "Chile One new songs", "Kell Kay mp3",
    "free music download", "stream Zambian music", "ZedBeatz"
  ],
  authors: [{ name: "ZedBeatz" }],
  creator: "ZedBeatz",
  publisher: "ZedBeatz",
  openGraph: {
    type: "website",
    locale: "en_ZM",
    url: siteUrl,
    title: "ZedBeatz - Download Latest Zambian Music MP3",
    description: "Stream & download latest Zambian music. Yo Maps, Chile One, Kell Kay new songs. Free MP3 download. #1 Zambian music platform 2026.",
    siteName: "ZedBeatz",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "ZedBeatz - Zambian Music MP3 Download & Streaming",
      },
    ],
    countryName: "Zambia",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZedBeatz - Zambian Music MP3 Download",
    description: "Download latest Zambian music MP3. Yo Maps, Chile One new songs & more.",
    images: [ogImage],
    site: "@ZedBeatz",
    creator: "@ZedBeatz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "en-ZM": siteUrl,
    },
  },
  verification: {
    google: "V_Nv319pvwRw4RfeNjIu6Lc2nSoFEaNQUCpjysr0rgQ",
  },
  other: {
    "google-site-verification": "V_Nv319pvwRw4RfeNjIu6Lc2nSoFEaNQUCpjysr0rgQ",
  },
  category: "music",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="min-h-full">
        <head>
          <meta name="google-adsense-account" content="ca-pub-2560191456415218" />
          <meta name="theme-color" content="#0a0a0f" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="application-name" content="ZedBeatz" />
          <meta name="msapplication-TileColor" content="#0a0a0f" />
          <meta name="p:domain_verify" content="f175e6724de13902cbcb3012011d9799" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="dns-prefetch" href="https://cdn.zedbeatz.com" />
        </head>
        <body className="min-h-full bg-background text-foreground antialiased selection:bg-[var(--primary)] selection:text-black">
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
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
