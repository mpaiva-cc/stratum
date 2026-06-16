---
type: entity-type
group: "Skills & compliance"
basis: consent
---

> **Skills & compliance** · governance basis: `consent`

A personal credential (food safety, alcohol service) with an expiry — compliance-bearing.

## Properties

- `id`
- `name`
- `authority`
- `valid_months`

## Relationships (edges)

- `held_by` → [[type-person]]
- `required_by` → [[type-position]]

## Governance

Edges from this type are gated by **consent** — the data subject grants scope. The traversal predicate refuses paths a purpose token cannot satisfy.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
