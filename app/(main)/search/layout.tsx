import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for Zambian music, artists, and albums on ZedBeatz. Find your favorite Zambian songs and MP3 downloads.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
