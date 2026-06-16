---
type: entity-type
group: "Scheduling & work"
basis: consent
---

> **Scheduling & work** · governance basis: `consent`

A worker's PTO / unavailability request.

## Properties

- `id`
- `person`
- `start`
- `end`
- `kind`
- `status`

## Relationships (edges)

- `by` → [[type-person]]
- `approved_by` → [[type-person]]

## Governance

Edges from this type are gated by **consent** — the data subject grants scope. The traversal predicate refuses paths a purpose token cannot satisfy.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
