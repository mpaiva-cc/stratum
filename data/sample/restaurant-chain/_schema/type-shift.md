---
type: entity-type
group: "Scheduling & work"
basis: authorization
---

> **Scheduling & work** · governance basis: `authorization`

A scheduled work block at a store (daypart, date, crew).

## Properties

- `id`
- `store`
- `date`
- `daypart`
- `start`
- `end`
- `crew_size`

## Relationships (edges)

- `at` → [[type-store]]
- `part_of` → [[type-schedule]]
- `worked_by` → [[type-person]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
