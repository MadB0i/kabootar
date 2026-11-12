# Multi-Agent Pipeline: "Repo → Viral-Ready"

A five-agent pipeline with one controller and a shared blackboard (state: audit,
brief, tokens, diffs, test results, assets, lessons ledger). The task completes
without human touch unless the retry budget is exhausted.

## The pipeline

```
Strategist ──brief──▶ Design Agent ──tokens+specs──▶ Implementer ──diff+build──▶ Verifier ──verdict──▶ Growth Agent
    ▲                                                                    │ fail (typed)
    └────────────────── lessons ledger ◀─────────────────────────────────┘ (routes back, max 3 loops)
```

| # | Agent | Receives | Decides | Passes to next |
|---|-------|----------|---------|----------------|
| 1 | **Strategist** | repo map, current UX, share-path analysis | positioning, target user, viral loops (native share, in-product CTA, wow-scenes), ranked scope, constraints | Growth Brief |
| 2 | **Design Agent** | brief + UI inventory | visual language (dark aurora, glassmorphism, gradient type), type system, motion rules, component specs | Design tokens + specs |
| 3 | **Implementer** | tokens + specs | file-level changes; presentation-only edits where logic is already verified | Working diff + production build |
| 4 | **Verifier** | built app | pass/fail via real gates: lint → build → browser behavior (creator flow, viewer regression at 400px & 1280px) | Verdict + typed issue list |
| 5 | **Growth Agent** | passing app | README structure, badges, screenshots, OG image, commit message | Repo marketing assets |

## Handoff contracts

Every handoff is a structured object, not prose:

- **Brief**: `{ goals[], rankedScope[], constraints[], wowMoments[] }`
- **Tokens**: `{ palette{}, typography{}, motion{}, components{} }`
- **Diff**: `{ files[], frozenZones[] (verified logic that must not change), build: 'ok' }`
- **Verdict**: `{ gates: { lint, build, browser400, browser1280 }, issues: [{ type, repro, owner }] }`

## Error handling

1. Verifier is the **only** gate; failures are typed: `build | lint | visual | behavior`.
2. Typed failures route back to the responsible agent with the exact repro attached.
3. Retry budget: **3 repair loops per failure type**; then the pipeline stops and emits a
   human-handoff report listing exactly what remains.
4. **Hard rule:** a regression to previously-verified viewer behavior rolls back that
   specific change immediately — behavior beats looks.

## Self-improvement

- Every failure→fix pair is appended to the **lessons ledger** (`docs/lessons.md`).
- Future runs seed agent prompts with the ledger so the same class of mistake is
  caught before it ships.
- Each new regression found by the Verifier becomes a **permanent gate** (the gate
  set only grows).
- Design tokens that pass visual review are versioned here and reused as the
  starting point for future redesigns.
