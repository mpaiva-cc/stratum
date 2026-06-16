---
type: entity-type
group: "Performance & lifecycle"
basis: authorization
---

> **Performance & lifecycle** · governance basis: `authorization`

A checklist item in a new hire's onboarding.

## Properties

- `id`
- `person`
- `task`
- `status`

## Relationships (edges)

- `for` → [[type-person]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
