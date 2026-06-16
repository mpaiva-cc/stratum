---
type: entity-type
group: Organization
basis: authorization
---

> **Organization** · governance basis: `authorization`

An employee holding a position at a store (the instance of employment).

## Properties

- `id`
- `person`
- `position`
- `store`
- `since`

## Relationships (edges)

- `of` → [[type-person]]
- `is` → [[type-position]]
- `at` → [[type-store]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
