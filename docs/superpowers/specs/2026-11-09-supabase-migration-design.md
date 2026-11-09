# Supabase Migration Design

**Date:** 2026-11-09
**Status:** Approved
**Replaces:** json-server mock backend (`server.js`, `db.json`)

## Goal

Replace the local json-server mock with Supabase (Postgres + PostgREST + Realtime) so the app runs correctly on Vercel and any other deployed environment, with zero changes to components and minimal changes to composables.

## Context

- The app was deployed to Vercel (`https://erp-kitchen-five.vercel.app/`) but the dashboard is dead: Vercel serves only static frontend; `json-server` + `db.json` + Socket.IO run nowhere. The browser tries `http://localhost:3001` (the `VITE_WS_URL` default) from an HTTPS page, causing the "permission" prompt and failed requests.
- All HTTP traffic already funnels through `src/api/client.ts` (the `ApiClient` interface in `src/types/api.ts`); no component imports axios.
- All realtime traffic funnels through `src/composables/useSocket.ts` with a `socket.on('order:update', …)` / `socket.off(…)` contract consumed by exactly two composables: `useOrderFeed` (KDS) and `useCustomerOrders` (customer portal).

## Decisions (confirmed with user)

1. **Supabase everywhere** — local dev and prod both hit the same Supabase project. No dual backend, no local Supabase CLI/Docker.
2. **Keep string primary keys** from `db.json` (`ing-001`, `ord-…`); `customers` keeps integer IDs (frontend types use `id: number`). No UUIDs.
3. **Open anon access** — RLS enabled with permissive `USING (true)` / `WITH CHECK (true)` policies for `anon` on all tables. Same zero-auth posture as json-server. Auth is a later migration.
4. **Delete the old backend** — `server.js`, `db.json`, `json-server` dependency, `/api` Vite proxy, `npm run server` script all go away.

## Approach

**Adapter-at-the-boundaries** (chosen over a Supabase-native rewrite or axios→PostgREST):

- Rewrite the *internals* of `src/api/client.ts` to use `@supabase/supabase-js`. The exported `api` object and `ApiClient` interface stay byte-identical.
- Rewrite the *internals* of `src/composables/useSocket.ts` to subscribe to Supabase Realtime and expose the same `{ socket: { on, off }, connected, error }` contract, translating rows into the existing `OrderUpdatePayload` shape (`{ id, status, orderNumber, customerId }`).

Rejected alternatives:

- **Supabase-native rewrite** — drop `ApiClient`, call `supabase.from()` in every composable. Touches all tested code, breaks the documented "all API calls go through client.ts" pattern, no behavioral gain.
- **Keep axios → PostgREST** — manual apikey headers, PostgREST query syntax (`?status=eq.pending`), mismatched error shapes. Worst of both worlds.

## 1. Data layer

### Schema (8 tables, `public` schema)

| Table | PK | Notable columns |
|-------|-----|-----------------|
| `ingredients` | `text` (`ing-001`) | `unit`, `currentStock`, `reorderLevel`, `reorderQty`, `unitCost`, `supplier`, `category`, `isLowStock` bool, `updatedAt`, `lastAdjustReason?`, `lastAdjustedAt?` |
| `menu_items` | `text` | `name`, `brandId`, `brandName`, `price`, `category`, `isActive`, `popularity` |
| `recipes` | `text` | `menuItemId` text, `ingredients` **jsonb** (`[{ingredientId, quantity}]`), `servings`, `version` |
| `orders` | `text` | `orderNumber` int **unique**, `source`, `customerName`, `customerId?` int → customers, `phone?`, `items` **jsonb**, `totalAmount`, `status` text + CHECK (`pending`\|`preparing`\|`ready`\|`dispatched`\|`cancelled`), `brandId`, `timestamps` **jsonb** (`{placedAt, startedAt, readyAt, dispatchedAt}`), `prepTimeTarget`, `updatedAt` |
| `brands` | `text` | `name`, `color` |
| `customers` | `integer` identity | `name`, `phone`, `email` (matches frontend `id: number`) |
| `analytics_sales` | `text` | `date`, `totalRevenue`, `orderCount`, `itemsSold` **jsonb** |
| `wastage_logs` | `text` | `date`, `ingredientId`, `quantity`, `unit`, `reason` |

**Column names match frontend field names exactly** (camelCase: `currentStock`, `orderNumber`, `isLowStock`, …) so Supabase returns rows the TypeScript types already describe with zero mapping. All camelCase identifiers are double-quoted in every migration, seed, and query so Postgres does not fold them to lowercase.

### Security

- RLS **enabled** on all 8 tables.
- Permissive policy for role `anon` on each table: `USING (true)` and `WITH CHECK (true)`.
- All 8 tables added to the `supabase_realtime` publication (required for `postgres_changes`).

### `src/api/client.ts`

- Same exported `api` object, same method signatures as `ApiClient`.
- Internals use `@supabase/supabase-js`:
  - Reads: `.select().eq('id', id)` / `.select()` with filters
  - Writes: `.insert()` / `.update()` / `.delete().eq('id', id)`
  - List filters map current params: `search` → `.ilike('name', %…%)`, `unit`/`status`/`customerId`/`orderNumber`/`menuItemId` → `.eq(...)`
- `adjustStock` keeps its read-then-patch logic (no DB function; YAGNI).
- `recipes.upsert` keeps get-by-`menuItemId` → patch-or-insert logic.
- Supabase returns `{ data, error }`; `client.ts` **throws on `error`** so every existing `.catch()` and Vue Query error state keeps working. No Supabase error object leaks past the boundary.

### Seed

- One-time script (run manually) reads `db.json` and bulk-inserts all rows **preserving string IDs** and nested JSON as-is.
- Verification: row counts must match seed — ingredients 25, menu_items 12, recipes 12, orders 15, brands 3, customers 10, analytics_sales 6, wastage_logs 4.
- After successful seed + verification, `db.json` is deleted.

## 2. Realtime layer

### `src/composables/useSocket.ts`

Public contract unchanged:

```
useSocket() → { socket: { on, off }, connected: Ref<boolean>, error: Ref<string|null> }
```

Internals:

- Singleton channel: `supabase.channel('orders-feed')` subscribed once, refcounted like today (last consumer unmount disconnects).
- Subscription: `.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handler)`.
- `handler` maps the Supabase payload → existing shape:
  ```
  { id: new.id, status: new.status, orderNumber: new.orderNumber, customerId: new.customerId }
  ```
  then dispatches to local listeners registered under `'order:update'`.
- `on(event, fn)` / `off(event, fn)` = in-memory listener registry (no Socket.IO).
- `connected` ← channel `SUBSCRIBED`; `error` ← `CHANNEL_ERROR` / `TIMED_OUT`.
- INSERT events fire too, so KDS "new order not in cache → `api.orders.get` fallback" logic in `useOrderFeed` keeps working unchanged.

### Consumers (unchanged)

- `useOrderFeed` — `socket.on('order:update', …)` + cache patch + fetch-fallback
- `useCustomerOrders` (both `useCustomerOrders` and `useOrderTracking`) — same pattern

### Environment

- New: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (in `.env` / `.env.example` / Vercel project settings).
- Removed: `VITE_WS_URL`.
- Browser talks to Supabase directly over HTTPS — no Vite proxy, no `ws://localhost` from an HTTPS page (fixes the permission prompt).
- Local dev env file points at the same Supabase project ("Supabase everywhere").

## 3. Migration, cleanup, error handling, testing

### Migration sequence

1. Create Supabase project; capture URL + anon key.
2. Run schema SQL (tables with quoted camelCase identifiers, CHECK constraints, FKs, RLS policies, realtime publication) — via Supabase SQL editor or MCP.
3. Run seed from `db.json`; verify 8 row counts.
4. Swap internals of `client.ts` and `useSocket.ts`.
5. Update `.env.example` and docs; set Vercel env vars.
6. Delete `server.js`, `db.json`, `json-server` dep; remove `/api` proxy from `vite.config.ts`; remove `npm run server`; `npm start` becomes `vite` (or drop in favor of `npm run dev`).
7. Verify: `npm run build && npm test && npm run lint`, then manual smoke test locally and on Vercel redeploy.

### Error handling

- `client.ts` converts Supabase `{ error }` → thrown `Error` (message from `error.message`). Vue Query error states and existing `.catch()` blocks behave as before.
- Realtime: `error` ref surfaces channel failures; consumers already ignore it for logic (they only destructure `connected`/`error` for display).

### Testing

- `src/api/client.test.ts` — rewrite mocks from axios to the Supabase client; keep the same behavioral assertions (methods map to correct table operations).
- All other tests (composables/components, 29+) — untouched; they mock `api.*` or never touch HTTP.
- Manual verification of seed row counts is sufficient; no automated seed test for MVP.

### Out of scope

- Auth / login / RLS narrowing (later migration; policies stay permissive).
- Schema changes beyond what `db.json` already models.
- Realtime for any table other than `orders`.
- Neon, dual-backend fallback, Supabase local CLI.

### Risks

- **Free-tier project pause** after ~1 week inactivity — accept manual wake-up or a trivial keep-alive; not automated in this migration.
- **Realtime publication** — easy to forget when creating tables by hand; schema SQL includes it explicitly.
- **Quoted camelCase identifiers** — every migration/seed/query must quote them consistently or Postgres folds to lowercase and breaks field-name parity.
- **String PKs** — `.eq('id', …)` must match seeded IDs exactly.

## Success criteria

- App fully functional at the Vercel URL: dashboard loads, KDS updates in real time across two browser tabs, all five modules work.
- Zero diffs in `src/modules/**` and `src/components/**`.
- `npm run build`, `npm test` (31 passing), `npm run lint` all green.
- `server.js`, `db.json`, and `json-server` are gone from the repo.
