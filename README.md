# 3D Google Maps Explorer

A web application that explores the world with **Google Maps native 3D** (`Map3DElement`), photorealistic buildings where available, and screen-space atmosphere effects (time of day, clouds, rain, snow).

## Features

- Photorealistic **3D map** with tilt, heading, and range camera controls
- **Location search** with cinematic fly-to and native 3D markers
- **Match real weather** — live rain/snow/clear and cloud cover from [Open-Meteo](https://open-meteo.com/) (no extra API key)
- Dynamic **time of day** tint on the map view
- Adjustable **cloud coverage** and **weather** (rain, snow)
- **Orbit location** camera animation
- Express server keeps the API key in `.env`, not in HTML

## Setup

1. **Create a Google Maps API key** in [Google Cloud Console](https://console.cloud.google.com/):
   - Create or select a project.
   - Enable **Maps JavaScript API**, **Geocoding API**, and **Map Tiles API**.
   - Create credentials → API key.
   - For local development, set HTTP referrer restrictions to `http://localhost:3000/*` and `http://127.0.0.1:3000/*`.

2. **Configure the server**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `GOOGLE_MAPS_API_KEY` to your key.

3. **Install and run**:
   ```bash
   npm install
   npm start
   ```

4. Open **http://localhost:3000**.

For development with auto-reload:

```bash
npm run dev
```

## Usage

### Navigation

- **Drag** to orbit the 3D view
- **Scroll** to zoom (changes camera range)
- **Shift + drag** or two-finger gestures for additional control (platform-dependent)

### Controls

| Control | Action |
|---------|--------|
| Search | Geocode an address and fly the camera there |
| Map Mode | Switch HYBRID (labels + imagery) / SATELLITE |
| Tilt / Heading / Range | Adjust the 3D camera |
| Orbit Location | Orbit the camera around the current center |
| Reset View | Return to default New York view |
| Time of Day | Change lighting tint (0–24 hours) |
| Cloud Coverage | Adjust screen-space clouds |
| Match real weather | Sync rain/snow/clear and clouds to live conditions at map center (Open-Meteo) |
| Weather | Toggle rain, snow, or clear manually |

## Architecture

```text
Express (server.js)
  └── GET /api/maps-config  → apiKey, mapsVersion: beta
  └── GET /api/health

Browser (main.html + js/)
  └── bootstrap.js          → load Maps JS (v=beta), init app
  └── map3d.js              → Map3DElement lifecycle, flyCameraTo
  └── geocoder.js           → address search
  └── markers.js            → Marker3DElement for search results
  └── atmosphere.js         → screen-space tint, clouds, weather (Canvas 2D)
  └── weather.js            → live weather sync via /api/weather (Open-Meteo)
  └── ui.js                 → control panel wiring
```

The 3D map is rendered by Google's `Map3DElement`. Atmosphere effects are a non-interactive overlay (`pointer-events: none`) so map gestures always work.

## Manual test checklist

- [ ] App opens to a tilted 3D view of New York
- [ ] Drag and scroll navigate smoothly (no overlay blocking input)
- [ ] Search "Golden Gate Bridge" flies camera and shows a marker
- [ ] Time slider changes map tint
- [ ] Cloud/rain/snow toggles work without blocking the map
- [ ] Map mode switches HYBRID ↔ SATELLITE
- [ ] **Match real weather** toggle updates effects for current map center
- [ ] `/api/weather?lat=40.71&lng=-74.00` returns `{ effect, cloudCoverage }`
- [ ] `/api/maps-config` returns `{ apiKey, mapsVersion: "beta" }`

Run automated smoke checks:

```bash
npm test
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Infinite loading spinner | Ensure `Map3DElement` has `mode` set to `HYBRID` or `SATELLITE` |
| `gm_authFailure` | Check API key, enable Maps JavaScript API, add `http://localhost:3000/*` to referrer restrictions |
| No 3D buildings | Enable **Map Tiles API**; photorealistic 3D may be unavailable in the EEA |
| Geocoding fails | Enable **Geocoding API** on the same Cloud project |
| 503 on `/api/maps-config` | Copy `.env.example` to `.env` and set a real `GOOGLE_MAPS_API_KEY` |

## Security

1. Restrict your API key in Google Cloud (HTTP referrers for browser keys).
2. Keep `.env` out of version control (listed in `.gitignore`).
3. Use HTTPS in production.

## Requirements

- Node.js 18+ and npm
- Modern browser with WebGL support
- Internet connection for map tiles

## License

MIT License — see [LICENSE](LICENSE).

## Publishing to GitHub

1. Initialize git (if needed): `git init`
2. Confirm secrets are ignored: `git check-ignore -v .env` (should match `.gitignore`)
3. Stage and commit — **never** add `.env` or `pwsmain-*.json`
4. Create a repo on GitHub and push:

```bash
git add .
git status   # verify .env and node_modules are not listed
git commit -m "Initial commit: 3D Google Maps Explorer"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

Set `GOOGLE_MAPS_API_KEY` in your deployment platform or locally via `.env` (not in the repository).
