import type { Metadata } from "next";
import { Suspense } from "react";
import ContinueListening from "@/components/home/continue-listening";
import {
  HeroBlock, QuickPicksBlock, TrendingBlock, NewReleasesBlock,
  ArtistsBlock, AlbumsBlock, GenresBlock, RadioBlock, PlaylistsBlock,
} from "@/components/home/home-sections";
import {
  HeroSkeleton, QuickPicksSkeleton, TrendingSkeleton,
  RailSkeleton, ArtistSkeleton, PillsSkeleton,
} from "@/components/home/home-skeletons";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
const ogImage = new URL("/zedbeatz-logo.png", siteUrl).toString();

export const metadata: Metadata = {
  title: "ZedBeatz - Download Latest Zambian Music MP3 2026",
  description:
    "Download latest Zambian music MP3 free in 2026. Yo Maps new songs, Chile One, Kell Kay, Chef 187 mp3 download. Stream aweah mp3, Zambian music 2026. #1 platform for Zambian music download and streaming.",
  keywords: [
    "Zambian music download", "latest Zambian songs", "Yo Maps new songs",
    "Yo Maps mp3 download", "Chile One new songs", "Kell Kay mp3",
    "aweah mp3 download", "Zambian music 2026", "free mp3 download Zambia",
    "Zambia music streaming", "ZedBeatz"
  ],
  openGraph: {
    url: siteUrl,
    title: "ZedBeatz - Latest Zambian Music MP3 Download",
    description:
      "Download Yo Maps, Chile One, Kell Kay new songs. Free Zambian music MP3 download 2026 on ZedBeatz.",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "ZedBeatz - Zambian Music Streaming Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZedBeatz - Download Latest Zambian Music MP3 2026",
    description:
      "Download latest Zambian music MP3 free. Yo Maps new songs, Chile One, Kell Kay, Chef 187 mp3 download.",
    images: [ogImage],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const revalidate = 60;

/* ─── Page — streams section by section ──────────────────── */
export default function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ZedBeatz",
      url: baseUrl,
      description: "Download latest Zambian music MP3. Stream Yo Maps, Chile One, Kell Kay new songs.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ZedBeatz",
      url: baseUrl,
      logo: `${baseUrl}/zedbeatz-logo.png`,
      description: "Zambian music streaming and download platform. Download latest Zambian music MP3 free.",
      foundingDate: "2024",
      areaServed: "ZM",
      sameAs: [
        "https://www.facebook.com/profile.php?id=61579237109236",
        "https://www.youtube.com/@zedbeatzm",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      name: "Featured Artists on ZedBeatz",
      description: "Browse popular Zambian artists including Yo Maps, Chile One, Kell Kay, Macky 2, Chef 187, Slapdee and more.",
      genre: "Zambian Music",
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="relative pb-8">
        <h1 className="sr-only">ZedBeatz - Zambian Music MP3 Download & Streaming</h1>

        <div className="pt-3 md:pt-4">
          <Suspense fallback={<HeroSkeleton />}>
            <HeroBlock />
          </Suspense>
        </div>

        <Suspense fallback={
          <div className="px-4 md:px-6 mb-7 md:mb-9"><QuickPicksSkeleton /></div>
        }>
          <QuickPicksBlock />
        </Suspense>

        <div className="px-4 md:px-6">
          <ContinueListening />
        </div>

        <Suspense fallback={
          <div className="px-4 md:px-6 mb-7 md:mb-9"><TrendingSkeleton /></div>
        }>
          <TrendingBlock />
        </Suspense>

        <Suspense fallback={
          <div className="mb-7 md:mb-9 px-4 md:px-6"><RailSkeleton /></div>
        }>
          <NewReleasesBlock />
        </Suspense>

        <Suspense fallback={
          <div className="mb-7 md:mb-9 px-4 md:px-6"><ArtistSkeleton /></div>
        }>
          <ArtistsBlock />
        </Suspense>

        <Suspense fallback={
          <div className="mb-7 md:mb-9 px-4 md:px-6"><RailSkeleton /></div>
        }>
          <AlbumsBlock />
        </Suspense>

        <Suspense fallback={
          <div className="px-4 md:px-6 mb-7 md:mb-9"><PillsSkeleton /></div>
        }>
          <GenresBlock />
        </Suspense>

        <Suspense fallback={
          <div className="mb-7 md:mb-9 px-4 md:px-6"><RailSkeleton count={6} /></div>
        }>
          <RadioBlock />
        </Suspense>

        <Suspense fallback={
          <div className="mb-2 px-4 md:px-6"><RailSkeleton count={6} /></div>
        }>
          <PlaylistsBlock />
        </Suspense>
      </div>
    </>
  );
}
