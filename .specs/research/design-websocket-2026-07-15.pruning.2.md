```yaml
evaluation:
  meta:
    judge_id: 2
    proposal_count: 18
    select_count: 3
  scores:
    - proposal_id: explorer-b-a
      feasibility: 4
      requirements_coverage: 5
      solution_quality_potential: 4
      technical_specificity: 5
      risk_management: 3
      stack_leverage: 5
      final_score: 4.35
    - proposal_id: explorer-a-b
      feasibility: 4
      requirements_coverage: 4
      solution_quality_potential: 4
      technical_specificity: 4
      risk_management: 3
      stack_leverage: 5
      final_score: 4.00
    - proposal_id: explorer-a-a
      feasibility: 5
      requirements_coverage: 3
      solution_quality_potential: 3
      technical_specificity: 5
      risk_management: 4
      stack_leverage: 3
      final_score: 3.90
    - proposal_id: explorer-c-c
      feasibility: 4
      requirements_coverage: 2
      solution_quality_potential: 4
      technical_specificity: 5
      risk_management: 4
      stack_leverage: 4
      final_score: 3.75
    - proposal_id: explorer-c-b
      feasibility: 4
      requirements_coverage: 2
      solution_quality_potential: 4
      technical_specificity: 5
      risk_management: 3
      stack_leverage: 5
      final_score: 3.75
    - proposal_id: explorer-b-c
      feasibility: 3
      requirements_coverage: 5
      solution_quality_potential: 4
      technical_specificity: 4
      risk_management: 3
      stack_leverage: 3
      final_score: 3.75
    - proposal_id: explorer-a-c
      feasibility: 4
      requirements_coverage: 3
      solution_quality_potential: 4
      technical_specificity: 4
      risk_management: 3
      stack_leverage: 4
      final_score: 3.70
    - proposal_id: explorer-a-d
      feasibility: 3
      requirements_coverage: 4
      solution_quality_potential: 4
      technical_specificity: 4
      risk_management: 4
      stack_leverage: 3
      final_score: 3.65
    - proposal_id: explorer-c-a
      feasibility: 5
      requirements_coverage: 2
      solution_quality_potential: 2
      technical_specificity: 5
      risk_management: 5
      stack_leverage: 2
      final_score: 3.50
    - proposal_id: explorer-c-d
      feasibility: 3
      requirements_coverage: 4
      solution_quality_potential: 3
      technical_specificity: 4
      risk_management: 4
      stack_leverage: 2
      final_score: 3.35
    - proposal_id: explorer-b-b
      feasibility: 4
      requirements_coverage: 3
      solution_quality_potential: 3
      technical_specificity: 4
      risk_management: 3
      stack_leverage: 2
      final_score: 3.30
    - proposal_id: explorer-b-d
      feasibility: 5
      requirements_coverage: 2
      solution_quality_potential: 2
      technical_specificity: 4
      risk_management: 3
      stack_leverage: 3
      final_score: 3.25
    - proposal_id: explorer-a-e
      feasibility: 2
      requirements_coverage: 3
      solution_quality_potential: 3
      technical_specificity: 4
      risk_management: 4
      stack_leverage: 2
      final_score: 2.90
    - proposal_id: explorer-c-e
      feasibility: 2
      requirements_coverage: 4
      solution_quality_potential: 2
      technical_specificity: 5
      risk_management: 3
      stack_leverage: 1
      final_score: 2.85
    - proposal_id: explorer-b-f
      feasibility: 2
      requirements_coverage: 3
      solution_quality_potential: 3
      technical_specificity: 4
      risk_management: 3
      stack_leverage: 2
      final_score: 2.80
    - proposal_id: explorer-c-f
      feasibility: 2
      requirements_coverage: 3
      solution_quality_potential: 2
      technical_specificity: 4
      risk_management: 4
      stack_leverage: 3
      final_score: 2.80
    - proposal_id: explorer-b-e
      feasibility: 2
      requirements_coverage: 3
      solution_quality_potential: 2
      technical_specificity: 4
      risk_management: 4
      stack_leverage: 2
      final_score: 2.70
    - proposal_id: explorer-a-f
      feasibility: 2
      requirements_coverage: 3
      solution_quality_potential: 2
      technical_specificity: 4
      risk_management: 3
      stack_leverage: 1
      final_score: 2.50
  top_3:
    - rank: 1
      proposal_id: explorer-b-a
      final_score: 4.35
    - rank: 2
      proposal_id: explorer-a-b
      final_score: 4.00
    - rank: 3
      proposal_id: explorer-a-a
      final_score: 3.90
  rationale:
    top_3:
      - rank: 1
        proposal_id: explorer-b-a
        reason: >-
          Highest combined score driven by comprehensive requirements coverage
          (all 14 subproblems addressed with clear plans) and excellent stack
          leverage. The module-by-module sweep strategy is both pragmatic and
          systematic — it establishes a design token layer in UnoCSS, then fixes
          each module incrementally, which reduces regression risk vs big-bang
          refactors. WebSocket hardening includes cache patching, env-var URL,
          and auth, making the real-time layer production-ready. The one weakness
          is generic risk mitigations (e.g., "careful review" for missed inline
          styles), but this is acceptable given the proposal's overall maturity.
      - rank: 2
        proposal_id: explorer-a-b
        reason: >-
          The most thorough design-token-driven approach among all proposals,
          touching all 21 Vue files to eliminate color drift, unify card patterns,
          add loading skeletons, and fix all component inconsistencies. WS fixes
          cover URL env-config, polling fallback, connect_error handler, and cache
          patching. The systematic find-and-replace strategy ensures consistency
          but carries higher regression risk than B-A's incremental approach,
          keeping it at #2. Strong UnoCSS stack leverage with shortcuts and theme
          extensions.
      - rank: 3
        proposal_id: explorer-a-a
        reason: >-
          The safest bet with perfect feasibility (5/5) and exceptional technical
          specificity (5/5). Each fix is named at the file and line level, making
          this immediately implementable. WS cache patching with delayed refetch
          is a smart compromise between performance and safety. It defers systemic
          issues (card patterns, skeletons, button states), which limits its
          requirements coverage to 3, but for teams prioritizing risk minimization
          and quick wins, this is the most actionable proposal. The deferred items
          can be tracked as follow-up work.
    bottom_15:
      - proposal_id: explorer-c-c
        weakness: >-
          Excellent WebSocket rewrite with typed interfaces and cache patching,
          but explicitly leaves all CSS and component issues untouched,
          addressing only 1 of 3 categories.
      - proposal_id: explorer-c-b
        weakness: >-
          Comprehensive CSS/component fix via UnoCSS shortcuts and presetIcons,
          but completely ignores the WebSocket category — a critical omission
          given the task scope.
      - proposal_id: explorer-b-c
        weakness: >-
          Strong coverage and singleton WS composable design, but wrapper
          components over PrimeVue add unnecessary indirection and the high
          effort is disproportionate to a codebase this size.
      - proposal_id: explorer-a-c
        weakness: >-
          Well-architected WS rewrite with Pinia store, but CSS/component fixes
          are treated as an afterthought (field class, icon swap only), leaving
          most visual inconsistencies unresolved.
      - proposal_id: explorer-a-d
        weakness: >-
          Component extraction (UiCard, UiFormField, etc.) creates wrapper hell
          and abstraction overhead that doesn't pay off for a 21-file codebase,
          with unclear separation from PrimeVue's own theming.
      - proposal_id: explorer-c-a
        weakness: >-
          Too minimal — skips hardcoded URL env-config, cache patching, auth,
          skeletons, card unification, and button states, leaving over half of
          identified issues unfixed.
      - proposal_id: explorer-c-d
        weakness: >-
          Feature flags per lane create dead-code debt; scoped style
          duplication for the field class works against UnoCSS conventions
          and adds unnecessary complexity.
      - proposal_id: explorer-b-b
        weakness: >-
          Rejects UnoCSS utility-first paradigm in favor of CSS custom
          properties, creating a mixed approach that fights the established
          stack convention and adds paradigm confusion.
      - proposal_id: explorer-b-d
        weakness: >-
          Defers card inconsistency, skeletons, cache patching, and auth —
          leaving systemic architectural debt untouched while only patching
          surface-level bugs.
      - proposal_id: explorer-a-e
        weakness: >-
          ESLint plugin for Vue SFC codemods is genuinely difficult to
          implement correctly, and the approach prevents future issues but
          doesn't effectively fix existing ones.
      - proposal_id: explorer-c-e
        weakness: >-
          Regex-based codegen on Vue templates is inherently fragile and
          error-prone; the design manifest workflow adds process overhead
          with brittle automation.
      - proposal_id: explorer-b-f
        weakness: >-
          Event sourcing with a reactive Map replaces TanStack Query on the
          hot path, creating dual state management that is over-engineered
          for the actual data volume.
      - proposal_id: explorer-c-f
        weakness: >-
          Swapping to FloatLabel/Panel/SelectButton has known PrimeVue 4
          compatibility risks and the WS subscription pattern is an
          unconventional use of TanStack Query.
      - proposal_id: explorer-b-e
        weakness: >-
          Runtime theme engine conflicts with PrimeVue's own theming system
          and introduces FOUC risk; the @socket.io/admin-ui dependency is
          unnecessary for this scale.
      - proposal_id: explorer-a-f
        weakness: >-
          Service worker + micro-frontend approach is dramatically
          over-engineered for the actual problem scope, creating massive
          duplication and debugging complexity.
  concerns:
    - proposal_id: explorer-b-a
      concerns:
        - >-
          Module-by-module sweep may miss cross-module dependencies (e.g., shared
          composables or mixins). Recommend a pre-sweep audit that catalogs all
          inline style/class usages before starting any changes.
        - >-
          Cache patching via setQueryData relies on payload shape matching server.js.
          If server.js is updated independently, the cache deserialization will silently
          produce stale UI. Consider adding a runtime type guard or Zod schema validation
          for order:update payloads.
        - >-
          Env var VITE_WS_PORT adds deployment configuration surface. What happens in
          production when this env var is unset? The fallback to same-origin (empty string)
          should be explicitly documented in deployment notes.
    - proposal_id: explorer-a-b
      concerns:
        - >-
          Big-bang touch of all 21 files carries high merge-conflict risk if other
          branches are in flight. Recommend staging the work per-module despite the
          "systematic" label — do KDS first, then inventory, then menu, then analytics.
        - >-
          The #E5E7EB vs #E9ECEF border color normalization needs visual sign-off
          from stakeholders. The 2-per-channel delta is small but may be noticeable
          on high-DPI displays. Include screenshots in the PR.
        - >-
          Loading skeletons added generically may not match actual data-loading
          patterns. Verify each skeleton's timing against real network conditions
          (e.g., InventoryList loads via TanStack Query's useQuery — wire skeleton to
          the query's isPending state, not a fake timeout).
    - proposal_id: explorer-a-a
      concerns:
        - >-
          Deferred items (card inconsistency, skeletons, button states) should be
          tracked as tickets in the project tracker with explicit owners to prevent
          permanent deferral. Without tracking, these will likely never be addressed.
        - >-
          WS cache patching via setQueryData should include a stale-while-revalidate
          timeout (e.g., re-fetch after 30s) to prevent UI staleness if the WS
          connection drops silently after a successful patch.
        - >-
          No mechanism prevents regression of the fixed items. Recommend at minimum
          adding a CI check that verifies transports: ['websocket', 'polling'] is
          present in useOrderFeed.ts to prevent the polling fallback from being
          accidentally removed.
```

# Evaluation Report — Judge 2

## Process Summary

Read all 18 proposals across 3 explorer files. Each proposal was scored on 6 criteria (feasibility, requirements coverage, solution quality potential, technical specificity, risk management, stack leverage) using the 1–5 rubrics defined in the pruning specification. Weighted final scores were calculated, then sorted descending. Tiebreakers applied per spec (sequential criterion compare starting with feasibility).

## Scoring Breakdown

### Top 3 Selection

| Rank | Proposal | Feas. | Req. Cov. | Sol. Qual. | Tech. Spec. | Risk Mgmt. | Stack Lev. | **Final** |
|------|----------|-------|-----------|------------|-------------|------------|------------|-----------|
| 1 | **B-A: Foundation First** | 4 | 5 | 4 | 5 | 3 | 5 | **4.35** |
| 2 | **A-B: Design Token Unification** | 4 | 4 | 4 | 4 | 3 | 5 | **4.00** |
| 3 | **A-A: Minimal Repairs** | 5 | 3 | 3 | 5 | 4 | 3 | **3.90** |

### Reasoning

**#1 B-A: Foundation First (4.35)** — The standout proposal. It combines the systematic design-token approach of A-B with an incremental module-by-module delivery strategy that mitigates the big-bang risk. Every subproblem across all three categories is addressed with specific, actionable plans. Stack leverage is exemplary (UnoCSS theme extensions, TanStack Query cache patching, PrimeVue component usage). The only weakness is generic risk mitigation language, but the proposal's overall structure is the most balanced of all 18.

**#2 A-B: Design Token Unification (4.00)** — The most thorough CSS/component fixer. It would eliminate color drift permanently by creating a full design token layer and sweeping all 21 files. Loading skeletons are added to all data views. WS fixes are adequate (env URL, polling fallback, cache patching). Slightly lower than B-A because the big-bang approach (all files at once) is riskier than B-A's incremental sweep, and it doesn't address WS auth/connected-event as explicitly.

**#3 A-A: Minimal Repairs (3.90)** — The highest-confidence option. Perfect feasibility score (5/5) and exceptional specificity — every fix is named with exact file, line, and change. The surgical scope means only ~8 files are touched, making this implementable in hours rather than days. WS cache patching with delayed refetch is a pragmatic compromise. Its lower requirements coverage (3/5) reflects the deliberate deferral of card inconsistency, skeletons, and button states — these should be tracked as follow-up work.

### Tiebreak Resolution

Three proposals tied at 3.75 (C-C, C-B, B-C). The sequential criterion compare (feasibility → requirements_coverage → solution_quality_potential → technical_specificity → risk_management) resolved the order:
- **C-C (Real-Time Overhaul)**: feasibility 4, risk_management 4 — edges ahead
- **C-B (Consolidated Design System)**: feasibility 4, risk_management 3
- **B-C (Wrapped Abstractions)**: feasibility 3 — loses on first tiebreaker

### Key Observations Across the Field

- **High-probability cluster (3.70–4.35):** All proposals in this range share three traits: they address all three categories (at least partially), name specific files/changes, and work with rather than against the existing stack. The separation between them comes down to scope risk vs. thoroughness.

- **Specialist proposals (3.75, single-category):** C-C (WS-only) and C-B (CSS-only) score well within their domain but are dinged hard on requirements coverage (2/5). In a task explicitly requiring all three categories, single-category proposals cannot rank higher than #4 regardless of execution quality.

- **Lowest cluster (2.50–2.90):** The bottom five proposals (A-F, B-E, C-F, B-F, C-E) all share over-engineering as their fatal flaw — service workers, event sourcing, runtime theme engines, codegen, or PrimeVue component swaps that dramatically exceed the problem's scope. Feasibility scores of 2 across this cluster reflect that these approaches would require disproportionate effort and risk.

- **Stack leverage is decisive:** The highest-scoring proposals (B-A, A-B) both maximize UnoCSS theme/shortcut usage and work within TanStack Query's cache model. Proposals that rejected stack conventions (B-B's CSS variables over UnoCSS, B-F's event sourcing over TanStack Query) consistently scored below 3.40.

### Next-Phase Recommendations

For the expansion phase, the top 3 proposals should be developed with attention to:
- **B-A's risk mitigations** need strengthening — implementers should add concrete guardrails (e.g., a pre-sweep CSS audit script, Zod validation for WS payloads)
- **A-B's big-bang risk** should be addressed by adopting B-A's module-by-module staging while keeping A-B's token completeness
- **A-A's deferred items** must be formally tracked and scheduled, not left as indefinite follow-up
