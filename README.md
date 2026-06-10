# ⚽ WorldCup Live — Premium Football Streaming Platform

A full-stack, FIFA World Cup themed live football streaming site. Users sign up,
pay a one-time **$5** via Stripe, then stream live matches (powered by the
[1xapi Football Live Streaming API](https://github.com/1xapi/football-live-streaming-api)).

```
Sign up / Log in  ──►  Pay $5 (Stripe)  ──►  Watch live matches (HLS player)
```

## Stack
- **Backend** — Node + Express, JWT auth, bcrypt, **Neon PostgreSQL** (via `pg`), Stripe Checkout, HLS stream proxy.
- **Frontend** — React (Vite) + React Router, hls.js player, custom premium FIFA theme.
- Matches & payments can run on **mock data + mock payments**; drop in real keys for live mode. (A Neon `DATABASE_URL` is required to start.)

## Database (Neon PostgreSQL)
1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the **pooled** connection string (host contains `-pooler`, keep `?sslmode=require`).
3. Put it in `server/.env` as `DATABASE_URL=...`.

The `users` table is created automatically on first start (see `server/src/db.js`). The store interface lives in `server/src/store.js`.

## Project layout
```
worldcup-stream/
├── server/   # Express API  (port 5000)
└── client/   # React app    (port 5173)
```

## Quick start

### 1. Backend
```bash
cd server
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm start
```

### 2. Frontend (new terminal)
```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**.

## Modes (configured in `server/.env`)
| Variable | Empty (default) | Set |
|----------|-----------------|-----|
| `RAPIDAPI_KEY` | Themed **mock matches** (a real test HLS stream plays) | Live matches from RapidAPI |
| `STRIPE_SECRET_KEY` | **Mock payment** (no real charge, instantly unlocks) | Real Stripe Checkout ($5) |

### Going live
- **Matches:** get a key at [RapidAPI](https://rapidapi.com/1xapi-rapid-team/api/football-live-streaming-api) → set `RAPIDAPI_KEY`.
- **Payments:** get test keys at [Stripe](https://dashboard.stripe.com/test/apikeys) → set `STRIPE_SECRET_KEY`. Use test card `4242 4242 4242 4242`, any future expiry/CVC.

## How access is gated
1. `requireAuth` — every protected route needs a valid JWT.
2. `requirePaid` — `/api/matches` and `/api/stream/*` also require `user.hasPaid`.
3. The client mirrors this: routes are wrapped in `<ProtectedRoute requirePaid>`, so an unpaid user is always redirected to `/paywall`.

## TV Broadcasters
The **Matches** page has a **TV Broadcasters** tab (alongside All / Live / Upcoming). It lists the official FIFA World Cup 2026 broadcasters (BBC, FOX/FS1, TSN, SBS, Das Erste, beIN, CazéTV, CCTV-5, etc.) and plays embeddable feeds from the free [iptv-org API](https://github.com/iptv-org/api) when available. Rights-holder streams without a community feed (iPlayer, ITVX, Peacock, MagentaTV) appear as official platform cards. Direct URL: `/matches?tab=tv`.

## Notes on streaming
- All RapidAPI match streams (`direct`, `referer`, `drm`) route through `/api/stream/proxy` — signed CDN URLs (cdnfaster `sign`/`expire`) 403 if fetched directly from the browser.
- `referer` (CDN) streams are proxied with full browser headers (`Origin`, `Sec-Fetch-*`, exact UA) to reduce 403s. IP-locked mirrors may still fail.
- `drm` Clearkey MPEG-DASH plays via dash.js; manifests, segments, and license URLs are proxied.
