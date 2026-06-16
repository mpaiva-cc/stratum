---
type: entity-type
group: Organization
basis: authorization
---

> **Organization** · governance basis: `authorization`

A geographic market grouping of stores (org_unit level).

## Properties

- `id`
- `name`
- `director`

## Relationships (edges)

- `part_of` → [[type-organization]]
- `contains` → [[type-store]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
