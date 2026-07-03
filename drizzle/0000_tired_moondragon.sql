CREATE TABLE "albums" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"artist_id" integer,
	"slug" varchar(255),
	"album_type" varchar(20) DEFAULT 'album',
	"release_year" integer,
	"release_date" varchar(10),
	"spotify_id" varchar(50),
	"deezer_id" varchar(30),
	"cover_url" text,
	"is_featured" boolean DEFAULT false,
	"cover_key" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"bio" text,
	"image_url" text,
	"spotify_id" varchar(50),
	"deezer_id" varchar(30),
	"country" varchar(5) DEFAULT 'ZM',
	"genre" varchar(100),
	"image_key" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"track_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"user_name" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "featured_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot_type" varchar(50) NOT NULL,
	"track_id" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true,
	"label" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "featured_slots_slot_type_position_unique" UNIQUE("slot_type","position")
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"artist_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hero_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"track_id" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "hero_tracks_track_id_unique" UNIQUE("track_id")
);
--> statement-breakpoint
CREATE TABLE "playlist_tracks" (
	"playlist_id" integer NOT NULL,
	"track_id" integer NOT NULL,
	"position" integer,
	CONSTRAINT "playlist_tracks_playlist_id_track_id_pk" PRIMARY KEY("playlist_id","track_id")
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"user_id" varchar,
	"cover_url" text,
	"is_featured" boolean DEFAULT false,
	"category" varchar,
	"description" text,
	"cover_key" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recently_played" (
	"id" serial PRIMARY KEY NOT NULL,
	"track_id" integer,
	"user_id" varchar,
	"played_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "saved_playlists" (
	"user_id" varchar NOT NULL,
	"playlist_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "saved_playlists_user_id_playlist_id_pk" PRIMARY KEY("user_id","playlist_id")
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"artist_id" integer,
	"album_id" integer,
	"spotify_id" varchar(50),
	"isrc" varchar(20),
	"deezer_id" varchar(30),
	"cover_url" text,
	"audio_key" varchar(255),
	"cover_key" varchar(255),
	"duration" numeric,
	"genre" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"featured_artists" text,
	"plays" integer DEFAULT 0,
	"slug" varchar(255),
	"lyrics" text,
	"synced_lyrics" text,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_slots" ADD CONSTRAINT "featured_slots_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_tracks" ADD CONSTRAINT "hero_tracks_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_played" ADD CONSTRAINT "recently_played_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_playlists" ADD CONSTRAINT "saved_playlists_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;