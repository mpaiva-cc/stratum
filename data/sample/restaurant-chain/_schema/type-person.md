---
type: entity-type
group: "People & identity"
basis: consent
---

> **People & identity** · governance basis: `consent`

A worker — the data subject at the center of HCM.

## Properties

- `id`
- `name`
- `status`
- `employment_type`
- `hire_date`
- `email`

## Relationships (edges)

- `located_at` → [[type-location]]
- `works_at` → [[type-store]]
- `in_department` → [[type-department]]
- `holds` → [[type-role]]
- `reports_to` → [[type-person]]
- `certified_in` → [[type-certification]]
- `skilled_in` → [[type-skill]]
- `assigned_to` → [[type-shift]]
- `paid_at` → [[type-pay_rate]]

## Governance

Edges from this type are gated by **consent** — the data subject grants scope. The traversal predicate refuses paths a purpose token cannot satisfy.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
