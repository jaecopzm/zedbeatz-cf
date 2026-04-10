import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-32 px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6">About ZedBeatz</h1>
        
        <div className="space-y-6 text-[var(--muted)] leading-relaxed">
          <p>
            ZedBeatz is Zambia's premier music streaming and download platform, dedicated to promoting and distributing Zambian music to the world.
          </p>
          
          <p>
            We provide a platform for Zambian artists to share their music with fans, offering both streaming and download options for the latest hits, classic tracks, and emerging talent.
          </p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Our Mission</h2>
          <p>
            To celebrate and amplify Zambian music culture by providing easy access to quality music content while supporting local artists and the music industry.
          </p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">What We Offer</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Stream unlimited Zambian music</li>
            <li>Download MP3 tracks</li>
            <li>Discover new artists and releases</li>
            <li>Curated playlists and charts</li>
            <li>Artist profiles and albums</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">For Artists</h2>
          <p>
            Are you an artist looking to upload your music to ZedBeatz? Contact us via WhatsApp at{" "}
            <a href="https://wa.me/260971185807" className="text-[var(--primary)] hover:underline">
              +260 971 185807
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
