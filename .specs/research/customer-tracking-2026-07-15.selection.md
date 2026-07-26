# Customer Tracking — Top 3 Proposal Selection

**Date:** 2026-07-15
**Total proposals evaluated:** 18 (6 from each of 3 explorers)
**Method:** Ranked-choice voting (1st=3pts, 2nd=2pts, 3rd=1pt)

## Vote Tallies

| Proposal | Judge 1 | Judge 2 | Judge 3 | Total |
|----------|---------|---------|---------|-------|
| **C-A — Composable Overlay** | 3rd (1pt) | 1st (3pt) | 1st (3pt) | **7** |
| **A2 — Dual-Mode Guest + Customer** | 2nd (2pt) | 2nd (2pt) | 2nd (2pt) | **6** |
| **C-C — Server-Scoped Rooms** | 1st (3pt) | — | 3rd (1pt) | **4** |
| B-C — Phone-Based Identity | — | 3rd (1pt) | — | 1 |

## Selected Proposals (for Phase 3 Expansion)

| Rank | Proposal | Source | Avg Score | Core Idea |
|------|----------|--------|-----------|-----------|
| **1** | **Composable Overlay** | Explorer C, Approach A | 4.30 | Reuse singleton WS with client-side filtering; extend api/client.ts with order lookup; new customer module with composables, no server changes |
| **2** | **Dual-Mode Guest + Customer** | Explorer A, Approach 2 | 4.18 | Order-number lookup + localStorage PIN identity; both guest and portal views; extend Order type with customerId/phone; incremental adoption |
| **3** | **Server-Scoped Rooms** | Explorer C, Approach C | 4.06 | Socket.IO rooms per customer/order; server-side broadcast filtering; most scalable; requires server.js changes |

## Consensus Rationale

**C-A (Composable Overlay)** won on feasibility — zero server changes, both features covered, every file named, perfect stack alignment. Two of three judges ranked it 1st.

**A2 (Dual-Mode Guest + Customer)** was the only proposal ranked in the top 3 by ALL judges — unanimous consensus on its completeness. Best requirements coverage (both features fully specified), pragmatic PIN identity solves the auth gap.

**C-C (Server-Scoped Rooms)** provides the architecturally correct WS scoping for the long term — the natural Phase 2 evolution after C-A ships. Judge 1 ranked it 1st for its scalability and security.

## Concerns to Address in Expansion

### C-A — Composable Overlay
- Client-side filtering of global WS events is O(n) per event — needs perf consideration for many orders
- No server changes means no customerId-based queries — must work with orderNumber only
- Customer portal identity is weakest point (mock auth)
- C-F (Pinia Store) was a close alternative — expansion should consider store integration

### A2 — Dual-Mode Guest + Customer
- Requires adding `customerId` and/or `phone` to Order type and db.json seed data
- localStorage PIN is not real auth — must be clearly documented as interim
- More files to create than C-A (~8-10 vs ~5-6)
- Judges flagged risk of scope creep between the two modes

### C-C — Server-Scoped Rooms
- Requires server.js modifications — risk of breaking existing KDS broadcast
- Cannot be implemented alone; needs C-A or equivalent client overlay first since KDS emits don't target rooms yet
- Higher complexity — Socket.IO room management, multiple socket connections
- json-server doesn't natively support customer queries — needs custom route or query param approach
