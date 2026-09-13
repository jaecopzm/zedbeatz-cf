"use client";

import { Download } from "lucide-react";
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

          writer.setFrame("TIT2", `${title} | ZedBeatz`);
          
          const fullArtist = featuredArtists ? `${artist} feat. ${featuredArtists}` : artist;
          if (fullArtist && fullArtist !== "Unknown") {
            writer.setFrame("TPE1", [fullArtist]);
          }
          
          writer.setFrame("TALB", "ZedBeatz");
          
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(coverUrl)}`;
          const coverRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
          if (coverRes.ok) {
            const coverBuffer = await coverRes.arrayBuffer();
            writer.setFrame("APIC", {
              type: 3,
              data: coverBuffer,
              description: "Cover",
            });
          }
          
          writer.addTag();
          finalBuffer = await writer.getBlob().arrayBuffer();
        } catch {
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
