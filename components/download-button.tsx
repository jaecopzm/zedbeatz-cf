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

      const [audioRes, coverRes] = await Promise.all([
        fetch(audioUrl),
        coverUrl ? fetch(coverUrl) : Promise.resolve(null),
      ]);

      const audioBuffer = await audioRes.arrayBuffer();
      const coverBuffer = coverRes ? await coverRes.arrayBuffer() : null;

      let finalBuffer = audioBuffer;

      if (coverBuffer) {
        const { ID3Writer } = await import("browser-id3-writer");
        const writer = new ID3Writer(audioBuffer);

        // Title
        writer.setFrame("TIT2", title);

        // Artist display: "Artist feat. Featured" or just "Artist"
        const fullArtist = featuredArtists ? `${artist} feat. ${featuredArtists}` : artist;
        if (fullArtist) writer.setFrame("TPE1", [fullArtist]);

        // Album = "ZedBeatz"
        writer.setFrame("TALB", "ZedBeatz");

        // Publisher
        writer.setFrame("TPUB", "ZedBeatz");

        // Comment
        writer.setFrame("COMM", { description: "", text: "Downloaded from ZedBeatz.com", language: "eng" });

        // Cover art
        writer.setFrame("APIC", {
          type: 3,
          data: coverBuffer,
          description: "Cover",
          useUnicodeEncoding: false,
        });
        finalBuffer = writer.addTag();
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
    } catch {
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
