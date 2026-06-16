---
type: index
chain: "Fork & Flame"
stores: 20
employees: 500
---

# Fork & Flame — HCM Universe Contextual Map

A contextual map of a 20-store, 500-employee casual-dining chain. Every entity is a note; every relationship is a wiki-link. Open the **graph view** to see the contextual map render.

## The HCM universe (entity types)

### People & identity

- [[type-person]] — A worker — the data subject at the center of HCM. _(basis: consent)_
- [[type-candidate]] — An applicant in the hiring pipeline (pre-hire person). _(basis: consent)_
- [[type-agent]] — An autonomous actor. Not a data subject — operates under authority the company extends; lifetime is its policy version, not a tenure. _(basis: delegated_authority)_

### Organization

- [[type-organization]] — The chain itself — the root org unit. _(basis: authorization)_
- [[type-region]] — A geographic market grouping of stores (org_unit level). _(basis: authorization)_
- [[type-department]] — A functional grouping (Kitchen, Front of House, Bar, Management). _(basis: authorization)_
- [[type-store]] — A restaurant location as an operating unit (org_unit + a physical location). _(basis: authorization)_
- [[type-position]] — A job template (Line Cook, Server, GM...) with a pay band. _(basis: authorization)_
- [[type-role]] — An employee holding a position at a store (the instance of employment). _(basis: authorization)_

### Place

- [[type-location]] — A physical/legal place — jurisdiction, data-residency, badge zone. Distinct from a store's org grouping. _(basis: authorization)_

### Scheduling & work

- [[type-shift]] — A scheduled work block at a store (daypart, date, crew). _(basis: authorization)_
- [[type-schedule]] — A store's published schedule for a week. _(basis: authorization)_
- [[type-time_off_request]] — A worker's PTO / unavailability request. _(basis: consent)_

### Compensation

- [[type-pay_rate]] — A worker's pay rate (hourly or salary) — sensitive personal datum. _(basis: consent)_
- [[type-tip_pool]] — A store's tip-distribution pool for a period. _(basis: authorization)_
- [[type-benefit_plan]] — A benefits offering (health, 401k, meals). _(basis: authorization)_

### Skills & compliance

- [[type-skill]] — A competency used to staff and develop people. _(basis: authorization)_
- [[type-certification]] — A personal credential (food safety, alcohol service) with an expiry — compliance-bearing. _(basis: consent)_
- [[type-training_record]] — A completed training event for a worker. _(basis: consent)_

### Performance & lifecycle

- [[type-performance_review]] — A periodic review of a worker. _(basis: consent)_
- [[type-employment_event]] — A lifecycle event (hire, promotion, transfer, termination) — bitemporal. _(basis: consent)_
- [[type-onboarding_task]] — A checklist item in a new hire's onboarding. _(basis: authorization)_

### Systems & governance

- [[type-device]] — A POS terminal or tablet at a store (deterministic key). _(basis: authorization)_
- [[type-policy]] — A governance policy an agent operates under. _(basis: authorization)_
- [[type-consent_grant]] — A recorded consent — the grantor, scope, purpose, validity. The traversal predicate reads these. _(basis: consent)_

## Instances

- [[Fork & Flame]] — the organization
- **Regions** — [[West Region]], [[South Region]], [[Midwest Region]], [[Northeast Region]]
- **Stores** (20) — see the `Stores`/`Locations` folders
- **People** (500) — see the `People` folder
- **Agents** — [[Scheduling Agent]], [[Hiring Agent]], [[Compliance Agent]]
- **Candidates** (hiring pipeline), **Positions, Departments, Skills, Certifications, Shifts, Schedules, Events, Reviews, Time Off, Training, Onboarding, Compensation** (tip pools), **Devices, Benefits, Governance** (policies + consent grants)
