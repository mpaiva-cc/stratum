---
type: entity-type
group: Compensation
basis: authorization
---

> **Compensation** · governance basis: `authorization`

A benefits offering (health, 401k, meals).

## Properties

- `id`
- `name`
- `kind`
- `eligibility`

## Relationships (edges)

- `offered_by` → [[type-organization]]
- `enrolls` → [[type-person]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
