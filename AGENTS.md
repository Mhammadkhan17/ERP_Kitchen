# Agent notes

- Read `docs/ONBOARDING.md` first (conventions, architecture, add-a-feature checklist).
- Current stack: Vue 3 + TS + PrimeVue + Vue Query + Socket.IO; mock backend = json-server (`server.js`, `db.json`).
- Never import Axios in components — only `src/api/client.ts`. Never fetch in components — use module composables.
- Verification before claiming done: `npm run build` (type-check), `npm test`, `npm run lint`.
- Stale historical docs live in `docs/legacy/` — ignore them for current behavior.
