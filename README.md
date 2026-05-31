<p align="center">
  <img src="docs/demo.gif" alt="3D Maps Explorer demo — search landmarks, fly the camera, match live weather" width="720">
</p>

<h1 align="center">3D Google Maps Explorer</h1>

<p align="center">
  Fly through photorealistic 3D cities in your browser.<br>
  Search anywhere on Earth, sync live weather, and play with time-of-day atmosphere — powered by Google Maps.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D18-green.svg" alt="Node 18+"></a>
</p>

---

## What is this?

A **free, open-source** web app for exploring the world in **native Google Maps 3D** — tilted satellite views, photorealistic buildings (where available), cinematic fly-to search, and screen-space weather effects (rain, snow, clouds, day/night).

No game engine required. Just Node.js, a Google Maps API key, and a browser.

## Features

- Photorealistic **3D map** with tilt, heading, and range camera controls
- **Location search** with cinematic fly-to and native 3D markers
- **Match real weather** — live rain/snow/clear from [Open-Meteo](https://open-meteo.com/) (no extra API key)
- Dynamic **time of day** tint, adjustable **clouds**, and manual **rain/snow**
- **Orbit location** camera animation
- API key stays in `.env` on the server — never hard-coded in HTML

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/v3gaS/Google-Maps-Explorer-3D.git
cd Google-Maps-Explorer-3D
npm install
```

### 2. Get a free Google Maps API key (beginner guide)

Google gives every new Cloud account **$200/month in free Maps credit** — more than enough for personal learning and local development. You will need a credit/debit card to verify your account, but you stay in the free tier unless you exceed those credits.

#### Step A — Create a Google Cloud account

1. Go to **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Sign in with any Google account.
3. Accept the terms if prompted. New users get a **free trial** with credits.

#### Step B — Create a project

1. Click the **project dropdown** at the top (next to “Google Cloud”).
2. Click **New Project**.
3. Name it something like `maps-3d-explorer` → **Create**.
4. Make sure that project is **selected** in the dropdown.

#### Step C — Enable billing (required, but free tier applies)

1. Go to **[Billing](https://console.cloud.google.com/billing)**.
2. Link a billing account if asked. Google uses this for verification; normal hobby use on localhost stays within free credits.

#### Step D — Enable the APIs this app uses

1. Open **[APIs & Services → Library](https://console.cloud.google.com/apis/library)**.
2. Search and **Enable** each of these (one at a time):

   | API | Why you need it |
   |-----|-----------------|
   | **Maps JavaScript API** | Renders the 3D map in the browser |
   | **Geocoding API** | Powers the location search box |
   | **Map Tiles API** | Photorealistic 3D buildings where available |

#### Step E — Create an API key

1. Go to **[APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)**.
2. Click **+ Create credentials** → **API key**.
3. Copy the key (starts with `AIza…`). Keep it private — treat it like a password.

#### Step F — Restrict the key (recommended)

1. Click your new key to edit it.
2. Under **Application restrictions** → **Websites**.
3. Add these referrers for local development:

   ```
   http://localhost:3000/*
   http://127.0.0.1:3000/*
   ```

4. Under **API restrictions** → **Restrict key** → select only the three APIs above.
5. **Save**.

> **Tip for newer coders:** Never paste your API key into GitHub, Discord, or screenshots. This project reads it from a `.env` file that is gitignored.

### 3. Configure the app

```bash
cp .env.example .env
```

Open `.env` and paste your key:

```env
GOOGLE_MAPS_API_KEY=AIzaSy...your_key_here
PORT=3000
```

### 4. Run

```bash
npm start
```

Open **[http://localhost:3000](http://localhost:3000)** — you should see a tilted 3D view of New York City.

Development with auto-reload:

```bash
npm run dev
```

---

## Usage

### Navigation

- **Drag** to orbit the 3D view
- **Scroll** to zoom (changes camera range)
- **Shift + drag** or two-finger gestures for extra control (varies by device)

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
| Match real weather | Sync rain/snow/clear to live conditions at map center |
| Weather | Toggle rain, snow, or clear manually |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Infinite loading spinner | `Map3DElement` needs `mode` set to `HYBRID` or `SATELLITE` (already configured in this repo) |
| `gm_authFailure` or blank map | Check API key in `.env`, enable **Maps JavaScript API**, add `http://localhost:3000/*` to referrer restrictions |
| `503` on `/api/maps-config` | Copy `.env.example` → `.env` and set a real key; restart the server |
| Geocoding / search fails | Enable **Geocoding API** on the same Cloud project |
| No 3D buildings | Enable **Map Tiles API**; photorealistic 3D may be unavailable in the EEA |
| “Billing not enabled” in Google Cloud | Link a billing account — free credits still apply for learning |

---

## Development

```bash
npm test   # smoke tests — server must be running
```

See [`AGENTS.md`](AGENTS.md) for architecture notes and [`CONTRIBUTING.md`](CONTRIBUTING.md) for pull request guidelines.

### Architecture (short)

```text
server.js + server/     → config, weatherService, API routes
js/constants.js         → shared defaults
js/                     → Map3DElement, atmosphere, weather, UI modules
```

---

## Security

- Restrict your API key in Google Cloud (HTTP referrers for browser keys).
- Never commit `.env` or service account JSON (already in `.gitignore`).
- Use HTTPS in production.

## Requirements

- Node.js 18+ and npm
- Modern browser with WebGL
- Internet connection for map tiles

## License

MIT — see [LICENSE](LICENSE).

## Contributing

Pull requests welcome! Read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md) first.
