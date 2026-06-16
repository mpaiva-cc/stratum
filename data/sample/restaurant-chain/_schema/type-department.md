---
type: entity-type
group: Organization
basis: authorization
---

> **Organization** · governance basis: `authorization`

A functional grouping (Kitchen, Front of House, Bar, Management).

## Properties

- `id`
- `name`
- `function`

## Relationships (edges)

- `part_of` → [[type-organization]]
- `staffs` → [[type-position]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
