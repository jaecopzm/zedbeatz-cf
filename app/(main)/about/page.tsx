import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";

export const metadata: Metadata = {
  title: "About ZedBeatz - Zambian Music Streaming Platform",
  description: "ZedBeatz is the #1 platform for streaming and downloading latest Zambian music. Discover Yo Maps, Chile One, Kell Kay, Macky 2 and more Zambian artists. Free MP3 downloads.",
  keywords: [
    "About ZedBeatz", "Zambian music streaming", "free Zambian music download",
    "ZedBeatz support", "Zambian music platform"
  ],
  openGraph: {
    title: "About ZedBeatz - Zambian Music Streaming Platform | ZedBeatz",
    description: "ZedBeatz is the #1 platform for streaming and downloading latest Zambian music. Discover Yo Maps, Chile One, Kell Kay, Macky 2 and more Zambian artists. Free MP3 downloads.",
    url: "https://zedbeatz.com/about",
    siteName: "ZedBeatz",
    locale: "en_ZM",
    countryName: "Zambia",
  },
  twitter: {
    card: "summary_large_image",
    title: "About ZedBeatz - Zambian Music Streaming Platform",
    description: "ZedBeatz is the #1 platform for streaming and downloading latest Zambian music. Discover Yo Maps, Chile One, Kell Kay, Macky 2 and more Zambian artists. Free MP3 downloads.",
  },
};

export default function AboutPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is ZedBeatz?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ZedBeatz is Zambia's premier music streaming and download platform, dedicated to promoting and distributing Zambian music to the world."
        }
      },
      {
        "@type": "Question",
        "name": "How do I download Zambian music MP3s on ZedBeatz?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can search for your favorite Zambian songs or browse through the latest tracks and click the download button to save the high-quality MP3 directly to your device."
        }
      },
      {
        "@type": "Question",
        "name": "How can Zambian artists upload their music on ZedBeatz?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Zambian artists looking to distribute and promote their music on ZedBeatz can get in touch with our team via WhatsApp at +260 971 185807."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <div className="min-h-screen pb-32 px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-5xl font-bold mb-6">About ZedBeatz</h1>
        
        <div className="space-y-6 text-[var(--muted)] leading-relaxed text-sm md:text-base">
          <p>
            ZedBeatz is Zambia's premier music streaming and download platform, dedicated to promoting and distributing Zambian music to the world.
          </p>
          
          <p>
            We provide a platform for Zambian artists to share their music with fans, offering both streaming and download options for the latest hits, classic tracks, and emerging talent.
          </p>
          
          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Our Mission</h2>
          <p>
            To celebrate and amplify Zambian music culture by providing easy access to quality music content while supporting local artists and the music industry.
          </p>
          
          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">What We Offer</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Stream unlimited Zambian music</li>
            <li>Download MP3 tracks</li>
            <li>Discover new artists and releases</li>
            <li>Curated playlists and charts</li>
            <li>Artist profiles and albums</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">For Artists</h2>
          <p>
            Are you an artist looking to upload your music to ZedBeatz? Contact us via WhatsApp at{" "}
            <a href="https://wa.me/260971185807" className="text-[var(--primary)] hover:underline">
              +260 971 185807
            </a>
          </p>
        </div>
      </div>
    </div>
  </>
);
}
