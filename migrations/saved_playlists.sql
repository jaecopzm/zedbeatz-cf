create table if not exists saved_playlists (
  user_id text not null,
  playlist_id integer not null references playlists(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, playlist_id)
);

-- Hero tracks manager
create table if not exists hero_tracks (
  id serial primary key,
  track_id integer not null references tracks(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz default now(),
  unique(track_id)
);
