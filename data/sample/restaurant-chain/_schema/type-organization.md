---
type: entity-type
group: Organization
basis: authorization
---

> **Organization** · governance basis: `authorization`

The chain itself — the root org unit.

## Properties

- `id`
- `name`
- `founded`
- `headquarters`
- `store_count`
- `headcount`

## Relationships (edges)

- `contains` → [[type-region]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
