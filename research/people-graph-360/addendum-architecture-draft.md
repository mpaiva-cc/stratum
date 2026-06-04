# §XI Addendum — Two architectures, one employee.

*A walked-through example for the Chairman, intended as pedagogical material for the substrate-vs-row-store conversation. Drafted by Forge, 2026-06-03, for integration into the People Graph 360 brief. Voice and citation style match §I–§X.*

---

The brief above argues that the substrate underneath agentic HCM has to change — that the question "what is this person, across everything we know about them?" cannot be answered well by the row-store HRIS that the previous era settled on. §VI made the argument structurally, with a table. This addendum makes the same argument by walking one employee through both architectures, end to end, so that the difference is felt rather than asserted. The Chairman has asked for a version of this section he can use in conversation. The example below is the one I would use.

I will call her **Maria Santos** — to be distinguished from the Maria López who appears as the entity-resolution example in §I. Maria Santos is a senior software engineer at a fictional 4,800-person company called *Helix Bio*. She joined Helix two years ago through an acquisition; before that, she spent four years at a startup called *Arroyo Labs*, which Helix bought. She has been promoted once, completed three internal courses, holds a closed-out performance cycle, owns two active goals, and is on a payroll plan that changed twice in the last eighteen months. She is, in other words, a perfectly ordinary mid-career employee with a perfectly ordinary employment history. She is also the kind of person every HCM question is actually about.

## XI.i — The row-store paradigm, walked through.

The HRIS that holds Maria's record at Helix is the modal one: a relational database with separate schemas (or, in the more old-fashioned deployments, separate physical databases) for each functional module. The vendor markets the suite as integrated. Architecturally, it is not integrated — it is *co-located*. Onboarding, Recruiting, Payroll, Performance, Goals, and Learning are each a row store with its own primary keys, its own notion of what a person is, and its own way of remembering the past.

To make the shape concrete, here is a stripped-down inventory of where Maria's information actually lives in such a system. I am compressing — a real Workday or SuccessFactors deployment will have closer to forty tables per module — but the topology is faithful.

| Module       | Primary table              | Maria's key in that table | What it stores                                                |
| ------------ | -------------------------- | ------------------------- | ------------------------------------------------------------- |
| Recruiting   | `ats_candidate`            | `cand_id = 91142`         | her application to Arroyo Labs in 2020, status `hired`        |
| Onboarding   | `onb_employee_session`     | `onb_id = 30714`          | her I-9, NDA, badge-pickup checklist from 2020-08-03          |
| Core HR      | `hr_employee` (with SCD2)  | `emp_id = 28119`          | her name, badge, position, cost center — versioned over time  |
| Payroll      | `pay_worker`               | `worker_id = 7782`        | her pay group, tax jurisdiction, direct-deposit allocations   |
| Performance  | `perf_cycle_participant`   | `participant_id = 14883`  | her 2024 mid-year cycle, ratings, calibration outcomes        |
| Goals        | `goals_objective`          | `obj_id = 55204, 55207`   | her two active goals, owner, parent-OKR linkage               |
| Learning     | `lms_enrollment`           | `learner_id = ARRY-8821`  | her three completed courses, scores, credential issuance      |

Seven primary keys for one person. Notice the **`ARRY-8821`** in the LMS row — that is the legacy Arroyo Labs learner ID, which the post-acquisition migration left in place because the LMS vendor charged extra to re-key. Notice that the Recruiting key dates to a *different company entirely* (Arroyo, not Helix), which means the application-to-employment link inside Helix's own ATS is severed unless someone wrote a custom join table to reconnect them. Most of the time, no one did.

Time, in this paradigm, is handled with a pattern called **slowly-changing dimension type 2** — SCD2, if you encounter it again. The idea is straightforward: instead of overwriting a row when a fact changes, you insert a new row with `valid_from` and `valid_to` columns and mark the old row closed. So Maria's `hr_employee` table does not contain one row for Maria — it contains nine rows for Maria, one for each promotion, transfer, manager change, and cost-center reassignment since 2020. Querying "who reported to Devon on August 4, 2024" then requires, in SQL, that you remember to filter every joined table on `valid_from <= '2024-08-04' AND valid_to > '2024-08-04'`. If you forget one of those predicates on one of those tables, you get a silently wrong answer. This is the principal hazard of warehouse-style time: it is *the analyst's responsibility to remember to ask for the right point in time*, on every table, every time.

Now suppose an executive asks a question that crosses the acquisition boundary: **who reports to whom across the Arroyo and Helix entities, today, restricted to people who joined through the Arroyo deal?** In the row-store world, this is not a question — it is a project. The SQL has to (a) join `hr_employee` to itself recursively to walk the reports-to chain, (b) join to `pay_worker` to find the legal-entity stamp that identifies Arroyo-origin employees, (c) join to the merger reconciliation table that someone built in 2024 to reconnect Arroyo's old IDs to Helix's new ones, (d) apply SCD2 predicates on every joined table for "today," and (e) handle the not-uncommon case where Maria's manager-of-record in `hr_employee` disagrees with her dotted-line manager in the org-chart tool because the latter is not part of the HRIS. The query is twelve to fifteen joins, two recursive CTEs, and at least one human judgment call about which manager field is "real." It takes a competent analyst a half-day to write and a warehouse cluster a few minutes to run. The answer, when it arrives, is a CSV. The next time someone asks the question, the analyst writes the query again, slightly differently, because nobody remembered to save it.

Consent, in this paradigm, lives in a separate table — typically `consent_grant`, keyed by `subject_id` and `purpose_id` — and is enforced either by row-level security policies (modern stack) or by an application-layer check that the developer remembered to write (older stack). The structural property to notice is that consent is *external to the data*. It is enforced at query time, by a layer that has to know what the query is for. An agent that issues an open-ended traversal — *which engineers two hops from Maria have completed the AI-safety course?* — cannot easily be governed by row-level security, because row-level security expects you to declare the access pattern in advance. The agent does not declare; the agent reasons.

This is the world the incumbent HCM is built for. It is a perfectly fine world for finance reporting, for headcount snapshots, for the CHRO's board pack. It is a deeply hostile world for any question that does not arrive in the shape of a pre-declared SQL.

## XI.ii — The substrate paradigm, walked through the same person.

The substrate underneath Stratum's product is a labeled property graph. Maria Santos is not seven rows in seven tables. She is **one node** — a `Person` node — with a single canonical identity that the entity-resolution pipeline produced from the seven source records above. The mechanics of how that identity was produced — the four-stage resolver, the probabilistic blocking, the graph-confirmation pass that catches the contractor-to-employee transitions, the conflict queue that Pillar reviews — are the subject of [Essay No. 02](/essays/the-graph-between-the-databases.html). This addendum will not re-litigate them. The premise here is just that the cluster exists: one node, with provenance back to all seven source rows, available for traversal.

Around that node hang the things Maria *is* and the things Maria has *done*, expressed as other nodes connected by edges:

```
(Person:Maria Santos)
    ├──[:hired_into, valid_from:2020-08-03, source:ats_arroyo]──> (Role: Engineer II, Arroyo)
    ├──[:promoted_to,  valid_from:2022-01-15]──────────────────> (Role: Senior Engineer, Arroyo)
    ├──[:absorbed_into, valid_from:2024-03-01, event:M&A]──────> (Role: Senior Engineer, Helix)
    ├──[:reports_to,   valid_from:2024-03-01, valid_to:2025-08-12]──> (Person: Devon)
    ├──[:reports_to,   valid_from:2025-08-13, valid_to:∞]──────> (Person: Aisha)
    ├──[:completed,    valid_from:2023-11-04, source:lms]──────> (Course: AI Safety 101)
    ├──[:owns,         valid_from:2026-01-08]──────────────────> (Goal: Ship Cairn v1)
    ├──[:assessed_in,  valid_from:2024-07-01, rating:exceeds]──> (PerfCycle: 2024H1)
    ├──[:paid_under,   valid_from:2025-04-01]──────────────────> (CompPlan: SE-IV-2025)
    └──[:holds_skill,  confidence:0.91, attested_by:peer-review]> (Skill: distributed-systems)
```

Three structural properties to notice, because they are the load-bearing difference.

**One: time is on the edges, not on the rows.** The fact that Maria reported to Devon from March 2024 to August 2025, and to Aisha since, is two `reports_to` edges with `valid_from` and `valid_to` properties. There is no SCD2 ceremony, no closed-row pattern, no analyst-discipline-required predicate. The question "who reported to Devon on August 4, 2024" is a single traversal — *find all `reports_to` edges into `Person:Devon` where `valid_from <= '2024-08-04' < valid_to`* — and the time argument is uniform across every edge type. The query against today's graph and the query against the August-2024 graph are the same query with a different parameter.

**Two: identity is the cluster, not the source key.** The seven source records that the row store kept as seven separate keys are, in the substrate, *provenance edges* into a single canonical `Person` node. The Arroyo learner ID and the Helix employee ID are not different rows about different objects — they are different *attestations* about the same object, each carried as a property on a `provenance` edge with a source-system tag, a confidence score, and a consent scope. When someone asks "did Maria complete the AI Safety course," the traversal walks from `Person:Maria` to `Course:AI-Safety-101` through whichever attestation has the highest confidence and is consent-permitted for the asking agent. The acquisition boundary, which broke the row store, is just a property on an edge.

**Three: consent is on the edges, not in a separate table.** The `assessed_in` edge that links Maria to her 2024 performance cycle carries a `consent_scope` property — say, `{managers, perf-calibration-agents, hr-business-partners}`. An agent that is not on that list does not see the edge. It is not blocked at query time by a row-level security layer; it is *structurally invisible* to the traversal. The right-to-be-forgotten request becomes a bounded subgraph delete — the `Person` node, every incident edge, and every provenance pointer — rather than a multi-system reconciliation project across seven row stores.

The acquisition-boundary question — *who reports to whom across the Arroyo and Helix entities, today, restricted to people who joined through the Arroyo deal* — becomes, in this paradigm, a four-line traversal: start from any `Person` node whose `hired_into` edge has `source:ats_arroyo`, follow `reports_to` edges valid at the query time, return the chain. Twelve-to-fifteen joins collapse to one neighborhood walk. The answer arrives at interactive latency. The next person who asks does not need an analyst.

## XI.iii — What changes when an agent shows up.

§VI of the brief already establishes the structural argument. The agent-facing implication is the one that matters for the Chairman's conversation: **a row-store agent is a doer of JOINs; a substrate agent is a reasoner over neighborhoods.**

A row-store agent, to do its job, has to learn the schema — seven modules, forty tables per module, the SCD2 convention, the merger reconciliation table that someone built in 2024 — and then write SQL against it. It has to remember, every time, to apply the temporal predicates. It has to know which consent table governs which access pattern, and to ask permission *before* the query, in a shape the consent system can recognize. It has to know that the ATS-to-HRIS join is severed and that someone wrote a custom bridge. When the schema changes, the agent breaks. When the consent model changes, the agent leaks. The agent's reliability is bounded by the discipline of the schema documentation, which in every HCM deployment I have audited is out of date by between three and eighteen months.

A substrate agent does not write JOINs. It traverses. The schema *is* the graph — node types and edge types — and the schema is small (Stratum's customer graphs are typically twelve node types and twenty-three edge types). Time is a parameter to traversal, not a predicate to remember. Consent is a property of the edges the agent can reach, not a check it must perform. The agent's reliability is bounded by the resolver's precision-recall and by the graph's coverage — both of which are measurable, publishable, and the subject of Stratum's eval-set methodology. The agent is doing the thing language models are good at — reasoning over a small, well-typed neighborhood — instead of the thing they are bad at, which is writing twelve-join SQL against a schema they half-remember.

This is the argument under the argument. Substrate is not a faster row store. It is a *different kind of thing* for the agent to think against.

## XI.iv — The honest cost.

I owe the reader the symmetric account. There are questions the substrate is worse at, and a few of them are important.

It is worse at **batch analytics**. If you want to compute average tenure by cost center for the 10-K, the warehouse will give you that answer faster and cheaper than the graph. The graph is built for interactive neighborhood traversal at single-person granularity; the warehouse is built for aggregation across millions of rows. Use the right tool.

It is worse at **finance reporting**. The general ledger, the labor-cost roll-up, the headcount-versus-plan variance — these are columnar-warehouse problems, not graph problems. The substrate does not replace the warehouse for the CFO. It complements it.

It is worse at **point-in-time reconstruction of a single dimension**. If your auditor asks for the *exact* cost-center hierarchy as of December 31, 2024, with every node and every edge captured precisely as it existed at the boundary, the SCD2 warehouse pattern is genuinely well-suited to that and was built for it. The substrate can answer the question — the time-on-edges property makes it expressible — but the warehouse's row-by-row immutability is a sturdier audit posture for a single-dimension question.

The honest framing, then, is the one §VI already states: **the substrate complements the warehouse; it does not replace it.** Both exist in every Stratum customer deployment, fed by the same ingestion pipeline. The architectural mistake is not having both. It is using the warehouse alone for the questions that are structurally graph-shaped — the questions agents actually ask.

## XI.v — One example the Chairman can use.

If someone asks the Chairman what the difference is, this is the version I would suggest:

> *Every HCM system on the market is seven row stores in a trench coat — one for recruiting, one for payroll, one for performance, one for learning, and so on — joined together by foreign keys and held in line by an analyst's discipline. When the question fits the schema, it works. When the question is "who is this person across everything we know about her, who could replace her, who has done this kind of work before, what does her trajectory look like" — the question an agent actually asks — it does not work. The substrate underneath Stratum is one identity-resolved graph instead of seven row stores. Time is on the edges. Consent is on the edges. Identity is the cluster, not the key. The same question that took an analyst a half-day in the old world becomes a single traversal an agent can run in 200 milliseconds. We did not build a faster HRIS. We built a different shape of thing underneath it.*

The methodological discipline behind that claim — the resolver eval-set, the precision-recall numbers, the conflict queue throughput — is the subject of [Essay No. 02](/essays/the-graph-between-the-databases.html) and the eval-set publication tracked in §IX's Implication 02. The pedagogical version above is the version that travels in a conversation. The numbers are what defend it when the conversation gets technical.

— *Forge, 2026-06-03*
