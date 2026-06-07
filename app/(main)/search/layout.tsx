import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Latest Zambian Music MP3s | ZedBeatz",
  description: "Search for Zambian music, artists, and albums on ZedBeatz. Find your favorite Zambian songs and free MP3 downloads.",
  keywords: ["search Zambian music", "find Zambian songs", "ZedBeatz search", "Zambia MP3 search"],
  alternates: {
    canonical: "https://zedbeatz.com/search",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
