---
VOTE: Solution B
SCORES:
  Solution A: 3.95/5.0
  Solution B: 4.45/5.0
  Solution C: 4.12/5.0
CRITERIA:
 - architectural_integrity: 3.0/5.0
 - requirements_completeness: 5.0/5.0
 - real_time_implementation: 3.5/5.0
 - code_structure_specificity: 4.5/5.0
 - error_handling_robustness: 4.5/5.0
 - ui_ux_quality: 3.5/5.0
 - testability_and_maintainability: 3.0/5.0
---

# Comparative Evaluation: Customer-Facing Live Order Tracking

## 1. Comparative Analysis

### Architectural Integrity & Pattern Conformance

| Solution | Score | Evidence |
|----------|-------|----------|
| **A** | 3.0/5.0 | **Critical failure**: Claims to use TanStack Vue Query with keys `['orders', 'tracking', <id>]` in the concern resolution (Section 2, line 18) but the actual composable (`useCustomerOrders.ts`, lines 190–431) uses raw `ref<Map<string, Order>>` — zero Vue Query integration. The composable creates its own WS singleton (`let singletonSocket` at line 200) independent of `useOrderFeed.ts`, so two WS connections exist when both KDS and tracking pages are open. The solution acknowledges this (lines 1348–1351) but does not explain why the singleton pattern from `useOrderFeed.ts` was not reused. Does extend `api/client.ts` by modifying `orders.list()` to accept optional params (lines 109–118). Follows module directory structure (`modules/tracking/`). Creates `PublicLayout.vue` — clean separation from AppLayout. |
| **B** | 4.5/5.0 | **Best in class**. Extracts a shared `useSocket.ts` singleton (lines 198–272) with reference counting, then refactors `useOrderFeed.ts` to consume it with an identical public API (`{ connected, error }`) — zero regression risk for KDS. Uses TanStack Vue Query correctly throughout (`useOrderTracker.ts` lines 404–453). Extends `api/client.ts` with both new methods and modified signatures. Follows module structure. Creates a Pinia store (`useCustomerStore.ts`) — minor deviation from composable preference but justified for cross-route identity sharing. Works within auth-less constraint with explicit "Demo" labels throughout. Routes are siblings (not under AppLayout), preserving `'/'` → `'/kds'` redirect. Includes AppDrawer/AppHeader conditional nav links. |
| **C** | 3.5/5.0 | Creates a **second** Socket.IO singleton (`useCustomerFeed.ts` lines 249–372) independent from `useOrderFeed.ts`. The justification (lines 37–42: "they do not share state or conflict") is reasonable but the eval spec notes this is acceptable only with strong justification — and the solution's justification is thin: room-based events could coexist on a shared connection. Uses TanStack Vue Query correctly. Extends `api/client.ts` with `getByNumber` and `getByPhone`. Module name uses `customer` instead of `tracking` — minor naming deviation. Routes are clean siblings. Server.js changes are heavier than other solutions. |

### Requirements Completeness

| Solution | Score | Evidence |
|----------|-------|----------|
| **A** | 5.0/5.0 | Both features fully covered with all states explicitly described. Guest tracking: input validation (line 867: "Please enter a valid order number"), loading skeleton (lines 752–758), found view with items/timestamps/totals (lines 761–827), not-found error (line 270: "Order #N not found"), network error (line 283 with err message), cancelled state with red banner (lines 810–816), dispatched/completed displays in StatusTimeline. Customer portal: identity selection via dropdown (lines 958–989), order list (lines 1036–1041), empty state with CTA (lines 1021–1033), error state with retry (lines 1081–1090), expand/collapse detail (lines 1044–1078), live WS updates (line 392). Comprehensive error matrix in Section 6 (lines 1266–1280) covering 13 edge cases. |
| **B** | 4.5/5.0 | Both features covered. Guest: input validation, PIN gate, loading, found view, not-found, network error, real-time (TrackOrder.vue lines 565–823). Portal: registration, order list, empty state, error state, expand/collapse (CustomerOrders.vue lines 993–1131). Extra registration flow (`CustomerRegister.vue`) goes beyond requirements. **Minor gap**: The empty state on portal shows "No orders yet" but does not clearly differentiate between "no orders loaded yet" and "loaded but zero orders found". Terminal states are handled but cancelled orders receive less visual distinction than Solution A's red banner. |
| **C** | 4.0/5.0 | Both features covered. Guest: input validation, loading, found view, not-found, network error, room-based real-time (OrderTracking.vue lines 537–741). Portal: phone entry, order list, empty state, error state, expand/collapse (CustomerPortal.vue lines 746–966). **Gaps**: No demo mode badge explaining the identity model. Guest tracking page has no offline/banner for WS disconnected state. Portal shows "Failed to load orders" basic error but no retry button on guest page. Terminal states handled in timeline component (lines 490–503: cancelled flow). No localStorage persistence restore on refresh. |

### Real-Time Implementation Correctness

| Solution | Score | Evidence |
|----------|-------|----------|
| **A** | 3.5/5.0 | Independent `socket.on('order:update')` listener (line 392). Client-side filtering by `trackedOrderNumbers.has(number)` — O(1) per event (line 240). Partial payload handling: merges status only into existing cached order via spread (lines 244–250). **Race condition gap**: if WS event arrives before the REST GET completes, `existing` is undefined so the update is silently dropped (line 243: `if (existing) { ... }`). No mechanism to recover these dropped events. Reconnection relies on Socket.IO defaults — no custom re-fetch of tracked orders after reconnect. Cleanup properly removes listener in `onUnmounted` (lines 394–396). No Vue Query cache integration — updates go to a raw `ref<Map>`, so no cache consistency with any TanStack Query consumers. |
| **B** | 4.0/5.0 | Shared socket via `useSocket.ts` — single connection. `useCustomerFeed.ts` uses a multi-listener pattern (`Set<Listener>`, lines 370–394) allowing multiple consumers to register handlers. `useOrderTracker` invalidates TanStack Query cache on matching WS event (lines 441–450: `queryClient.invalidateQueries({ queryKey })`) — this causes a full refetch, which is correct (gets full order) but less efficient than merge. Reconnection handled by Socket.IO defaults but no explicit re-fetch after reconnect (query invalidation is reactive, so the next read would refetch — however, if no component is observing the query, missed events during disconnect are lost). Cleanup via listener set removal. |
| **C** | 5.0/5.0 | **Best in class**. Room-scoped events via server-side Socket.IO rooms — only relevant events reach the client. Race condition mitigated by `order:sync` event after room join (server.js lines 182–188: reads current order from `router.db` and emits full state). Reconnection handled by `joinedRooms` `Set` — on reconnect, re-joins all rooms and receives fresh `order:sync` events (lines 279–283). Partial payloads handled via `setQueryData` with merge semantics (not full replace in list cache, lines 309–325). Backward compatible with KDS global broadcasts (global `io.emit` preserved, lines 220–228). Clean separation: customer WS composable is independent, no shared mutable state with KDS. |

### Code Structure & Technical Specificity

| Solution | Score | Evidence |
|----------|-------|----------|
| **A** | 4.5/5.0 | All 6 new files named with full project paths. Types added to `src/types/index.ts` (customerId, updatedAt — lines 77–92). Component interfaces defined (StatusTimeline props, OrderCardCompact props/emits). Composable has typed signature with explicit return type (lines 409–422). Route definitions complete with names and dynamic imports (lines 1191–1235). Dependency graph table (lines 54–68) is clear and acyclic. **Minor**: API type expansion (Section 4.2) defines `orders.list` params but doesn't show the full `src/types/api.ts` file — only the modified method. |
| **B** | 5.0/5.0 | All new/modified files named with full paths. Every type fully defined: `Customer`, `OrderUpdatePayload`, extended `Order` (lines 25–57). Component interfaces explicit. Composable signatures fully typed. Route definitions complete (lines 1137–1185). File inventory with dependency order (lines 176–191). Implementation build sequence (lines 1239–1253). No circular dependencies. Most comprehensive documentation of any solution. |
| **C** | 4.5/5.0 | All new files named with full paths. Types defined. Components have props defined. Composable signatures typed. Room constants file (`src/constants/rooms.ts`) — a nice maintainability touch. Route definitions complete. **Missing**: No explicit `types/api.ts` definitions for the new `getByNumber`/`getByPhone` methods (described inline in client.ts). Import graph is implicit (implementation order in Section 8, lines 1052–1065) but not as explicitly documented as A or B. |

### Error Handling & Robustness

| Solution | Score | Evidence |
|----------|-------|----------|
| **A** | 4.5/5.0 | Extensive error matrix (Section 6, lines 1266–1280) covering 13 scenarios. Invalid order number validation (line 867). Not-found handling (line 270). Network errors caught (line 282). WS disconnect: amber banner (lines 715–720). localStorage wrapped in try/catch in all persistence helpers (lines 334–364). Rate limiting via 2-second debounce (lines 221, 257–260). Cancelled order: red banner + timeline (lines 581, 594, 810–816). Listener cleanup on unmount (lines 394–396). **Missed**: Race condition between WS event and fetch (event arrives before fetch completes → dropped, line 243). No forced refetch on reconnect. |
| **B** | 4.0/5.0 | Invalid input validation. Not-found handling. Network errors caught. PIN verification errors. Registration validation (lines 954–958). **Missed**: No explicit offline/WS-disconnected banner in any view. No try/catch for localStorage operations (Pinia store reads localStorage directly at module-scope init, lines 329–331 — would throw in private browsing). No retry button in guest tracking page error state. |
| **C** | 4.0/5.0 | Invalid order number validation. Not-found handling. Network errors caught. WS reconnection with auto-rejoin and order:sync — best reconnection handling of all solutions. Race condition mitigation via order:sync. **Missed**: No offline/disconnected banner on guest tracking page. No try/catch for localStorage (line 921: `localStorage.getItem(STORAGE_KEY)` at module-scope — vulnerable). No demo mode labeling admitting the identity model's limitations. Guest page error state has no retry button. |

### UI/UX Quality & Existing Conventions

| Solution | Score | Evidence |
|----------|-------|----------|
| **A** | 3.5/5.0 | Uses PrimeVue components (InputText, Button, Tag, Divider, Select) with correct severity mapping. However, **ignores existing UnoCSS shortcuts**: uses custom `skeleton-loading` CSS class instead of existing `skeleton`, `skeleton-card`, `skeleton-text` shortcuts from `uno.config.ts`. Colors hardcoded as hex values (e.g., `#E85D3A`, `#2B9348`, `#E9ECEF`) instead of UnoCSS theme colors (`orange-600`, `green-600`, `gray-200`). The `card` class is used but `input`, `field`, `btn-primary` etc. are not. Offline banner matches KDS pattern. Demo mode badge in header (line 445). |
| **B** | 4.5/5.0 | **Best UI alignment**. Uses existing shortcuts: `card`, `input`, `field`, `skeleton-card`, `btn-primary`, `btn-ghost`. PrimeVue components with correct severity mapping. Demo mode Tag in portal header (line 1004). Offline state not explicitly shown (minor gap). Expand/collapse and registration UX flows are coherent. StatusTimeline uses hardcoded colors (lines 473–479) but follows the palette. Connection status shown as small text (CustomerOrders.vue lacks explicit indicator). |
| **C** | 3.5/5.0 | Uses existing UnoCSS shortcuts (`card`, `input`, `field`, `skeleton-card`, `btn-primary`, `btn-ghost`) — better than A. PrimeVue components correctly used. Severity mapping matches KDS pattern. TrackingTimeline handles cancelled state well. **Missing**: No demo mode badge or identity transparency label. WS connection indicator is minimal (small text "live/offline" — line 610 on guest, line 806 on portal). No banner explaining "this is a demo." Hardcoded colors in some components. |

### Testability & Maintainability

| Solution | Score | Evidence |
|----------|-------|----------|
| **A** | 3.0/5.0 | Composables own data logic; views are thin. WS isolated in composable. API calls go through `client.ts`. **Major issues**: Module-level mutable state (`singletonSocket`, `connected`, `lastLookupTime`, `trackedOrderNumbers` at lines 200–223) creates shared singletons that cause test interference. `lastLookupTime` (module scope, line 221) is shared across all `useCustomerOrders` instances — would cause spurious debounce hits. No Vue Query means no way to mock data fetching declaratively. Persistence helpers are embedded in composable rather than separated. |
| **B** | 4.5/5.0 | Clean separation: composables = data logic, views = layout. `useSocket` reference counting (lines 247–258) ensures proper lifecycle. Vue Query data fetching is easily mockable. API calls through `client.ts`. WS isolated in composables. Pinia store testable. **Minor concerns**: Module-level `registeredListeners` Set (line 370) could persist across tests. `CustomerOrders.vue` runs navigation during setup (lines 1106–1109) — side effect at module scope would cause test issues. Routes lazy-loaded. |
| **C** | 4.0/5.0 | Clean separation. Vue Query usage. WS isolated in composable. API calls through `client.ts`. Room constants file improves maintainability. **Minor**: `useCustomerFeed` captures `queryClient` inside `createSocket` closure (line 265) — couples socket lifecycle to a specific queryClient instance, making it harder to swap for testing. Module-level `joinedRooms` Set (line 263) is mutable and persists across test boundaries. Routes lazy-loaded. |

---

## 2. Vote Rationale

**Solution B is the best overall** with a weighted score of **4.45/5.0**.

The decisive advantage comes from **architectural integrity** — Solution B is the only solution that extracts a shared socket singleton (`useSocket.ts`) and refactors the existing `useOrderFeed.ts` to consume it without changing its public API. This is the cleanest WS architecture: one connection, reference-counted lifecycle, zero regression risk. No other solution achieves this — Solution A creates a parallel connection (and critically, fails to use Vue Query at all despite claiming to), while Solution C explicitly creates a second connection.

Solution B also achieves the highest scores on **code structure specificity** (5.0 — most complete file/type/import documentation) and **UI/UX quality** (4.5 — best use of existing UnoCSS shortcuts and patterns). Its real-time approach is solid (4.0) with proper query invalidation on WS events, and its use of TanStack Vue Query throughout makes it the most maintainable solution.

**Weighted calculations:**

| Criterion | Weight | A | A×W | B | B×W | C | C×W |
|-----------|--------|---|---|---|---|---|---|
| Architectural Integrity | 0.20 | 3.0 | 0.600 | **4.5** | **0.900** | 3.5 | 0.700 |
| Requirements Completeness | 0.20 | **5.0** | **1.000** | 4.5 | 0.900 | 4.0 | 0.800 |
| Real-Time Implementation | 0.18 | 3.5 | 0.630 | 4.0 | 0.720 | **5.0** | **0.900** |
| Code Structure Specificity | 0.17 | 4.5 | 0.765 | **5.0** | **0.850** | 4.5 | 0.765 |
| Error Handling & Robustness | 0.10 | **4.5** | **0.450** | 4.0 | 0.400 | 4.0 | 0.400 |
| UI/UX Quality | 0.10 | 3.5 | 0.350 | **4.5** | **0.450** | 3.5 | 0.350 |
| Testability & Maintainability | 0.05 | 3.0 | 0.150 | **4.5** | **0.225** | 4.0 | 0.200 |
| **Total** | **1.00** | | **3.945** | | **4.445** | | **4.115** |

Solution B wins on 5 of 7 criteria. Solution C leads on real-time (room scoping is technically superior) but lags on architectural integrity (second connection), UI/UX (no demo labels, minimal indicators), and requirements completeness (missing states). Solution A leads on requirements completeness (excellent error matrix) and error handling, but its architectural failure (no Vue Query despite claims) is disqualifying at the 20% weight tier.

---

## 3. Improvement Notes for Each Solution

### Solution A — Actionable Improvements

1. **Actually use TanStack Vue Query**: Replace `ref<Map<string, Order>>` with `useQuery` and `useQueryClient`. Define query keys as `['orders', 'tracking', orderNumber]` as claimed. Use `queryClient.setQueryData` for WS updates with merge semantics. This is the single biggest fix needed.

2. **Reuse the existing socket singleton**: Instead of creating a new `singletonSocket` in `useCustomerOrders.ts`, import the existing one from `useOrderFeed.ts` or extract a shared `useSocket.ts` like Solution B. Alternatively, import `getSocket()` from the existing module.

3. **Use existing UnoCSS shortcuts**: Replace custom `skeleton-loading` with `skeleton`/`skeleton-card`. Replace hardcoded hex colors with UnoCSS theme colors (`orange-600`, `gray-200`, etc.). Use `btn-primary` instead of inline button styling.

4. **Handle race condition**: Add logic to refetch an order if a WS event arrives before the REST GET completes. The current `if (existing) { ... }` silently drops updates. Either buffer the event, or trigger a refetch when the event arrives for an un-cached order.

5. **Refetch on reconnect**: Add a `socket.on('connect', ...)` handler that re-fetches all tracked orders to recover missed events during disconnect.

6. **Remove module-level `lastLookupTime`**: Move debounce state into the composable instance (a `ref`) so multiple instances don't interfere with each other. This also fixes testability.

### Solution B — Actionable Improvements

1. **Add offline/WS-disconnected banner**: Port the amber "Live updates paused" banner from Solution A (lines 715–720) to both TrackOrder.vue and CustomerOrders.vue. This is essential UX feedback.

2. **Wrap localStorage in try/catch**: The Pinia store reads `localStorage.getItem(...)` at module scope without try/catch (lines 329–331). Private browsing modes where localStorage is unavailable will throw. Use the same try/catch pattern from Solution A.

3. **Remove top-level navigation side effects**: Move the redirect check in `CustomerOrders.vue` (lines 1106–1109) from setup scope into `onMounted` or use a route guard. Running `router.replace('/register')` during component setup is fragile.

4. **Replace `invalidateQueries` with merge-based `setQueryData`**: For frequent WS updates, full query invalidation causes unnecessary network requests. Merge the partial payload (`{ status }`) into the cached Order using `setQueryData` with a merge function, and only invalidate periodically (e.g., every 30s) for consistency.

5. **Drop `customerPin` / simplify PIN gate**: The PIN verification adds complexity to both the data model and UX. For an MVP/demo, the order number alone (optionally with a tracking token) is sufficient. The PIN gate should be optional at minimum.

6. **Fix customerName restoration on page refresh**: After localStorage clear, the portal redirects to `/register` but doesn't explain that the customer can re-enter by name. Add a "Look up existing customer" path that searches by name and re-links.

### Solution C — Actionable Improvements

1. **Reuse the existing WS singleton**: Instead of a second connection, extend `useOrderFeed.ts` to accept additional event handlers, or add room-join capabilities to the existing socket. The justification for a separate connection is thin — room events and global events can co-exist on the same socket.

2. **Add demo mode labels**: Both `/track` and `/portal` need explicit "Demo" badges/banners explaining that customer identity is stored in the browser. Follow Solution A's pattern: "demo" badge in header + info banner in portal.

3. **Add offline/WS-disconnected banner**: The guest tracking page (OrderTracking.vue) has no visual indicator when the WebSocket disconnects. Add an amber banner matching the existing KDS pattern.

4. **Add retry button to guest tracking errors**: The guest page shows an error message but no retry button. Add a "Try Again" button that re-triggers the search.

5. **Wrap localStorage in try/catch**: `localStorage.getItem(STORAGE_KEY)` at module scope (line 921) will throw in private browsing. Add try/catch.

6. **Add localStorage restore for guest page**: On page refresh, the guest should be able to restore a previously tracked order (port the `restorePersisted` pattern from Solution A).

7. **Rename module from `customer` to `tracking`**: This matches the naming convention of other modules (kds, inventory, menu, analytics) and is more descriptive since the module covers both guest tracking and customer portal.

---

## 4. Validation Checklist

| Validation | A | B | C |
|------------|---|---|---|
| Socket re-use (no second connection) | ❌ Creates independent singleton | ✅ Extracts shared useSocket | ❌ Explicitly creates second connection |
| API client extension | ✅ Extends `orders.list()` | ✅ Extends `orders.list()` + `customers` | ✅ Adds `getByNumber`/`getByPhone` |
| Type extensions optional | ✅ `customerId?`, `updatedAt?` | ✅ `customerId?`, `customerPin?`, `trackingToken?` | ✅ `customerPhone?`, `customerId?` |
| Route integration | ✅ Sibling routes, no `/` conflict | ✅ Sibling routes, no `/` conflict | ✅ Sibling routes, no `/` conflict |
| No auth assumption | ✅ Demo mode labels | ✅ "Demo" labels + PIN gate | ⚠️ No demo labels, phone lookup |
| Server compatibility | ✅ Minor: +customerId in payload | ✅ Minor: +customerId in payload | ⚠️ Major: rooms, join/leave, order:sync |
| WS payload limitations | ✅ Handles partial payload merge | ✅ Invalidate + refetch (correct but heavy) | ✅ Handles via setQueryData merge |
| Loading/empty/error states | ✅ All 13 edge cases documented | ✅ Most covered | ⚠️ Missing offline banner, retry on guest |
