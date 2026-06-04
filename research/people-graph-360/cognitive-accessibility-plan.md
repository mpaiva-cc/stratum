# People Graph 360 — Cognitive Accessibility Plan

A roadmap to make the People Graph architecture diagram understandable to readers with cognitive disabilities, non-technical stakeholders, and anyone reading the diagram cold.

**Location of the diagram:** Figma / Rebuild Experience Strategy / page "People Graph 360" — the column starting at x=2000.

---

## Why this plan exists

The architecture diagram is comprehensive and well-paced (vertical scroll, H2 layer rhythm, plain-named layers). But it still assumes the reader knows HCM, ATS, HRIS, MCP, ETL, "canonical person," "graph edges," and reads programmer-style identifiers.

A diagram is cognitively accessible when:

- Anyone unfamiliar with the domain can state its purpose in one sentence after reading the top
- Jargon is either eliminated or defined in plain language at first use
- Concrete examples ground abstract concepts
- The reading order is explicit, not implicit
- The same structure repeats predictably for every section
- The reader can stop at any point and still have learned something useful

This plan is the COGA (Cognitive and Learning Disabilities) Task Force guidance for WCAG 2.2 applied to a strategy artifact.

---

## Phases

### Phase 1 — Anchor the purpose at the top **[DONE 2026-05-23]**

Replace the minimal title block with a Reader's Guide panel:

- Plain-English headline: *"One place that knows everyone who works for you"*
- Technical subtitle below (kept for expert readers)
- One-line elevator pitch in italic Newsreader
- Three columns: **What this shows** · **Why it matters** · **How to read it**

The third column gives explicit numbered reading steps. Anyone landing on the diagram can read just the top panel and walk away knowing what it's for.

### Phase 2 — Plain-language subtitle per layer **[PENDING]**

Each layer's tagline becomes a "What it does · Why it matters" pair in everyday language:

| Layer | Current technical tagline | Add: plain-language pair |
|---|---|---|
| 07 | "What it feels like when the graph does its job, for every role." | (already plain — keep) |
| 06 | "Specialized agents reasoning over governed neighborhoods of the graph." | "Smart helpers that answer questions and suggest next steps · So people don't have to remember everything." |
| 05 | "The protective layer — nothing reaches the graph without passing through it." | "Rules that protect each person's information · So we keep trust and follow the law." |
| 04 | "One canonical person per human. Every fact lives on an edge." | "One profile per person, connected to facts about their work · So everyone sees the same truth." |
| 03 | "The engine that turns four records of \"Maria\" into one Maria." | (already plain — keep) |
| 02 | "How anything connects, regardless of the shape of its API." | "How we pull data out of each system · So every kind of system can plug in." |
| 01 | "Anything that holds a fragment of who someone is at work." | "Every system your company already uses · This is where the data starts." |

### Phase 3 — Rewrite snake_case edges in human language **[PENDING]**

Layer 4 has 20 edge chips like `applied_to`, `hired_as`, `reports_to`. These are programmer identifiers. Replace:

| Current | Plain |
|---|---|
| applied_to | applied to a job |
| interviewed_for | interviewed for |
| hired_as | was hired as |
| reports_to | reports to |
| manages | manages |
| belongs_to_team | belongs to team |
| has_skill | has skill |
| completed_learning | completed training |
| holds_credential | holds credential |
| assigned_to_project | works on project |
| reviewed_by | reviewed by |
| compensated_by | paid by |
| eligible_for | eligible for |
| referred_by | referred by |
| previously_employed_as | previously worked as |
| opted_into | opted in |
| consented_for | consented for |
| decision_used | decision used |
| source_verified_by | verified by source |
| valid_from / valid_to | valid dates |

Keep the JetBrains Mono font (it visually says "these are connection types"), but use English verb phrases instead of programmer syntax.

### Phase 4 — Carry Maria's story through every layer **[PENDING]**

Maria already appears at Layer 3 (the worked Identity Resolution example). Extend her thread upward and downward so the reader watches one human move through the whole architecture:

- L1: "Maria's name lives in the ATS, payroll, directory, and LMS — four different records of her."
- L2: "Each system gives us Maria's record in a different shape. The fabric pulls them all in."
- L3: (existing) "Four records of Maria reconcile to one canonical Maria."
- L4: "The graph now connects Maria's one record to her team, her manager, her skills, her benefits."
- L5: "Anyone asking about Maria must pass through her consent rules first."
- L6: "Her manager's coaching agent can see her current workload — but not her medical claims."
- L7: "Maria opens the employee app and sees: 'You completed your security training. Here are 3 next courses your team is taking.'"

These callouts give the reader a single human protagonist to track through the whole diagram. They make abstract concepts concrete.

### Phase 5 — Group L4 nodes into themed clusters **[PENDING]**

Layer 4 currently has 30 individual node-type chips in a 5×6 grid. Too dense to scan. Group into 5 themed clusters with mini-headers:

- **People & roles** (6): Person, Candidate, Employee, Contractor, Manager, Alumni Record
- **Work & structure** (6): Team, Role, Position, Job Requisition, Department, Location
- **Skills & growth** (6): Skill, Credential, Certification, Learning Record, Goal, Performance Review
- **Money & benefits** (5): Compensation Band, Payroll Record, Benefit Enrollment, Offer, Application
- **Decisions & permissions** (5): Policy, Consent Record, Decision Record, Referral, Interview
- **Work** (2): Work Project, + extensible

Mini-header in JetBrains Mono Medium 12pt above each cluster. Reader can scan group headers first, then zoom into individual types if curious.

### Phase 6 — Glossary panel + acronym expansions **[PENDING]**

Replace the current "Reading the Diagram" card (in the right callout column) with a Glossary card:

| Term | Plain definition |
|---|---|
| HCM | Human Capital Management — software for managing employees |
| ATS | Applicant Tracking System — software for hiring |
| HRIS | Human Resources Information System — the main employee database |
| ETL | A way to move data between systems on a schedule |
| SFTP | A safe way to move files between systems |
| MCP | A new standard letting AI tools call into your systems |
| RBAC | Permissions based on a person's job role |
| ABAC | Permissions based on multiple things at once |
| RTBF | Right to be forgotten — the legal right to have your data deleted |
| Canonical person | One profile that represents one real human across all systems |
| Edge | A connection between two things — like Maria → manages → Team A |
| Node | A thing on the graph — a person, a team, a skill |

Glossary lives in the right callout column. Linked to from the Reader's Guide at top.

### Phase 7 — Document & track (this file) **[IN PROGRESS]**

Maintain this plan as the source of truth for the cognitive accessibility work. Update phase status as each lands. Future passes should:

- Add **alt text** equivalents — for the inevitable PDF export, every visual region needs a paragraph description.
- **Test with real readers** — show the diagram to 3 people unfamiliar with HCM software. Ask them to summarize the purpose in one sentence. Iterate until all three get it right.
- **Test with a screen reader** — if exported to an accessible PDF, structure must reflect reading order.
- **Add icons** — pair every layer header with a simple visual (database, plug, magnifying glass, network, shield, robot, person).
- **Reduce color reliance** — confirm the diagram still parses in greyscale (color is decorative; meaning lives in text and position).

---

## What success looks like

Three readers unfamiliar with HCM software:
- All three can state the diagram's purpose in one sentence after reading only the top panel.
- All three can describe what Layers 1, 4, and 7 do without re-reading.
- None of them encounter a term they cannot understand or look up within the diagram.

When the answer to all three is yes, the diagram is cognitively accessible.

---

## Phase status

- [x] **Phase 1** — Reader's Guide panel at top (2026-05-23)
- [x] **Phase 2** — Plain-language layer subtitles (2026-05-23)
- [x] **Phase 3** — Plain-English edges (2026-05-23)
- [x] **Phase 4** — Maria's story through every layer (2026-05-23)
- [x] **Phase 5** — L4 node clustering (2026-05-23)
- [x] **Phase 6** — Glossary panel (2026-05-23)
- [x] **Phase 7** — This plan written (2026-05-23, ongoing)
- [x] **Phase 8** — Connector audit + cleanup (2026-05-23, added after pass)
- [x] **Phase 9** — Principles & callouts column rewrite (2026-05-23, added after pass)
- [x] **Phase 10** — 24pt minimum font + truncation/spacing/connector audit (2026-05-23)
- [x] **Phase 11** — Restore cognitive accessibility work at 24pt baseline (2026-05-23, after regression)

All eleven phases landed across two sessions on 2026-05-23.

## Phase 10 — 24pt floor + audit

User requested: "make the smallest font size medium 24 for all layers" + "review the height of each section, make sure there are no truncated text, keep consistent vertical spacing, rethink the best path for the connecting lines."

- Bumped every shape with fontSize < 24 to exactly 24pt (158 shapes affected)
- Auto-grew 86 shapes whose height was insufficient for the new font
- Re-stacked all sections with consistent 60px gaps (was inconsistent 40–80)
- Fixed 12 truncations: 7 layer titles needed h=100 for Fraunces 40pt descenders, principles panel "How the system…" needed h=110, L6 "Audit-Ready Decision Trails" needed w=440, L4 metadata strip text was shortened to fit one line at 1700w
- Rebuilt all trunk connectors: deleted 5 stale ones, created 7 new (one per layer junction + feedback loop) with `TOP`/`BOTTOM` magnets anchored to center-column chips for clean straight vertical paths and plain-English labels:
  - L1 → L2: *data flows up to the connectors*
  - L2 → L3: *data is reconciled into one record per person*
  - L3 → L4: *the record becomes part of the graph*
  - L4 → L5: *all questions pass through the rules*
  - L5 → L6: *agents work within their permissions*
  - L6 → L7: *shows up in each person's experience*
  - L7 → L4 (feedback): *what people do becomes new evidence* (RIGHT/RIGHT — curves around right side)

## Phase 11 — Restoration after regression

During Phase 10 it was discovered that significant prior cognitive accessibility work had reverted (likely via Cmd+Z in Figma): the plain title, subtitle, Reader's Guide 3-panel, all 7 layer taglines, all 20 plain English edges, 6 Maria's story callouts, 5 L4 mini-section headers, and L4 themed grouping had all disappeared. The right column (principles + glossary + L8 feedback loop) and L1 source title rewrites survived.

Phase 11 re-applied all of that at the new 24pt baseline:
- Batch 1: rewrote title, subtitle, 7 layer taglines, 20 edges in plain English (29 text changes)
- Batch 2: rebuilt Reader's Guide (eyebrow, big plain headline, technical sub-title, italic elevator pitch, divider, 3 panel headers, 3 panel bodies = 9 new shapes)
- Batch 3: created 6 Maria's story callouts (one per layer except L3 which already has the full example)
- Batch 4: re-positioned 30 L4 nodes into 5 themed clusters with mini-headers (PEOPLE & ROLES, WORK & STRUCTURE, SKILLS & GROWTH, WORK MONEY & OUTCOMES, RECORDS & GOVERNANCE)
- Batch 5: cascaded all sections with 60px gaps, grew callout panel to match new diagram height (9937)

**Final diagram dimensions: 1800px wide × 9937px tall.**

**Lesson learned about Figma section children:** when shapes get auto-absorbed into a SECTION as children, their .x and .y are RELATIVE to the section's origin. Setting `n.x = 2080` for a section child puts it at absolute x = section.x + 2080. Always probe `n.parent.type` first; use absolute coords only if parent is the page, relative coords if parent is a section.

## Phase 8 — Connector audit (added after first review)

The first 7 phases missed the connector lines. After Marcelo asked, we audited all 31 connectors on the page and found:

- **15 connectors were visual noise.** Granular arrows (one source system → one connector method, one Maria source record → canonical card, one agent output → one specific role body) duplicated information the spatial layout already conveys. Deleted.
- **5 trunk connectors carried jargon labels** ("Normalized records," "Resolved canonical person → graph," "All access mediated by governance," "Permissioned traversal," "Feedback & Learning Loop"). Relabeled in plain English:
  - "data flows up"
  - "becomes one record in the graph"
  - "all questions pass through these rules"
  - "agents work within their permissions"
  - "what people do becomes new evidence"
- **Magnets reset to TOP/BOTTOM** so the trunk arrows route cleanly vertical through the narrow column instead of curving diagonally.
- **L3 pipeline connectors** (numbered 1→2→3→4→5→6) — deleted because the visible chip numbering already conveys order. Arrows in the 2×3 grid would have routed messily.
- **Eglin's research-synthesis section connectors** (11 of them, x<2000) — left alone, not part of this work.

**Lesson:** when restructuring a diagram, audit every connector. Auto-routing keeps lines technically valid but doesn't guarantee they still read well. A cognitively accessible diagram has fewer, clearer connectors with plain-language labels.

## Phase 9 — Principles & callouts column rewrite (added after second review)

A second look at the right-hand column found that the first 7 phases had only touched the main diagram column. The Principles & Callouts panel still had:

- Terse "lives on edges" jargon principles
- A glossary that had never been re-rendered (still said "READING THE DIAGRAM")
- 4000px of dead space in the middle of the column where content had been pushed apart by cascades

Rewrote every principle as **plain statement + "why this matters" line**:

| # | Before | After (statement) | After (why) |
|---|---|---|---|
| 01 | One human, one canonical person node. | Each real person has one profile. | Even if they show up in 5 systems with 5 different names, the graph sees them as one human. |
| 02 | Consent lives on edges. | Every connection carries permission. | If Maria didn't agree to share something, nothing can use it. Consent travels with the data. |
| 03 | Time lives on edges. | Every connection knows when it was true. | Maria was a contractor in 2024 and an employee in 2025. The graph keeps both true at their right times. |
| 04 | Provenance lives on edges. | Every connection knows where it came from. | We can always trace "Maria has the Python skill" back to the LMS course she completed. |
| 05 | Agents reason over neighborhoods, not disconnected rows. | Smart helpers see whole stories, not isolated facts. | An agent doesn't just see "Maria, 32." It sees Maria, her team, her work, her training — connected. |
| 06 | The graph does not replace systems of record. It connects and understands them. | The graph doesn't replace your existing systems. | Workday still pays Maria. Greenhouse still hires for her team. The graph connects what they already know. |
| 07 | Every recommendation must be explainable, permission-aware, and auditable. | Every suggestion must be explainable and recorded. | If an agent recommends Maria for a role, you can ask "why?" and see exactly what it considered. |

Layer 8 ("Feedback & Learning Loop") and the Glossary card were both rewritten in plain language and re-anchored to the column. Panel resized 7485 → 4900 to fit the new content tightly. Maria thread carried into every principle for continuity with the layer callouts.

## Next-pass candidates (not yet executed)

These were not part of the initial 7 phases but would further raise the cognitive accessibility bar:

- **Reading-order visual cue.** Add a single arrow or wayfinding element at the top of each layer ("read this layer top → bottom · then continue down to the next layer"). The current numbered layers and bottom-up directional arrow imply this but don't make it explicit.
- **Icons paired with layer headers.** Each layer gets a small monoline icon (database, plug, magnifying glass, network, shield, robot, person) next to its mini-header. Multi-channel reinforcement.
- **Color-independent legend.** Verify the diagram still parses fully in greyscale. The layer wash colors carry decoration only — text and position carry meaning. Confirm.
- **Per-section TL;DR card.** Each layer adds one card ("In 12 words: …") summarizing what that layer does for someone who only wants to skim. Could share visual treatment with Maria's story callouts.
- **Real-reader test.** Show the diagram to 3 people unfamiliar with HCM. Ask: "What does this diagram show? Why does it matter? Where would you start reading?" Iterate on whatever fails.
- **Accessible PDF export.** When exporting, embed alt text per region, ensure reading order follows the visual flow, run through a PDF accessibility checker.
