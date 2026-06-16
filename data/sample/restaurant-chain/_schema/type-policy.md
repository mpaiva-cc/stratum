---
type: entity-type
group: "Systems & governance"
basis: authorization
---

> **Systems & governance** · governance basis: `authorization`

A governance policy an agent operates under.

## Properties

- `id`
- `name`
- `version`
- `decision_class`

## Relationships (edges)

- `governs` → [[type-agent]]

## Governance

An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
