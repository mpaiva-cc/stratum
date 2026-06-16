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
- `status_reason`
- `status_effective_date`
- `rehire_eligible`
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

## Canonical Statuses

The `status` field carries one of ten canonical employment lifecycle states (HRIS superset + beyond):

| Status | Meaning | Rehire Eligible? |
|--------|---------|------------------|
| `active` | Currently employed and actively working | Conditional |
| `on_leave` | Temporary absence (PTO, medical, sabbatical, unpaid) | Conditional |
| `inactive` | Employed but not actively working (reduced hours, between roles) | Conditional |
| `leave_of_absence` | Long-term structured leave with anticipated return | Conditional |
| `suspended` | Disciplinary hold, investigation, or legal hold | Conditional |
| `terminated` | Employment ended involuntarily | Conditional |
| `retired` | Employment ended voluntarily after career | Conditional |
| `deceased` | Data subject deceased | Conditional |
| `contract_ending` | Fixed-term contract in final 30-60 days | Conditional |
| `rehire_eligible` | Terminated but eligible for rehire | Conditional |

**Supporting fields:**
- `status_reason` — granular reason code for the status (e.g., `parental`, `performance`, `age_based`)
- `status_effective_date` — when the status became current (bitemporal support)
- `rehire_eligible` — boolean flag indicating rehire eligibility (conditional for `terminated`, `retired`)

## Governance

Edges from this type are gated by **consent** — the data subject grants scope. The traversal predicate refuses paths a purpose token cannot satisfy.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
