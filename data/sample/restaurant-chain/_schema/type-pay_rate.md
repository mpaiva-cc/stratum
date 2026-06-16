---
type: entity-type
group: Compensation
basis: consent
---

> **Compensation** · governance basis: `consent`

A worker's pay rate (hourly or salary) — sensitive personal datum.

## Properties

- `id`
- `person`
- `rate`
- `unit`
- `effective`

## Relationships (edges)

- `of` → [[type-person]]
- `for` → [[type-position]]

## Governance

Edges from this type are gated by **consent** — the data subject grants scope. The traversal predicate refuses paths a purpose token cannot satisfy.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
