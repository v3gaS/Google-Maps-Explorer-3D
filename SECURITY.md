# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| main    | Yes       |

## Reporting a vulnerability

If you discover a security issue, **do not** open a public GitHub issue.

Please report it privately by emailing the repository maintainer or using GitHub **Private vulnerability reporting** (if enabled on the repo).

Include:

- Description of the issue
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to acknowledge reports within 7 days.

## Secrets and credentials

**Never commit:**

- `.env` or any file containing API keys
- Google Cloud service account JSON files
- Private keys or certificates

This repository uses `.gitignore` to block common secret paths. If you accidentally commit a secret:

1. Rotate the exposed key immediately in Google Cloud Console
2. Remove the secret from git history (e.g. `git filter-repo` or BFG)
3. Force-push only after coordinating with collaborators

## API keys

- `GOOGLE_MAPS_API_KEY` must be restricted (HTTP referrers in production, localhost for dev)
- Do not embed keys in client-side HTML; this project serves keys via `/api/maps-config` from server env only
- Open-Meteo weather requests are proxied server-side; no weather API key is required
