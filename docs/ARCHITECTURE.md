# Snobify Architecture (v0.2a)
- Monorepo: app/ (UI), server/ (API), common/ (types), scripts/, profiles/, cache/.
- Debug-first: zod-validated config/CSV, structured logs, typed errors, /health /metrics /debug.
- Random by default; exports seeded by <profile+hash> for PDF stability.
- AI off by default; *hard* $1/day cap when enabled.
See full design notes in your canvas doc. This file exists to keep the repo self-explanatory.
