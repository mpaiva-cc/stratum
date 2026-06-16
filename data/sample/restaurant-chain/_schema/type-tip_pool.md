---
type: entity-type
group: Compensation
basis: authorization
---

> **Compensation** · governance basis: `authorization`

A store's tip-distribution pool for a period.

## Properties

- `id`
- `store`
- `period`
- `amount`

## Relationships (edges)

- `at` → [[type-store]]
- `distributes_to` → [[type-person]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
