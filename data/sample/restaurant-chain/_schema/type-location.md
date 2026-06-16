---
type: entity-type
group: Place
basis: authorization
---

> **Place** · governance basis: `authorization`

A physical/legal place — jurisdiction, data-residency, badge zone. Distinct from a store's org grouping.

## Properties

- `id`
- `code`
- `name`
- `address`
- `jurisdiction`
- `data_residency`

## Relationships (edges)

- `hosts` → [[type-store]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
