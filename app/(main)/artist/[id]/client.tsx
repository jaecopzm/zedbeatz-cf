"use client";

import { useState } from "react";
import Image from "next/image";
import type { Track } from "@/lib/player-store";
import ArtistTabs from "@/components/artist/artist-tabs";
import PopularTracks from "@/components/artist/popular-tracks";
import ArtistAlbums from "@/components/artist/artist-albums";
import ArtistTracks from "@/components/artist/artist-tracks";
import AppearsOn from "@/components/artist/appears-on";
import ViewToggle from "@/components/view-toggle";
import { Play } from "lucide-react";
import { TrackMenu } from "@/components/track-menu";

type AlbumType = {
  id: number;
  title: string;
  slug: string | null;
  releaseYear: number | null;
  coverUrl: string | null;
};

type ArtistType = {
  id: number;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  slug: string | null;
  trackCount: number;
  albumCount: number;
  totalPlays: number;
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "music", label: "Music" },
  { id: "about", label: "About" },
];

export default function ArtistPageClient({
  tracks,
  albums,
  appearsOn,
  artist,
}: {
  tracks: (Track & { plays?: number })[];
  albums: AlbumType[];
  appearsOn: (Track & { plays?: number })[];
  artist: ArtistType;
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [discographyView, setDiscographyView] = useState<"grid" | "list">("grid");

  return (
    <>
      <ArtistTabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "overview" && (
        <div id="overview-panel" role="tabpanel">
          <PopularTracks tracks={tracks.slice(0, 5)} allTracks={tracks} />

          {albums.length > 0 && <ArtistAlbums albums={albums} />}

          {appearsOn.length > 0 && <AppearsOn tracks={appearsOn} artistName={artist.name} />}
        </div>
      )}

      {activeTab === "music" && (
        <div id="music-panel" role="tabpanel">
          <div className="px-4 md:px-10 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[17px] md:text-xl font-bold tracking-tight text-foreground">Discography</h2>
              <span className="text-xs font-semibold text-[var(--muted)]">
                {tracks.length}
              </span>
            </div>
            <ViewToggle view={discographyView} onChange={setDiscographyView} />
          </div>

          {discographyView === "grid" ? (
            <ArtistTracks tracks={tracks} />
          ) : (
            <div className="px-4 md:px-10">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {tracks.map((track) => (
                    <div
                      key={track.id}
                      className="group relative flex items-center gap-2 md:gap-2.5 px-3 py-2 cursor-pointer transition-colors border-b border-white/[0.06] hover:bg-white/[0.03]"
                    >
                      <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-[var(--surface-3)]">
                        {track.coverUrl ? (
                          <Image src={track.coverUrl} alt={track.title} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)]" />
                        )}
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <Play size={12} className="text-foreground ml-0.5" fill="currentColor" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-semibold line-clamp-2 leading-tight text-foreground">
                          {track.title}
                        </p>
                        {track.featuredArtists && (
                          <p className="text-[11px] md:text-xs text-[var(--muted)] truncate">
                            feat. {track.featuredArtists}
                          </p>
                        )}
                      </div>

                      {track.duration && (
                        <span className="text-[10px] text-[var(--muted-2)] tabular-nums hidden md:block shrink-0">
                          {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                        </span>
                      )}

                      <div className="-mr-1">
                        <TrackMenu track={track} />
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}

          {albums.length > 0 && <ArtistAlbums albums={albums} />}
        </div>
      )}

      {activeTab === "about" && (
        <div id="about-panel" role="tabpanel" className="px-4 md:px-10">
          <div className="max-w-2xl">
            {artist.bio && (
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-2">Biography</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">
                  {artist.bio}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[var(--surface)] rounded p-4">
                <p className="text-2xl font-bold">{artist.trackCount}</p>
                <p className="text-xs text-[var(--muted)]">Tracks</p>
              </div>
              <div className="bg-[var(--surface)] rounded p-4">
                <p className="text-2xl font-bold">{artist.albumCount}</p>
                <p className="text-xs text-[var(--muted)]">Albums</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
