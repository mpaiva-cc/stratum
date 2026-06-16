---
type: entity-type
group: "Systems & governance"
basis: authorization
---

> **Systems & governance** · governance basis: `authorization`

A POS terminal or tablet at a store (deterministic key).

## Properties

- `id`
- `asset_tag`
- `kind`
- `store`

## Relationships (edges)

- `at` → [[type-store]]
- `used_by` → [[type-person]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
