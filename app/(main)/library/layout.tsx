import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Library",
  description: "Your music library on ZedBeatz. Manage your playlists and saved songs.",
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
