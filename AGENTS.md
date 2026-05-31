# AGENTS.md

Guide for contributors and AI coding assistants working on **3D Google Maps Explorer**.

Repository: [github.com/v3gaS/Google-Maps-Explorer-3D](https://github.com/v3gaS/Google-Maps-Explorer-3D)

---

## Project summary

A browser app that explores the world using Google Maps **native 3D** (`Map3DElement`), with screen-space atmosphere effects (time of day, clouds, rain, snow), location search, and optional live weather sync.

| Layer | Technology |
|-------|------------|
| Server | Node.js 18+, Express |
| Map | Google Maps JavaScript API (`v=beta`, `maps3d`) |
| Atmosphere | Canvas 2D overlay (`pointer-events: none`) |
| Weather | Open-Meteo via `/api/weather` (no extra API key) |
| Config | `.env` (see [`.env.example`](.env.example)) |

---

## Quick start

```bash
npm install
cp .env.example .env    # add GOOGLE_MAPS_API_KEY
npm start               # http://localhost:3000
npm test                # smoke tests (server must be running)
npm run dev             # nodemon
```

User setup and API key instructions: [`README.md`](README.md)

---

## Repository layout

```text
server.js                 Express entry point
server/
  config.js               Environment and constants
  weatherService.js       Open-Meteo proxy and WMO mapping

js/
  bootstrap.js            Client entry point
  constants.js            Shared defaults and timing
  map3d.js                Map3DElement and camera animations
  geocoder.js             Address search
  markers.js              Search result markers
  atmosphere.js           Day/night tint, clouds, rain, snow
  weather.js              Live weather sync
  ui.js                   Control panel wiring
  state.js                Shared application state
  utils/format.js         Display helpers

main.html                 App shell
css/style.css             Styles
tests/smoke.test.js       HTTP smoke tests
scripts/capture-demo.mjs  README promo recording
docs/demo.gif             README promotional animation
```

---

## Architecture rules

These constraints keep the app stable. Please preserve them when making changes.

1. **Map navigation** — Use `Map3DElement` only. Do not add OrbitControls, Three.js geo overlays, or a separate 2D `google.maps.Map`.
2. **Atmosphere** — Keep effects screen-space on `#atmosphere-canvas` so map gestures are never blocked.
3. **Map mode** — `Map3DElement` requires `mode: "HYBRID"` or `"SATELLITE"` or the map will not render.
4. **API keys** — Never commit secrets. The browser loads the key from `/api/maps-config`; keep keys in `.env` only.
5. **Modules** — ES modules in `js/`, no bundler. Extend existing files before adding new abstractions.

---

## API routes

| Route | Purpose |
|-------|---------|
| `GET /api/health` | Health check |
| `GET /api/maps-config` | `{ apiKey, mapsVersion, mapId? }` |
| `GET /api/weather?lat=&lng=` | Live weather for map center |

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_MAPS_API_KEY` | Yes | Maps JavaScript + Geocoding |
| `PORT` | No | Default `3000` |
| `GOOGLE_MAP_ID` | No | Optional cloud map style |

**Google Cloud APIs:** Maps JavaScript API, Geocoding API, Map Tiles API.

**Local referrer restrictions:** `http://localhost:3000/*`, `http://127.0.0.1:3000/*`

---

## Development notes

- Maps JS must load on the **`beta`** channel with `importLibrary("maps3d")`.
- Photorealistic 3D may be unavailable in the **EEA**.
- Live weather uses Open-Meteo WMO codes mapped to `clear`, `rain`, or `snow` (5-minute server cache).
- Manual weather or cloud controls disable **Match real weather** mode.

---

## Testing

```bash
npm start    # terminal 1
npm test     # terminal 2
```

See [`README.md`](README.md) for the manual test checklist.

Promo GIF capture:

```bash
npm run capture-demo
```

GIF is trimmed from the 15s mark by default (`GIF_START_SEC` to override).

---

## Contributing

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`SECURITY.md`](SECURITY.md).
- Keep changes focused; match existing naming and module structure.
- Update [`README.md`](README.md) for user-visible changes.
- Do not commit `.env`, API keys, or credential JSON files.

---

## Planned enhancements

- Shareable camera URLs (hash-based state)
- Saved bookmarks and preset tours
- Places API details panel
- 3D overlays (`Polyline3DElement`, `Polygon3DElement`)
- Optional AI location guide (future)

---

## License

MIT — see [LICENSE](LICENSE).
