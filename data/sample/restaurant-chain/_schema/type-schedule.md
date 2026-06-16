---
type: entity-type
group: "Scheduling & work"
basis: authorization
---

> **Scheduling & work** · governance basis: `authorization`

A store's published schedule for a week.

## Properties

- `id`
- `store`
- `week_start`
- `shift_count`

## Relationships (edges)

- `for` → [[type-store]]
- `contains` → [[type-shift]]
- `published_by` → [[type-agent]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
