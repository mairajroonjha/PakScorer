# PakScorer

Next.js + TypeScript implementation of the PakScorer platform blueprint.

## Implemented modules
- Role hierarchy with RBAC capabilities (`SUPER_ADMIN`, `TOURNAMENT_ADMIN`, `TEAM_ADMIN`, `MATCH_SCORER`, `PUBLIC_VIEWER`).
- Team dashboard with global team profiles, tournament applications, and direct match requests.
- Tournament request and approval workflow.
- Player verification IDs (`BCA-XXX`) and anti-duplication squad assignment rule.
- Squad lock behavior support with override path.
- Matchday scoring engine (toss, ball events, commentary, correction ledger, completion).
- Dynamic leaderboard recalculation and head-to-head endpoint.
- Fan voting with OTP-required payload + per-device/IP hash limit.
- News feed CRUD-lite and scorecard snapshot metadata endpoint.
- Monthly awards certificate generator endpoint.
- Realtime stream endpoint (`/api/realtime/stream`) using SSE with versioned events.
- Signed session auth routes with cookie-backed role switching.
- Connected dashboard forms for tournament requests, player registration, news posting, toss, commentary, and fan voting.

## API quick map
- `POST /api/tournaments/request`
- `POST /api/tournaments/:id/approve`
- `POST /api/tournaments/:id/reject`
- `POST /api/players`
- `GET /api/players/:bcaId`
- `POST /api/teams/:id/squad`
- `POST /api/matches/:id/lock-squad`
- `POST /api/matches/:id/toss`
- `POST /api/matches/:id/balls`
- `POST /api/matches/:id/commentary`
- `POST /api/matches/:id/corrections`
- `PATCH /api/matches/:id/corrections`
- `POST /api/matches/:id/complete`
- `GET /api/leaderboards/top10`
- `GET /api/teams/:a/vs/:b`
- `POST /api/fan-votes/:matchId`
- `GET /api/news-feed`
- `POST /api/news-feed`
- `POST /api/share/scorecard-snapshot`
- `POST /api/jobs/monthly-awards`
- `GET /api/realtime/stream`
- `GET /api/dashboard/overview`
- `POST /api/teams/register`
- `POST /api/tournaments/:id/apply-team`
- `POST /api/team-applications/:id/approve`
- `POST /api/team-applications/:id/reject`
- `POST /api/direct-matches/request`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

## Role simulation
Preferred path: use the session switcher in the UI or call auth routes.

Fallback path: send header `x-user-id` with one of:
- `u-super`
- `u-tadmin`
- `u-teamadmin`
- `u-scorer`
- `u-public`

UI route guarding uses cookie `userId` in `src/middleware.ts`.

## Setup
1. Install Node.js 20+.
2. Run `npm install`.
3. Run `npx prisma generate`.
4. Optionally run `npx prisma db push` then `npx prisma db seed`.
5. Run `npm run dev`.
6. Open `http://localhost:3000`.

## Cloudflare deployment
This app is a full-stack Next.js application with API routes, middleware, auth, SSE, and Prisma. It should be deployed to Cloudflare Workers using OpenNext, not as a plain Cloudflare Pages static site.

If `https://pakscorer.pages.dev/` returns 404, that usually means there is no Pages project serving that hostname. The supported deployment path in this repo is:

1. Install dependencies with `npm install`.
2. Log in to Cloudflare with `npx wrangler login`.
3. Build the Worker bundle with `npm run cf:build`.
4. Deploy with `npm run cf:deploy`.

Required production secrets/environment variables:
- `DATABASE_URL`
- `NEXTAUTH_SECRET` or `AUTH_SECRET`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` if Google login is enabled
- `REDIS_URL` if realtime Redis publishing is enabled

After deployment, Cloudflare will give you a Workers URL or let you attach a custom domain. A `pages.dev` hostname will not be created unless you separately create a Cloudflare Pages project.

## Test
- Run `npm run test`.

## Notes
- Runtime still uses the in-memory store in [src/lib/store.ts](/C:/Users/PMLS/Desktop/Pakscorer/src/lib/store.ts) for app data.
- Prisma schema and seed are now ready for the PostgreSQL migration path in [prisma/schema.prisma](/C:/Users/PMLS/Desktop/Pakscorer/prisma/schema.prisma) and [prisma/seed.js](/C:/Users/PMLS/Desktop/Pakscorer/prisma/seed.js).
- Realtime publisher auto-switches to Redis when `REDIS_URL` is configured.
