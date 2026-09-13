// Async server sections for the home page — each fetches its own data so
// Next.js can stream them in with Suspense instead of blocking on one query.
// Each block owns its section wrapper + header, so empty data renders nothing.
import Link from "next/link";
import Image from "next/image";
import SectionHeader from "@/components/section-header";
import TrackCard from "@/components/track-card";
import HeroSection from "@/components/home/hero-section";
import TrendingSection from "@/components/home/trending-section";
import ScrollRow from "@/components/home/scroll-row";
import GenresMoods from "@/components/home/genres-moods";
import RadioStations from "@/components/home/radio-stations";
import RecentGrid, { type RecentItem } from "@/components/layout/recent-grid";
import { encodeId } from "@/lib/hashids";
import {
  getHeroData, getTrending, getLatest, getArtists, getAlbums,
  getPlaylists, getRadio, getGenres,
} from "@/components/home/home-data";

export async function HeroBlock() {
  const { hero, fallback, featuredAlbum } = await getHeroData();
  const tracks = hero.length > 0 ? hero : fallback;
  if (tracks.length === 0) return null;
  return <HeroSection tracks={tracks.slice(0, 5)} featuredAlbum={featuredAlbum} />;
}

export async function QuickPicksBlock() {
  const [playlists, trending] = await Promise.all([getPlaylists(), getTrending()]);
  const items: RecentItem[] = [
    ...playlists.slice(0, 4).map((p) => ({
      id: p.id, title: p.name, coverUrl: p.coverUrl ?? null, href: `/playlist/${encodeId(p.id)}`,
    })),
    ...trending.slice(0, 4).map((t) => ({
      id: t.id, title: t.title, coverUrl: t.coverUrl ?? null,
      href: `/track/${encodeId(t.id)}`,
    })),
  ].slice(0, 6);
  if (items.length < 4) return null;
  return (
    <section className="px-4 md:px-6 mb-7 md:mb-9">
      <SectionHeader title="Jump back in" />
      <RecentGrid items={items} />
    </section>
  );
}

export async function TrendingBlock() {
  const trending = await getTrending();
  if (trending.length === 0) return null;
  return (
    <section className="px-4 md:px-6 mb-7 md:mb-9">
      <SectionHeader title="Trending now" href="/tracks" />
      <TrendingSection tracks={trending.slice(0, 10)} />
    </section>
  );
}

export async function NewReleasesBlock() {
  const latest = await getLatest();
  if (latest.length === 0) return null;
  return (
    <section className="mb-7 md:mb-9">
      <div className="px-4 md:px-6">
        <SectionHeader title="New releases" href="/tracks" />
      </div>
      <ScrollRow>
        {latest.map((t) => (
          <div key={t.id} className="flex-shrink-0 w-[148px] md:w-[160px] snap-start">
            <TrackCard track={t} queue={latest} bare minimal />
          </div>
        ))}
      </ScrollRow>
    </section>
  );
}

export async function ArtistsBlock() {
  const artists = await getArtists();
  if (artists.length === 0) return null;
  return (
    <section className="mb-7 md:mb-9">
      <div className="px-4 md:px-6">
        <SectionHeader title="Top artists" href="/browse" />
      </div>
      <ScrollRow>
        {artists.map((artist) => (
          <Link key={artist.id} href={`/artist/${encodeId(artist.id)}`}
            className="group flex flex-col items-center gap-2 shrink-0 snap-start w-[96px] md:w-[112px]">
            <div className="relative w-[96px] h-[96px] md:w-[112px] md:h-[112px] rounded-full overflow-hidden bg-[var(--surface-3)] ring-1 ring-white/[0.08]">
              {artist.coverUrl && <Image src={artist.coverUrl} alt={artist.name} fill className="object-cover" unoptimized />}
            </div>
            <p className="text-xs md:text-[13px] font-semibold text-center leading-tight w-full truncate">
              {artist.name}
            </p>
          </Link>
        ))}
      </ScrollRow>
    </section>
  );
}

export async function AlbumsBlock() {
  const albums = await getAlbums();
  if (albums.length === 0) return null;
  return (
    <section className="mb-7 md:mb-9">
      <div className="px-4 md:px-6">
        <SectionHeader title="Albums" href="/browse" />
      </div>
      <ScrollRow>
        {albums.map((album) => (
          <Link key={album.id} href={`/album/${encodeId(album.id)}`} className="group flex-shrink-0 w-[148px] md:w-[160px] snap-start">
            <div className="relative w-full aspect-square overflow-hidden bg-[var(--surface-3)] mb-2 ring-1 ring-white/[0.06] rounded">
              {album.coverUrl && <Image src={album.coverUrl} alt={album.title} fill loading="lazy" className="object-cover" unoptimized />}
            </div>
            <p className="text-[13px] font-semibold truncate">{album.title}</p>
            <p className="text-xs text-[var(--muted)] truncate mt-0.5">{album.artistName}{album.releaseYear ? ` · ${album.releaseYear}` : ""}</p>
          </Link>
        ))}
      </ScrollRow>
    </section>
  );
}

export async function GenresBlock() {
  const genres = await getGenres();
  if (genres.length === 0) return null;
  return (
    <section className="px-4 md:px-6 mb-7 md:mb-9">
      <SectionHeader title="Browse by genre" />
      <GenresMoods genres={genres} />
    </section>
  );
}

export async function RadioBlock() {
  const stations = await getRadio();
  if (stations.length === 0) return null;
  return (
    <section className="mb-7 md:mb-9">
      <div className="px-4 md:px-6">
        <SectionHeader title="Artist radio" />
      </div>
      <ScrollRow>
        <RadioStations stations={stations} />
      </ScrollRow>
    </section>
  );
}

export async function PlaylistsBlock() {
  const playlists = await getPlaylists();
  if (playlists.length === 0) return null;
  return (
    <section className="mb-2">
      <div className="px-4 md:px-6">
        <SectionHeader title="Playlists for you" />
      </div>
      <ScrollRow>
        {playlists.map((playlist) => (
          <Link key={playlist.id} href={`/playlist/${encodeId(playlist.id)}`} className="group flex-shrink-0 w-[148px] md:w-[160px] snap-start">
            <div className="relative w-full aspect-square overflow-hidden bg-[var(--surface-3)] mb-2 ring-1 ring-white/[0.06] rounded">
              {playlist.coverUrl && <Image src={playlist.coverUrl} alt={playlist.name} fill loading="lazy" className="object-cover" unoptimized />}
            </div>
            <p className="text-[13px] font-semibold truncate">{playlist.name}</p>
            {playlist.category && <p className="text-xs text-[var(--muted)] truncate mt-0.5">{playlist.category}</p>}
          </Link>
        ))}
      </ScrollRow>
    </section>
  );
}