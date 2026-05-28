"use client";

import { Download } from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { showToast } from "@/components/toast";

export default function DownloadButton({
  audioUrl,
  title,
  artist,
  featuredArtists,
  coverUrl,
}: {
  audioUrl: string;
  title: string;
  artist?: string;
  featuredArtists?: string;
  coverUrl?: string;
}) {
  const { isSignedIn } = useUser();

  async function handleDownload() {
    try {
      showToast("Preparing download…", "info");

      const audioRes = await fetch(audioUrl);
      const audioBuffer = await audioRes.arrayBuffer();
      
      let finalBuffer = audioBuffer;

      if (coverUrl) {
        try {
          const { ID3Writer } = await import("browser-id3-writer");
          const writer = new ID3Writer(audioBuffer);

          // Set metadata frames
          writer.setFrame("TIT2", title);
          
          const fullArtist = featuredArtists ? `${artist} feat. ${featuredArtists}` : artist;
          console.log("Setting artist metadata:", fullArtist); // Debug log
          if (fullArtist && fullArtist !== "Unknown") {
            writer.setFrame("TPE1", [fullArtist]);
          }
          
          writer.setFrame("TALB", "ZedBeatz");
          
          // Fetch and embed cover art
          console.log("Embedding cover from URL:", coverUrl); // Debug log
          const coverRes = await fetch(coverUrl);
          if (!coverRes.ok) {
            console.error("Failed to fetch cover:", coverRes.status);
            throw new Error(`Cover fetch failed: ${coverRes.status}`);
          }
          const coverBuffer = await coverRes.arrayBuffer();

          writer.setFrame("APIC", {
            type: 3,
            data: coverBuffer,
            description: "Cover",
          });
          
          writer.addTag();
          finalBuffer = await writer.getBlob().arrayBuffer();
        } catch (err) {
          console.error("Failed to embed cover art:", err);
          // Continue with download even if cover fails
        }
      }

      const fullArtistName = featuredArtists ? `${artist} ft. ${featuredArtists}` : artist;
      const filename = fullArtistName ? `${fullArtistName} - ${title}` : title;
      const blob = new Blob([finalBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Download started", "success");
    } catch (err) {
      console.error("Download error:", err);
      showToast("Download failed", "error");
    }
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          className="flex items-center justify-center transition-colors hover:opacity-70"
          title="Sign in to download"
        >
          <Download size={18} />
        </button>
      </SignInButton>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className="flex items-center justify-center transition-colors hover:opacity-70"
      title="Download track"
    >
      <Download size={18} />
    </button>
  );
}
