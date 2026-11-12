# Lessons ledger

Every failure → fix pair from pipeline runs. Seeded into future agent prompts.

| # | Type | Failure | Fix | Gate added |
|---|------|---------|-----|------------|
| 1 | behavior | Creator message state started empty after moving the occasion-reset out of an effect | initialize state from defaults in `useState` initializer | creator: defaults visible on first paint |
| 2 | behavior | Scene buttons stayed visible after "Haan" (payoff state) | wrap controls in `!sunOut` | payoff hides controls |
| 3 | visual | Birthday cake rendered behind the viewer's text card | moved cake to the bottom 25% of the canvas | no scene art under card zone |
| 4 | visual | Romantic star-name formed behind the text card | sample text at 22% height instead of center | same gate as #3 |
| 5 | lint | `Date.now()` in render-adjacent helper flagged impure | counter ref for ids | oxlint must stay at 0 |
| 6 | tooling | Screenshot `clip` renders a tiled frame on this backend | capture a full viewport at the exact target size instead | OG image must be a clean 1200×630 |
| 7 | behavior | Taps starting on scene buttons could navigate cards | interactive-start suppression in touch handlers | taps on `button/a/[data-interactive]` never navigate |
