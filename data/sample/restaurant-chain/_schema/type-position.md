---
type: entity-type
group: Organization
basis: authorization
---

> **Organization** · governance basis: `authorization`

A job template (Line Cook, Server, GM...) with a pay band.

## Properties

- `id`
- `title`
- `department`
- `flsa`
- `pay_band_low`
- `pay_band_high`
- `tipped`

## Relationships (edges)

- `in_department` → [[type-department]]
- `requires` → [[type-certification]]
- `requires` → [[type-skill]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
