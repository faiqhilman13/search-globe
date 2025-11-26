# Trends Globe MVP

Node + SQLite backend with a React + three.js (r3f) frontend to browse Google Trends by country/region.

## Backend (Fastify)
1) Copy `.env.example` to `.env` and set `API_TOKEN` (any secret string), optionally tweak `PORT`/`CRON_SPEC`. If deploying with a volume, set `DATA_DIR` to the mounted path (e.g., `/data`).
2) If using Apify fallback (when Google Trends blocks your network), set `APIFY_TOKEN` (from Apify) and optionally `APIFY_TASK` (defaults to `petrpatek~google-trends-scraper`).
3) Install deps (already done here): `npm install`
4) Run server: `npm run dev` (or `npm start`)
5) Trigger an ingest (required before the UI shows data):
   ```sh
   curl -X POST http://localhost:4000/ingest -H "Authorization: Bearer $API_TOKEN"
   ```
   Cron runs daily at `CRON_SPEC` unless `DISABLE_CRON=true`.

Tables live in `data/trends.db` and are auto-created/seeding countries on boot.

## Frontend (Vite + React + r3f + ECharts)
1) `cd client`
2) Copy `.env.example` to `.env` and point `VITE_API_BASE` to the backend, set `VITE_API_TOKEN` to match.
3) `npm install`
4) `npm run dev` → open the shown URL.

Use the region/country selectors or click markers on the globe. Toggle breakout-only and change the window (7/30/90d). The “Hot in {region}” block shows cross-country hits; the main panel shows top terms for the selected country.

## Notes / limitations
- Uses `google-trends-api` and `trendingSearches` (per-country). Weekly/monthly views are derived from daily history; CN may not return data.
- Ingest is rate-limited via a small concurrency pool in code; for backfill, loop over `/ingest` with custom `date` in the body if needed.
- Auth is a simple bearer token on all endpoints except `/health`; keep this private deployment-only.
