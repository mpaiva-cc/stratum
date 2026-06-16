---
type: entity-type
group: "People & identity"
basis: delegated_authority
---

> **People & identity** · governance basis: `delegated_authority`

An autonomous actor. Not a data subject — operates under authority the company extends; lifetime is its policy version, not a tenure.

## Properties

- `id`
- `kind`
- `policy_version`
- `operator`
- `status`

## Relationships (edges)

- `operates_under` → [[type-policy]]
- `acts_on` → [[type-store]]
- `recorded_in` → [[type-employment_event]]

## Governance

An actor operating under **delegated authority** the company extends; revisable mid-action via its policy version.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
