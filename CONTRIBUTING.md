# Contributing

Thanks for your interest in the 3D Google Maps Explorer.

## Before you start

1. Read [`AGENTS.md`](AGENTS.md) for architecture, conventions, and progress log expectations.
2. Read [`README.md`](README.md) for setup (`cp .env.example .env`, enable Google Maps APIs).
3. Never commit `.env`, API keys, or service account JSON files.

## Development

```bash
npm install
cp .env.example .env   # add your GOOGLE_MAPS_API_KEY
npm run dev            # or npm start
npm test               # smoke tests (server must be running)
```

## Pull requests

- Keep changes focused; match existing module layout under `js/`.
- Update [`README.md`](README.md) for user-visible changes.
- Update [`AGENTS.md`](AGENTS.md) progress log and system notes when behavior or architecture changes.
- Run `npm test` before opening a PR.

## Code style

- ES modules in `js/`; minimal scope; no unrelated refactors
- Atmosphere stays screen-space; map navigation stays on `Map3DElement`
- Do not reintroduce Three.js OrbitControls or geo-synced overlays
