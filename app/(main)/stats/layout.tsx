import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Stats",
  description: "View your listening statistics on ZedBeatz. Track your top tracks, artists, and listening time.",
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
