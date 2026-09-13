# ZedBeatz API (Go)

Standalone backend decoupled from Next.js. Next.js becomes a pure frontend
fetching `API_BASE/api/v1/*`.

## Run

```bash
cp .env.example .env
go mod tidy
go run ./cmd/api
```

## Endpoints (v1, mirrors `app/api/*`)

Public: tracks, artists, albums, search, home, hero, radio, lyrics/check,
playlists (featured), comments GET, follows count.
Auth (Clerk Bearer): likes, comments POST/DELETE, follows POST,
recently-played, stats, upload presign.
Admin (`ADMIN_USER_ID`): `/api/v1/admin/*`.

Auth is Clerk JWT `sub` claim via `Authorization: Bearer`. Full JWKS
signature verification is the next hardening step before prod.
