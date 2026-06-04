# People Graph 360 — Addendum, Competitive Sweep

**Author:** Eglin (industry research)
**For:** §XI Addendum, paired with Forge's architecture explainer
**Date:** 2026-06-03
**Length:** ~2,100 words
**Scope:** Who has actually attempted to re-architect the HR backend as a substrate / graph / unified object model — what shipped, what was marketing, what failed, and where Stratum stands.
**Cross-links:** [Landscape — HCM AI Platforms, mid-2026](/intel/eglin/landscape/hcm-ai-platforms-2026.html) · [Cornerstone battlecard](/intel/eglin/competitors/cornerstone.html) · [People Graph 360 §III competitor matrix](/research/people-graph-360.html#s3)

---

## Headline finding

**One vendor in HCM has actually re-architected the backend as an object substrate. It is Workday, and it did this two decades ago.** Workday's Object Management Service (OMS) — designed by Aneel Bhusri and Dave Duffield in 2005, disclosed in the 2012 S-1, and documented by Workday Engineering in 2018 — is an in-memory object graph that treats the SQL database as a key-value persistence layer rather than as a relational store. Traversals happen in memory, not as SQL joins. By the definition this paper uses for "substrate-shaped," OMS qualifies *inside the Workday suite boundary*. It does not extend to systems Workday does not own; it was never designed to.

Everyone else in the HCM substrate conversation is doing one of three things: (a) shipping a recommendation layer over their own corpus and calling it a graph (Eightfold, Gloat, Cornerstone), (b) running a strongly-normalized relational model with consistent IDs inside a single tenant and calling that a graph (Rippling, HiBob, Lattice, Deel), or (c) building integration plumbing across HRIS systems they don't own and not claiming graph storage at all (Merge, Finch, Kombo, Apideck).

**Stratum is not first at "object substrate for HR." Workday was, in 2005.** Stratum is first at a narrower, harder thing: a *cross-system, identity-resolved, time-aware, consent-bound* people graph that lives outside any single suite. That is a real distinction, but it needs to be drawn carefully. "Stratum is the first cross-system substrate" is honest. "Stratum invented the substrate idea for HR" is not.

The vendor I expected to belong on this list but on inspection did not: **Rippling**. The "Employee Graph" branding is positioned as a substrate; the publicly-described capabilities resolve to workflow orchestration over a normalized relational model. The strongest startup attempt I had not previously logged: **Windmill**, $12M seed April 2026, building what it calls a "context graph" for workforce evidence. It is a recommendation surface over existing tools rather than a substrate, but it is the freshest explicit graph-positioning attempt in the lane.

---

## 1 · Workday's Object Management Service: the only deep substrate attempt in HCM

The Object Management Service is the load-bearing case, and the existing competitor matrix in §III under-credits it. Eglin's earlier read positioned Workday's graph claim as "Skills Cloud is graph-shaped, the rest is relational." That framing is too soft. The primary documentation — Workday's 2012 S-1 IPO filing, the 2018 Workday Engineering Medium post on OMS architecture, and decades of Bhusri keynotes — supports a stronger reading: **the entire Workday backend is, by architectural intent, an object model, not a relational schema with object framing.**

Verified, from primary sources:

- The S-1 (October 2012) describes the technology foundation explicitly as "object-oriented technology framework" and "in-memory data management" alongside multitenancy and mobility ([SEC S-1, 2012](https://www.sec.gov/Archives/edgar/data/0001327811/000119312512375787/d385110ds1.htm)).
- The Workday Engineering post (March 2018) describes OMS as a cluster of Java services that "loads all business objects into memory as it starts up" and notes that, post-startup, OMS "doesn't rely on the SQL database for read operations." The SQL database is used "as a key-value store rather than a relational database" ([Workday Engineering, 2018](https://medium.com/workday-engineering/exploring-workdays-architecture-73c5dbbffc35)).
- The object model defines both structure (classes, relationships, attributes) and logic (methods), expressed as metadata. XpressO is the proprietary application language whose runtime is OMS itself.

The honest read of the architecture: this is an in-memory object graph with persistence externalized to a key-value-shaped SQL backing. Traversals over the model happen in memory; complex queries over employees, organizations, charts of accounts, and the relationships among them do not become SQL join trees. That is what a substrate is supposed to look like. The match against the §I definition of a people graph fails on three dimensions, but it is closer than any other shipped HCM system to passing on the others.

Where OMS does *not* match the people-graph definition in this paper:

- **Cross-system identity resolution.** OMS is exclusively internal to Workday. Identity inside OMS is the Workday worker object; reconciling a Maria López record from Greenhouse, Slack, and an external LMS into the same logical person is not OMS's job. Integration Services run alongside OMS and move data across the suite boundary, but they do not extend the object model outward. That is the design intent — Workday was always a suite play — and that is why OMS, although deeply substrate-shaped, is not the artifact the Chairman is describing when he talks about Stratum's substrate.
- **Time as a first-class edge.** Workday models effective-dated data well for transactional HR purposes (the effective-date pattern is older than Workday itself). Whether that constitutes "time as a first-class graph dimension queryable by traversal" is a separate claim and not one the public documentation makes.
- **Per-edge consent metadata.** No public Workday documentation describes per-relationship consent at the storage layer. Consent in Workday is enforced at the access-control and reporting-policy layer.

**The correct credit:** Workday genuinely re-architected the HR backend. OMS is not marketing; it is a working, twenty-year-old object substrate that has scaled to 11,000+ customers and runs the back office of much of the Fortune 500. The reason Workday wins large deals on architecture is that OMS is real. Anyone trying to make the substrate case in HCM and ignoring this is being dishonest.

**The correct distinction:** OMS is a substrate for Workday-owned data. Stratum's people graph is positioned as a substrate for the customer's HR-data perimeter, including the systems Workday does not own. Different shape, different scope. Both are legitimate substrates. The Stratum claim is that, in a world where no buyer runs only Workday (every Workday customer also runs ATSes, LMSes, directories, credentialing systems, and payroll providers Workday does not natively own), the cross-system substrate is the new architectural surface.

## 2 · The Force.com lineage

The substrate idea did not start in HR. Bhusri's product instincts at Workday and Marc Benioff's at Salesforce share genealogy — both were PeopleSoft alumni who left to build metadata-driven multi-tenant SaaS. Force.com (the metadata-driven application platform underneath Salesforce, GA 2007) is the architectural precedent for OMS in spirit: applications defined as metadata over a flexible storage layer, not as schemas over a relational database. Workday OMS is the HR-domain instantiation of that idea; Force.com is the CRM-domain instantiation.

The takeaway for the Chairman's question: **the substrate-shaped backend is not a 2026 invention.** It was the dominant architectural idea for multi-tenant SaaS twenty years ago. What is new in 2026 is the *cross-vendor* version — a substrate that sits *between* the metadata-driven backends of Workday, Salesforce, ServiceNow, Microsoft, and the rest, rather than inside any one of them. That is the part nobody has shipped. Stratum's claim is to that scope.

## 3 · The graph-as-recommendation-layer cluster: Eightfold, Cornerstone, Gloat

Three vendors that say "graph" and mean architecturally similar things: an inference layer over the vendor's own corpus.

**Eightfold** is the most graph-native of the three. The Talent Intelligence Platform combines a deep skills inference layer with embeddings trained on a very large external talent corpus, and Eightfold's public materials describe the underlying shape as graph-and-embedding rather than pure relational. The §III matrix rated this "Partial graph + ML," and that holds. The open question — never publicly answered — is how Eightfold resolves identity across the customer's *internal* HRIS, ATS, and LMS once a candidate becomes an employee. Until that is documented, Eightfold is a candidate-talent graph with an employee-talent extension, not a full HCM substrate.

**Cornerstone** ships an inference layer and calls it a graph. The May 20, 2026 Workforce AI launch introduced Cornerstone People Graph™ and the Cornerstone Skills Engine as the substrate beneath eleven-plus "readiness agents," with claimed scale of 45M users, 1B workforce profiles, and a 55,000-skill taxonomy. By Cornerstone's own description, this is an inference layer over Cornerstone's longitudinal corpus — powerful inside the Cornerstone footprint, scoped to what Cornerstone already sees. Eglin found no public documentation of identity resolution across systems Cornerstone does not own, of time-aware edges, or of per-edge consent metadata. The Cornerstone battlecard treats this as the cleanest negative example of the §I sixth-distinction problem; that read stands. See the [Cornerstone battlecard](/intel/eglin/competitors/cornerstone.html) for the full read.

**Gloat** has built the most concrete substrate-shaped edge inference of the three. The Loomra Workforce Context Engine combines a workforce knowledge graph, semantic embeddings, skills inference, and career-trajectory modeling. The published example — inferring change-management capability from a PMP certification plus three digital-transformation projects — is the kind of edge a real graph produces. The scope is bounded: Gloat is a talent-marketplace layer atop one HRIS, not a substrate for the entire employee lifecycle.

Pattern across the three: graph-as-recommendation works in a bounded domain. None of these are cross-system substrates. None claim to be.

## 4 · Infrastructure graphs at scale: LinkedIn and Microsoft set the engineering bar

LinkedIn's Economic Graph is the reference architecture for graph-at-scale. LinkedIn Engineering publicly documents a distributed graph database holding tens of TB at roughly 500K QPS, and the 2018 SIGKDD paper describes the Economic Graph in detail. It is the external graph — not a people graph for any single company — but it sets the engineering bar that any internal people graph has to meet.

Microsoft Graph is a real, large, public-API graph over Entra identity, mail, calendar, files, and Teams. It is not a *people* graph in the HCM sense; identity in Microsoft Graph is the Entra account, not an entity-resolved human across HRIS / ATS / LMS / payroll. It is the identity layer that nearly every HCM agent in 2026 has to interoperate with. Eglin's read remains: in 2026, every HCM people graph will need to call Microsoft Graph; few will be subsumed by it.

These two are evidence of what's possible, not competitors in the substrate conversation. They are the part of the answer the Chairman should give when an outsider asks "is the technology even possible?" Yes — at LinkedIn scale, in production, for a decade.

## 5 · The row-store-with-graph-marketing tier

**Rippling.** Rippling brands its core data model as the "Employee Graph" and positions it as the substrate for cross-functional workflows (IT, payroll, devices, permissions). The publicly described capabilities — reading roles, locations, and reporting structure into downstream systems — are workflow-orchestration features, not graph traversal. Eglin's read: a strongly-normalized relational model with consistent identity *inside* the Rippling tenant. Useful, but not a substrate in the §I sense. It does not ingest and resolve identity from outside Rippling's own data plane. This was the vendor I most expected to belong on the substrate list after a serious look. On inspection it does not.

**HiBob, Lattice, Deel, ChartHop, Personio.** Modern HRIS and people-analytics vendors with strong UX and APIs. None publishes primary architecture documentation describing a graph storage model. All resolve, on inspection, to relational models with API surfaces over them. "Headless HRIS" as a marketing frame describes UI-and-API decoupling, not storage substrate. There is no substrate claim to evaluate here; there is product positioning that uses graph-adjacent language.

## 6 · Substrate-database tech on HR: Datomic, Dgraph, Neo4j, FoundationDB, TerminusDB

The honest answer: no HR vendor has publicly shipped on any of these as the primary HR substrate. Some use Neo4j or similar for adjacent features (skill ontologies, org-chart visualizations); none has published a primary architecture statement that the system of record runs on a graph database. If anyone is building on Datomic or TerminusDB for HR, they have not put their name on it.

This is one of the more telling negative findings in the sweep. The substrate-database vendors have spent ten years selling into financial services, telecoms, and fraud-detection; HR has not been a notable adopter. That gap is the gap Stratum is positioned into.

## 7 · The startup scan: Merge, Finch, Kombo, Apideck — and Windmill

**Merge, Finch, Kombo, Apideck, Nango, Truto** are unified-API platforms for HRIS / payroll / ATS / LMS integration. They make heterogenous backends look like one API. They do not store the data persistently as a substrate; they sync (Merge, Kombo) or pass through (Apideck) and normalize. They are infrastructure for *talking to* HR systems, not infrastructure for *being* one. None of them claims substrate-shape, and that's correct positioning — they're integration plumbing, not a graph.

The interesting startup here is **Windmill** (Inspired Capital-led $12M seed, April 2026; founders Max Shaw, Brian Distelburger, Mark Tanner). Windmill positions itself around a "context graph" of workforce evidence, drawing from Slack, GitHub, Google Workspace, and ~30 other tools, organized in four layers (People, Evidence, Expectations, Perspectives). On inspection, the context graph is a recommendation-and-evidence surface, not a substrate — each data point is tied to a source, but the persistent store is not described as a graph database and identity resolution across HRIS / ATS / payroll is not the load-bearing claim. It is closer to a workforce-evidence layer for performance reviews than to a substrate. But it is the freshest explicit graph-positioning attempt in the lane, it is funded, and it is worth a battlecard within 60 days. If Windmill grows scope, it could converge toward the substrate claim from a different angle.

A handful of other names in the "people data infrastructure" lane — HrFlow.ai, Beamery's recruiting graph (covered in §III), Eightfold's talent intelligence — round out the surface area. None has shipped a cross-system, identity-resolved, time-aware, consent-bound substrate.

## 8 · Stratum, honestly

Stratum publishes a people-graph architecture as artifact. The four-MCP-server design (graph, console, recruiter, connectors), the decisions ledger, the agent outbox, the per-agent CLAUDE.md, and the bias-probe methodology are real, published, and inspectable. That is the structural Tier-C claim the [landscape brief](/intel/eglin/landscape/hcm-ai-platforms-2026.html) credits.

Where Stratum's claim is strongest:

- The cross-system, identity-resolved, time-aware, consent-bound shape is genuinely novel. Workday's OMS is substrate-shaped but stops at the suite boundary. Eightfold and Gloat and Cornerstone are recommendation-layer-shaped. The shape Stratum publishes is not duplicated anywhere I could verify.
- The governance-as-artifact posture (eval set, refusals, per-decision audit log, decisions ledger) is uncommon in HCM and is verifiable by inspection. Most competitors describe governance; Stratum publishes it.
- The MCP-native architecture is the right structural bet for 2026 — Workday ASOR, SAP Joule Studio, Oracle AI Agent Studio, and Cornerstone are all converging on MCP from the closed-suite side; Stratum is converging from the open side.

Where Stratum's claim is weakest:

- "Published architecture" is not "shipped at 50,000-employee customer scale." Workday OMS has been load-tested by twenty years of production traffic; Stratum has not. The substrate claim is structurally credible; the operational claim is still ahead of the evidence.
- The distinction between Stratum's people graph and a "Workday OMS extended cross-system" is real but subtle. Workday could plausibly position cross-system extension via ASOR + Agent Gateway as the same architectural endgame. The competitive line will be drawn on identity-resolution architecture and time-as-first-class-edge, not on the word "graph."
- Cornerstone's vocabulary capture on "People Graph™" (May 20, 2026) is a real editorial risk that the [Cornerstone battlecard](/intel/eglin/competitors/cornerstone.html) addresses. Stratum's claim has to be defended editorially as well as architecturally; the technical-depth page Compass and Forge are building is the right response.

The Chairman's quotable line, if he wants one: **"Workday re-architected the HR backend twenty years ago for the suite. Stratum is re-architecting it now for the cross-system world that suite-only never reached."**

## 9 · Summary table

| Vendor / system | Substrate attempt? | Architectural shape | Cross-system identity? | Time-aware edges? | Per-edge consent? | Eglin rating |
|---|---|---|---|---|---|---|
| Workday OMS | **Yes (1st generation)** | In-memory object graph + KV-shaped SQL persistence | No (suite-bounded) | Effective-dated; not graph-native | Not at storage layer | Verified substrate, bounded scope |
| Salesforce Force.com (precedent) | Yes (CRM domain) | Metadata-driven multi-tenant | n/a | n/a | n/a | Verified, out of HCM |
| Eightfold TIP | Partial | Graph + embeddings, vendor corpus | Not publicly documented | Not first-class | Not first-class | Claim ≠ substrate |
| Cornerstone People Graph™ | No | Inference layer over Cornerstone corpus | No | No | No | Claim only |
| Gloat Loomra | Partial | Workforce knowledge graph (bounded) | Single-HRIS | Not first-class | Not first-class | Verified bounded |
| Beamery Talent Graph | Yes (recruiting domain) | Semantic-web graph, 17B data points | External talent universe | Not first-class | Not first-class | Verified, recruiting-only |
| LinkedIn Economic Graph | Yes (reference architecture) | Distributed graph DB, ~500K QPS | External | Yes (career trajectories) | n/a (public data) | Verified, not a competitor |
| Microsoft Graph | Yes (identity domain) | Identity + collaboration graph | Entra-bound | Yes | n/a | Verified, not a people graph |
| Rippling Employee Graph | No | Normalized relational, single-tenant | No | No | No | Claim only |
| HiBob / Lattice / Deel / ChartHop | No | Relational HRIS with strong APIs | No | No | No | Marketing-graph only |
| Merge / Finch / Kombo / Apideck | No (and don't claim it) | Unified API integration plumbing | n/a (sync layer) | n/a | n/a | Not substrate-shaped, correctly positioned |
| Windmill (seed, April 2026) | Partial | Context-graph evidence layer | Not the load-bearing claim | Source-tagged | Source-tagged | Verified-bounded; watch |
| **Stratum people graph** | **Yes (cross-system shape)** | Cross-system property graph w/ entity resolution, time-aware edges, per-edge consent | Yes (design) | Yes (design) | Yes (design) | Structurally verified; not yet operationally proven at scale |

---

## Brief-back (under 200 words)

**Has anyone actually shipped a substrate-shaped HR backend, or is Stratum genuinely first?**
Workday did, twenty years ago, with OMS — the original competitor matrix under-credited this. OMS is a real in-memory object substrate, not a row-store with object framing. It is bounded to the Workday suite. Stratum is not the first to build an HR substrate; Stratum is the first to position a *cross-system* substrate. That distinction is honest but narrower than the prior framing implied.

**Most credible attempt (verified vs claimed).**
Workday's Object Management Service. Verified via 2012 S-1, 2018 Workday Engineering documentation, twenty years of operating evidence. The credit is overdue. The limit — suite-bounded scope — is real and is exactly the gap Stratum is positioned into.

**Vendor I expected to belong but on inspection didn't.**
Rippling. The "Employee Graph" brand is strong, but the publicly described architecture is workflow orchestration over a normalized relational tenant model — not graph storage and not cross-system identity resolution. Windmill, by contrast, is a fresh ($12M seed, April 2026) graph-positioning attempt I had not previously logged and should battlecard within 60 days.

---

## Sources

- [Workday S-1 IPO filing, October 2012 (SEC)](https://www.sec.gov/Archives/edgar/data/0001327811/000119312512375787/d385110ds1.htm)
- [Workday Engineering — Exploring Workday's Architecture, March 2018](https://medium.com/workday-engineering/exploring-workdays-architecture-73c5dbbffc35)
- [Personnel Today — Graph databases: the next big thing for HCM? (Josh Bersin commentary)](https://www.personneltoday.com/hr/graph-databases-the-next-big-thing-for-human-capital-management/)
- [Windmill $12M seed, April 2026 (justainews.com)](https://justainews.com/companies/funding-news/windmill-secures-12m-to-fix-how-companies-track-people/)
- [Stratum landscape — HCM AI Platforms, mid-2026](/intel/eglin/landscape/hcm-ai-platforms-2026.html)
- [Stratum competitor battlecard — Cornerstone](/intel/eglin/competitors/cornerstone.html)
- [Stratum People Graph 360 — §III competitor matrix](/research/people-graph-360.html#s3)
- LinkedIn Economic Graph: SIGKDD 2018 paper and LinkedIn Engineering blog (cited in §III sources [2], [8])
- Merge / Finch / Kombo / Apideck comparisons (Truto, Apideck, Nango blogs, 2026)
