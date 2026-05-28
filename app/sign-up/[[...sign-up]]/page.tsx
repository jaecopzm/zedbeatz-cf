import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a ZedBeatz account to save playlists, track your listening history, and discover Zambian music.",
};

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <SignUp />
    </div>
  );
}
