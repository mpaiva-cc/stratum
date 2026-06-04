# Four-Product Tour Live Validation — Round 12
**Date:** 2026-06-04  
**Viewport:** 1280 × 800 (desktop)  
**Cache-bust:** `?v=r12`  
**Selector:** `.arc-strip__item--done` li and its `span`

## Measurements

| Tour URL | li color (computed) | span color (computed) | Alpha | Result |
|---|---|---|---|---|
| `/stratum/tenure/tour/` | `rgba(244, 236, 218, 0.75)` | `rgba(244, 236, 218, 0.75)` | **0.75** | PASS |
| `/stratum/cairn/tour/` | `rgba(244, 236, 218, 0.75)` | `rgba(244, 236, 218, 0.75)` | **0.75** | PASS |
| `/stratum/recruiter/tour/` | `null` | `null` | n/a | PASS* |
| `/stratum/tour/` | `rgba(244, 236, 218, 0.75)` | `rgba(244, 236, 218, 0.75)` | **0.75** | PASS |

\* Recruiter is the first tour in the arc; no preceding `--done` item exists in the strip. `null` is the correct and expected result.

## Verdict

**DONE.** Alpha is 0.75 across all tours that render a `--done` item. Tessera's assertion is confirmed: commit `6c47f53` shipped the fix correctly and the round-10 reading of 0.60 was a GitHub Pages mid-rebuild cache artifact. No round 13 needed.
