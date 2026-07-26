# Design & WebSocket Fix — Selection Rationale

**Date:** 2026-07-15
**Task:** Fix component design inconsistencies, CSS/style issues, and WebSocket implementation flaws in Cloud Kitchen ERP frontend.

## Vote Tallies

| Proposal | Explorer | Judge 1 | Judge 2 | Judge 3 | Total Points |
|----------|----------|---------|---------|---------|:------------:|
| **Foundation First** | B (A) | 3 | 3 | 3 | **9** |
| **Design Token Unification** | A (B) | 1 | 2 | 2 | **5** |
| **Minimal Repairs** | A (A) | 2 | 1 | 0 | **3** |
| **Wrapped Abstractions** | B (C) | 0 | 0 | 1 | **1** |

*Scoring: 1st=3pts, 2nd=2pts, 3rd=1pt*

## Selected Proposals (Top 3)

### 1st: Foundation First (Explorer B, Approach A) — Score: 4.35–4.90
Token-layer-first approach: define design tokens in UnoCSS config, then sweep modules one-by-one, plus WS hardening with cache patching, auth, and fallback transport. Judges praised its incremental delivery, perfect feasibility, and complete requirement coverage.

**Key judge feedback to address in expansion:**
- Ensure the token system actually integrates with PrimeVue's KitchenPreset (no fragmentation)
- Provide concrete migration plan for each of the 4 modules
- WS cache patching must handle stale data edge cases

### 2nd: Design Token Unification (Explorer A, Approach B) — Score: 4.00–4.10
Centralize all visual properties into a unified token system in UnoCSS config and main.css, replacing every inline color reference with semantic tokens. Judges praised thoroughness but flagged higher risk of visual regression.

**Key judge feedback to address in expansion:**
- Risk mitigation for visual regressions during color swap
- Concrete mapping of every `#xxx` value to a semantic token
- Plan to handle the `field` class and other missing utilities

### 3rd: Minimal Repairs (Explorer A, Approach A) — Score: 3.90–4.10
Surgically fix the 6 most broken things: icon, tooltip, field class, card uniformity, WS polling fallback, WS cache patch. Judges praised feasibility and low risk but flagged incomplete coverage of CSS/style issues.

**Key judge feedback to address in expansion:**
- Extend coverage to include the missing loading/skeleton states
- Address the `text-primary-400` color reference in RecipeBuilder
- Add color consistency fix between border-gray-200 and border-[#E9ECEF]

## Consensus Rationale

All three judges independently ranked **Foundation First** as the top proposal, citing its unique combination of:
1. Incremental delivery (module-by-module sweep)
2. Complete coverage of all 3 issue categories
3. Best stack leverage (UnoCSS tokens + TanStack Query cache integration)
4. Practical risk management with rollback strategy

**Design Token Unification** and **Minimal Repairs** tied for 2nd/3rd, with the former scoring higher on requirements coverage and the latter on feasibility and risk.
