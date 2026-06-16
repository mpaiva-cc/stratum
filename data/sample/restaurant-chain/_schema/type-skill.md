---
type: entity-type
group: "Skills & compliance"
basis: authorization
---

> **Skills & compliance** · governance basis: `authorization`

A competency used to staff and develop people.

## Properties

- `id`
- `name`
- `category`

## Relationships (edges)

- `held_by` → [[type-person]]
- `required_by` → [[type-position]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
