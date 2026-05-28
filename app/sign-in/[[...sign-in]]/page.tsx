import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to ZedBeatz to access your library, playlists, and listening statistics.",
};

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <SignIn />
    </div>
  );
}
