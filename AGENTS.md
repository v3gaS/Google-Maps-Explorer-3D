# AGENTS.md — 3D Google Maps Explorer

This file is the **canonical handoff document** for any AI agent working in this repository. Read it at the start of every session. **Update it before you finish** whenever you change behavior, architecture, or project status.

---

## Agent instructions (required)

### At session start

1. Read this entire file.
2. Read [`README.md`](README.md) for user-facing setup and usage.
3. Check **Progress log** and **Known issues** below before planning work.
4. Do not commit `.env`, service-account JSON, or API keys.

### Before session end (when you complete a task)

Update this file in the same PR/commit as your code changes:

1. **Progress log** — add a dated entry: what changed, which files, how to verify.
2. **System notes** — if you learned something non-obvious (API quirks, bugs, conventions), add it under **System notes**.
3. **Roadmap** — move completed items to Progress log; add new planned items if discussed.
4. **Architecture** — update the diagram or file map if you added modules, routes, or env vars.

Keep entries factual and brief. Future agents depend on this file being current.

---

## Project overview

**Name:** 3D Google Maps Explorer (`googlemapsAI`)

**Purpose:** A browser-based explorer that renders **Google Maps native 3D** (`Map3DElement`) with photorealistic buildings where available, plus screen-space atmosphere (time of day, clouds, rain, snow) and location search.

**Stack:**

| Layer | Technology |
|-------|------------|
| Server | Node.js 18+, Express |
| Map | Google Maps JavaScript API (`v=beta`, `maps3d` library, `Map3DElement`) |
| Atmosphere | Canvas 2D overlay (`pointer-events: none`) |
| Weather data | Open-Meteo via server proxy (no extra API key) |
| Config | `.env` via `dotenv` |

**Run locally:**

```bash
npm install
cp .env.example .env   # set GOOGLE_MAPS_API_KEY
npm start              # http://localhost:3000
npm test               # smoke tests (server must be running)
npm run dev            # nodemon
```

---

## Architecture

```text
server.js
  GET /api/health
  GET /api/maps-config   → { apiKey, mapsVersion: "beta", mapId? }
  GET /api/weather       → { effect, cloudCoverage, temperature, summary, ... }
  static → main.html, js/, css/

main.html
  #map-container         → Map3DElement (gmp-map-3d)
  #atmosphere-tint       → day/night CSS gradient overlay
  #atmosphere-canvas     → clouds, rain, snow particles
  #controls              → UI panel

js/ (ES modules, entry: bootstrap.js)
  bootstrap.js   → load Maps API, init app
  map3d.js       → Map3DElement, flyCameraTo, flyCameraAround, resetView
  geocoder.js    → google.maps.Geocoder address search
  markers.js     → Marker3DElement for search results
  atmosphere.js  → time tint, clouds, rain/snow; setWeather, applyCloudCoverage
  weather.js     → live weather sync, matchRealWeather toggle
  ui.js          → control wiring, errors, loading
  state.js       → shared app state
```

**Design rules:**

- Map navigation is handled by `Map3DElement` only — do **not** reintroduce OrbitControls or a geo-synced Three.js scene on top of the map.
- Atmosphere effects stay **screen-space** so map gestures are never blocked.
- `Map3DElement` **requires** `mode: "HYBRID"` or `"SATELLITE"` or the map spins forever.
- API keys stay server-side; browser loads key via `/api/maps-config`.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_MAPS_API_KEY` | Yes | Maps JavaScript + Geocoding (browser, via maps-config) |
| `PORT` | No | Default `3000` |
| `GOOGLE_MAP_ID` | No | Optional cloud map style |

**Google Cloud APIs to enable:** Maps JavaScript API, Geocoding API, Map Tiles API (for photorealistic 3D).

**Local referrer restrictions:** `http://localhost:3000/*`, `http://127.0.0.1:3000/*`

See [`.env.example`](.env.example).

---

## Testing

- Smoke tests: [`tests/smoke.test.js`](tests/smoke.test.js) — run `npm test` with server up.
- Manual checklist: see [`README.md`](README.md#manual-test-checklist).

---

## Roadmap (planned, not yet built)

Prioritized ideas from project planning. Move items to **Progress log** when done.

- [ ] Shareable URL hash for camera state (`lat,lng,range,tilt,heading,mode`)
- [ ] Bookmarks sidebar (localStorage or `/api/bookmarks`)
- [ ] Preset cinematic tours (`js/tours.js`)
- [ ] Places API details panel after search
- [ ] 3D overlays: `Polyline3DElement`, `Polygon3DElement` (`js/overlays3d.js`)
- [ ] AI location guide (`/api/describe-location`, LLM) — deferred; needs `OPENAI_API_KEY` or similar
- [ ] Production deploy (Vercel/Railway), PWA, embed mode

---

## System notes

Facts agents should know; append here when you discover something important.

- **Maps API channel:** Must load with `v=beta` and `importLibrary("maps3d")` for `Map3DElement`.
- **EEA limitation:** Photorealistic 3D tiles may be unavailable in the European Economic Area.
- **Weather mapping:** `/api/weather` maps Open-Meteo WMO codes → `rain` | `snow` | `clear`; 5-minute server cache keyed by lat/lng (2 decimals).
- **Live vs manual weather:** `state.matchRealWeather` in [`js/state.js`](js/state.js); toggling manual weather or cloud slider disables live mode.
- **Legacy removed:** Old `js/app.js` (2D map + Three.js OrbitControls) was replaced by the modular `js/` layout — do not restore that pattern.
- **Secrets:** `*.json` service accounts are gitignored; never use or commit `pwsmain-*.json`.

---

## Progress log

Newest entries first. **Agents: append here when you finish a task.**

### 2026-05-31 — README promo + demo assets

- Added `docs/demo.gif` and `docs/demo-poster.png` (captured from local app via `scripts/capture-demo.mjs`).
- Rewrote `README.md`: hero animation, badges, beginner step-by-step Google API key guide.
- **Verify:** view README on GitHub; GIF loads from `docs/demo.gif`.

### 2026-05-31 — GitHub repository files

- Added `LICENSE` (MIT), `SECURITY.md`, `CONTRIBUTING.md`, `.gitattributes`.
- Added `.github/workflows/ci.yml`, PR template, issue templates.
- Hardened `.gitignore`: blocks `.env`, `.env.*` (keeps `.env.example`), credential JSON patterns; removed blanket `*.json` that blocked `package.json`.
- README: publishing-to-GitHub section.
- **Verify:** `git check-ignore -v .env` and `git check-ignore -v pwsmain-4b81b178d286.json`.

### 2026-05-31 — Real Weather Sync

- Added `GET /api/weather` (Open-Meteo proxy) in [`server.js`](server.js).
- Added [`js/weather.js`](js/weather.js): match-real-weather toggle, debounced refetch on map pan.
- UI: checkbox + live status in [`main.html`](main.html); manual weather/cloud disabled when live mode on.
- Extended [`js/atmosphere.js`](js/atmosphere.js) with `applyCloudCoverage`; [`js/state.js`](js/state.js) with `matchRealWeather`.
- Smoke test + README updated.
- **Verify:** toggle "Match real weather", pan map, run `npm test`, curl `/api/weather?lat=40.71&lng=-74.00`.

### 2026-05-31 — v1 3D Maps Explorer (initial completion)

- Replaced 2D `google.maps.Map` + Three.js overlay with `Map3DElement`.
- Modularized into `js/bootstrap.js`, `map3d.js`, `geocoder.js`, `markers.js`, `atmosphere.js`, `ui.js`, `state.js`.
- Server: `/api/maps-config`, `/api/health`; atmosphere via Canvas 2D.
- **Verify:** open http://localhost:3000, search a landmark, test camera and weather controls.

---

## Code conventions

- ES modules in `js/`; no bundler — keep imports explicit.
- Match existing style: minimal scope, no over-abstraction, no unrelated refactors.
- Prefer extending existing modules over new parallel systems.
- Update `README.md` for user-visible features; update **this file** for agent handoff and progress.
