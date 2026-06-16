---
type: entity-type
group: Organization
basis: authorization
---

> **Organization** · governance basis: `authorization`

A restaurant location as an operating unit (org_unit + a physical location).

## Properties

- `id`
- `name`
- `region`
- `opened`
- `seats`
- `headcount`

## Relationships (edges)

- `part_of` → [[type-region]]
- `at_location` → [[type-location]]
- `employs` → [[type-person]]
- `runs` → [[type-schedule]]
- `operates` → [[type-device]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
