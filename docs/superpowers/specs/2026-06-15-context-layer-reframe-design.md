# The Context Layer: reframing the people graph for the agentic enterprise

**Status:** Ratified direction — architecture spec (pre-plan)
**Date:** 2026-06-15
**Author:** Helm (CEO), synthesizing the Compact + founding-engineer panel
**Decision class:** Tier-3 (Compact-level), ratified by the Chairman
**Panel:** Forge (CTO), Pillar (Data Infra), Kernel (AI/Agents), Compass (CCO), Eglin (Research), Tessera (Design)

---

## 1. The decision

The Chairman proposed reframing the "people graph" as a "contextual map" and generalizing
it from person-centric to any organizational entity (agent, team, department, business
unit, location, device, organization), on the thesis that this makes the substrate "much
more scalable."

Research corrected two premises and confirmed the third. The ratified direction:

1. **Naming — adopt the "context layer" frame** (the market-winning category term), *not*
   "contextual map" (an invented category with no analyst/SEO tailwind). Customer-facing
   positioning becomes **"the context layer your HCM agents read from."** Engineering
   credibility artifacts keep the precise term **"graph."**
2. **Scope — go big now.** Generalize the entity model and ship the uniform
   agent-facing interface this program, accepting (and mitigating) the cardinality,
   hotspot, and governance-vocabulary risks the team flagged.

Two findings make this a sharpening rather than a re-architecture:

- **The substrate is already multi-entity.** `org_unit`, `role`, `requisition`,
  `candidate`, `skill`, `event`, `cairn_stone` already exist alongside `person`. This is
  naming + first-classing a few entities + one new interface — not a schema rewrite.
- **The scalable asset is an interface, not more nodes.** Materializing every entity as a
  fully-edged node *worsens* the two unsolved problems in substrate §IX (cardinality,
  hotspots). The durable, scalable thing is a uniform contextualization call.

## 2. Non-negotiable correctness constraints (hold even under "go big")

- **C1 — Deterministic keys do not get probabilistic ER.** `device` matches on serial /
  asset tag / MAC; `location` on building/campus code. The τ=0.93 probabilistic matcher
  is never run on these. A false device merge is a security incident, not a data-quality
  blip. First-class the node; resolve it deterministically (or join an external registry
  at query time).
- **C2 — Governance basis leads.** No edge ships labeled "consent" on a non-consenting
  entity. The orthogonal plane is re-grounded *before* new entity types land.

## 3. The governance-basis model (foundational — Workstream A)

The consent/governance plane (substrate §VI) is person-shaped: it filters traversals on a
data-subject's consent. Generalizing to non-consenting entities requires re-grounding the
plane as a **governance basis** with three species, all expressed through the same
traversal-predicate *mechanism* (which is basis-agnostic and ports cleanly):

| Species | Applies to | Grantor | Lifetime |
|---|---|---|---|
| **Consent** | person | the data subject | consent grant validity |
| **Authorization** | device, location, org_unit, external_org | the institution | policy validity |
| **Delegated authority** | agent | the company extending it (per §X) | the agent's policy-version |

Audit note (Forge, DPO): a `device—assigned_to—person` edge still carries the *person's*
consent. Non-person entities therefore add a *second* basis an edge must satisfy — they do
not simplify the plane. The schema vocabulary must name the species explicitly so an
auditor never reads "consent" where no subject consented.

## 4. The interface (the durable asset — Workstream B)

A single uniform call, generalizing the Ember read-only-traversal loop from candidates to
any entity:

```
context(entity_ref, purpose_token, requestor, token_budget)
    → governance-gated subgraph, salience-ranked, provenance inline,
      shaped for an agent's context window
```

- **Governance-gated** — path expansion filters edges the `(requestor, purpose)` pair
  cannot satisfy *before* the agent sees them (§VI: "cannot leak what it has not loaded").
- **Salience-ranked under a token budget** — the genuinely new engineering. Default rank
  `≈ edge_confidence × recency × purpose_relevance`. Today's traversals use product-specific
  `LIMIT`/`ORDER BY`; a uniform interface needs a principled default. *This is an open
  problem the program creates, not a solved feature.*
- **Provenance inline** — every edge carries its bitemporal stamp + governance grant, so
  the §VI auditor argument holds for any entity.
- **k-anonymity on coarse entities** — `context(department)` / `context(location)` can
  re-identify a person in aggregate from individually-consented edges. Minimum-cohort
  thresholds are enforced at the interface. (Workstream F gates release.)

## 5. Entity verdicts under "go big"

| Entity | Treatment | Notes |
|---|---|---|
| team / department / business unit / internal org | `org_unit` recursion (v3.x ratification) | Hierarchy-level discriminator; not new node types |
| group | projection (stored predicate) | A saved cohort, not an actor |
| **agent** | **first-class — new node type (v6 additive)** | §X sibling of `person`; shares identity + governance basis; lifetime = policy version. The §X "vote" is ratified by this decision. |
| **location** | **first-class node**, hotspot-aware | Deterministic key (C1). Justify by facts on the location itself (jurisdiction, residency, badge-zone) — not facts derivable from occupants. Hub-shaped → Workstream E gates it. |
| **device** | **first-class node**, deterministic resolution (C1) | Or external-registry join at query time where ingestion isn't warranted |
| external organization | start the W3C Org / schema.org crosswalk | The hard ER case; deterministic where keyed, probabilistic band only with a labeled set |

## 6. Repositioning scope (Workstream D)

- **Becomes "context layer" (customer-facing):** homepage hero, `customers/`, `pricing/`
  + `calculator.html`, `essays/`, Console eyebrow ("grounded in your org's context"),
  Console People tab h2. Lead sentence candidate: *"Stratum is the context layer your HCM
  agents read from — every decision traceable to the data behind it, on a graph substrate
  rigorous enough to put in front of your board."*
- **Stays "graph" (engineering credibility artifacts):** `people-graph-whitepaper.html`,
  `people-graph-substrate.html`, `people-graph-schema-reference.html`,
  `people-graph-standards.html`, `people-graph-playground.html`,
  `eval-set-methodology.html`. URL slugs unchanged (no redirect/SEO rebuild) — the
  *displayed* phrase changes, not the path.
- **SEO/category:** target "context layer" + "HCM" — white space Glean owns horizontally
  but no one owns for HCM.

## 7. Workstream decomposition (each gets its own spec → plan)

| # | Workstream | Owner | Depends on |
|---|---|---|---|
| **A** | Governance-basis re-grounding (consent/authorization/delegated) | Forge | — (leads) |
| **B** | `context()` interface contract + Ember generalization | Kernel | A |
| **C** | Entity model: `org_unit` recursion (v3.x), `agent` + `location` + `device` (v6) | Pillar | A |
| **D** | "Context layer" repositioning across customer surfaces | Compass + Tessera + Eglin | — (parallel) |
| **E** | Cardinality/hotspot hardening (CEO-node class, p99 1.8s → target) | Pillar + Forge | gates C's hub entities |
| **F** | Eval-set v2 cross-entity probes (injection + salience bias) | Kernel | gates B release |

**Sequencing:** A leads. B and C follow A in parallel. E accompanies C (hub entities).
F gates B's release. D runs in parallel throughout (mostly content).

**First sub-project to plan in detail:** Workstream A (governance-basis), because B, C,
and the audit posture all depend on it.

## 8. Risks accepted (with mitigations)

| Risk | Source | Mitigation |
|---|---|---|
| Hotspot detonation from first-classing hub entities | Forge §IX.2 | Workstream E gates C; location justified only by own-facts |
| Cardinality / edge-type ceiling (41 → 60) | Pillar §IX.3 | Recursion not new types for org; device via registry where possible |
| Governance-vocabulary erosion under audit | Forge (DPO) | C2 + Workstream A leads |
| Non-person positioning is ~12–18mo early | Eglin (med. conf.) | Ship the capability + the "context layer" frame now; hold device/location *GTM* until a customer asks |
| Aggregation re-identification on coarse entities | Kernel | k-anonymity at the interface; Workstream F |

## 9. Homepage / briefing obligation

Per project convention, this ratified decision is a major Stratum update. On implementation
kickoff it lands in the `index.html` live ticker (both `.ticker-strip` blocks) and the next
Briefing records it as a decision taken (the "context layer" reframe + entity
generalization + governance-basis re-grounding). Not done at spec stage (HARD-GATE).

## 10. Open problems this program creates (stated honestly)

1. Salience ranking for the uniform interface (no principled default exists yet).
2. k-anonymity thresholds on coarse-entity context.
3. External-organization entity resolution below the alumni-precision floor.
4. Hotspot latency on newly first-classed hub entities.
