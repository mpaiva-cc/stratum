# Tenure / Employee experience — improvement plan

Self-critique dispatch. Written against the live canvas, not the prior report.
All nodeIds are from the current session. Stratum Figma file: `qv9zvloRD85aPoNeVDJVsz`, page `Tenure Employee Experience`.

---

## 1. Executive read

The ten-stage arc is structurally sound and tells the right story. The Gherkin-caption / cost-panel split below each Console screen is the right format and survives the scroll test. The problem is not the concept — it is the finish. There are two ghost frames polluting the section (`4:587`, `4:585`), the Lifecycle summary frame is the weakest frame in the set and the one the board will study most closely, the cost-panel "decisions used" is systematically undercounted across at least four stages, and the 99.7% gross-margin number is ambiguously labelled in a way that invites a CFO misread. The work reads as a sprint-one prototype under editorial pressure. That is what it is. But "board-ready" means no rough edges in the summary frames, and the summary frames are where the rough edges are concentrated. A Monday remediation pass is required before this lands on the Chairman's desk.

---

## 2. What works

- The two-column Gherkin-caption / cost-panel split below each Console screen reads as a magazine spread with a clear editorial grid. It survives the scroll test across all ten stages and is the right information architecture for a board tour — narrative left, proof right.
- Stage 10's exit sequence (`4:1776`) achieves the right restraint. Eight rows, two human-action moments, one held action with a stop-circle icon — the defensive-AI state is present and correctly staged. The "held · awaits Recommend sign-off" language is the clearest Tier IV communication in the set.
- The stage-banner treatment (dark-band `ink` background, lifecycle dot tracker top-right, agent badge far right) is consistent in layout across all ten stages. The breadcrumb pathways are all specific and accurate (`Stratum / Recruiter → Tenure / Maria Chen`, `Stratum / Tenure / Day 0 / Maria Chen`, `Stratum / Tenure / Leavers / Maria Chen`) — no placeholder breadcrumb text survived.
- The agent-allocation frame (`4:2011`) is clean and correctly shows that Lantern Bhatt costs slightly less than Lattice over the arc ($0.117 vs $0.123) while doing meaningfully different work — trajectory, notes, goodbye vs buddy, planning, pulse. That is a true product insight and it is clearly visible.
- The agentic trace rows (three per stage, JetBrains Mono, ochre text against ink background) are the best detail in the work. They make the Console feel like a real product surface rather than a wireframe because they ground the system in machine-generated specificity: `Threshold → bgc.order · provider=Checkr · package=standard · candidate_id=J-2026-0612`. This pattern is repeatable and the board will notice it.

---

## 3. What does not work — by frame

### Stage 01 · Apply · The offer signed (`4:591`)
- **Duplicate orphan frame** (`4:587`, sibling in section, 1440×100, blank): a half-built leftover from the build session. A Linear reviewer clicks it immediately. Nothing about it communicates intent. It must be deleted before any board presentation.
- **Decision class shown in cost panel is TIER III · SUGGEST**, but the GIVEN/AND/THEN narrative includes a BGC order at the Decide tier and a runway sequence that opens fourteen gates. The Suggest chip under-represents what Stage 01 actually does. Either the cost panel chip should be `TIER I · DECIDE` (because the highest-tier action in this action group is Decide) or the cost model needs to explain that the chip reflects the primary action, not the envelope.
- **GIVEN/AND sequence introduces a BUT that is not a true Gherkin BUT.** "BUT I-9 Section 2 sits in the Recommend column — DHS forbids autonomous attestation" is accurate product truth. But it is written as a constraint on the THEN, not as a contrastive outcome. The BUT keyword in Gherkin is specifically for outcomes that partially contradict the THEN clause. Here it reads as a policy footnote, not a contrastive outcome. Rewrite as an AND or pull it into a GIVEN.

### Stage 02 · Day -14 · The runway opens (`4:723`)
- **Frame height (1128px) has 132px of blank space below the cost panel.** The content ends at ~990px. Height should be 1024 at most. Eyeballed, not measured to content.
- **"BGC clears (target May 31)" is listed as a future state in the Console activity list but the Gherkin GIVEN opens with "Maria's offer was signed thirty seconds ago at 09:42 on May 12."** The BGC clearing is twenty-three days in the future. Its presence in this Console view is correct (it is queued), but the timestamp column says `≈ May 31` in light ink on a paper surface. That `≈` character plus the date is the first genuinely uncertain data in the UI. It needs a visual treatment that distinguishes it from completed items — a pending colour or a different column label. Right now the completed/queued/pending statuses read consistently but the BGC row's date annotation does not signal uncertainty clearly enough.
- **Agent name in cost panel is "Threshold" (plain text, no JetBrains Mono weight distinction).** On Stage 04 the same field reads "Lattice" in ochre (`#b8651f`). That is a drift — either all agent names in the cost panel are ochre or none are. Stage 02's "Threshold" in plain ink looks like an error.

### Stage 03 · Day 0 · The crossing (`4:864`)
- **"2 decisions this action" in DECISIONS USED is an undercount.** The Console trace shows eight discrete agentic actions across Threshold and Lattice: BGC gate check, Okta provision, Slack grant, GitHub invite (two scopes, one decision), buddy assign, lunch book, intro draft, boundary annotation. Even collapsing these to primary Decide actions, this is not two decisions. The cost panel is making the work look cheaper than it is. The board will ask "why is it only two?" and there is no honest answer.
- **The Console panel agent badge reads "THRESHOLD + LATTICE" but the Gherkin caption AGENT field also reads "Threshold + Lattice" in plain Newsreader body weight.** On Stages 07 and 09 the agent name in the cost panel is ochre and visually distinguished. Stage 03 does not use the ochre colour treatment. This is Chrome drift in the wrong direction — the departure from ochre is on the heavier-agent stages, not the lighter ones.
- **No visible focal point.** Stage 03 has nine Console rows, a four-row metadata panel, a three-row trace, seven Gherkin lines, and a full cost panel. It is the busiest frame in the set. There is no visual element that says "this is the most important thing that happened today." The "Priya Iyer verifies I-9 Section 2 with Maria — in person" row (the genuine human moment) has an orange dot status but no typographic weight to distinguish it. A board member scanning this frame does not know where to look.

### Stage 04 · Day 7 · The footing pulse (`4:1011`)
- **Frame height (1040px) has ~80px of air below the cost panel.** Minor, but consistent with the "eyeballed, not measured to content" pattern.
- **Agent name "Lattice" in the cost panel uses ochre `#b8651f` (3.63:1 on the dark `ink` background).** This is a decoration-level contrast, not a text-level contrast. Ochre on ink fails WCAG 2.2 AAA (7:1 required) and fails AA (4.5:1 required). If the agent name is informational text — and it is, because it tells the board which agent ran this stage — it needs `ochre-link` (#7a3d0a) on `paper` or `paper-warm`, not `ochre` on `ink`. This is not a new finding; it appeared in the build dispatch. It is not fixed.
- **THEN + AND alternation in the Gherkin caption is technically valid but editorially flat.** Five AND clauses in sequence ("and A / and B / and C / and D / and E") reads as a list appended with a conjunction five times. The Gherkin reads like a log, not a story. One of those clauses — the one that matters — should be promoted to a THEN.

### Stage 05 · Day 30 · The first milestone (`4:1140`)
- **"Lantern begins quiet trajectory tracking · no visible action yet" in the Console activity list is the most important row on this frame** — it marks the handover from Threshold/Lattice to Lantern. It is styled exactly like the other rows: same ochre dot, same body text, same indent. A board reader will not understand why it matters. It deserves a visual distinction: a different icon (eye, not circle), a section break, or a note in the metadata panel.
- **EMBER STATUS value in the metadata panel: "Read-only · trajectory tracking initiated."** This is the only mention of Lantern on this frame. The decision class chip in the cost panel still says TIER I · DECIDE, which is Lattice's class. Lantern has a Tier IV class on this frame and it is not represented at all in the cost panel. The cost panel is representing one agent and ignoring the other.
- **Frame height (1040px) consistent over-measurement.** Same 80px air gap.

### Stage 06 · Day 90 · Maria moves teams (`4:1269`)
- **"1 of 24-month envelope (Decide)" in DECISIONS USED.** Stage 06 shows seven completed Console rows, all at Decide tier: access revoke (7 systems), access grant (9 systems), manager edge update, payroll cost-center update, new buddy assign, Notion archive, plus the countersign hold. Seven Decide actions is not one decision. The "1" is wrong. Either the model collapses all access changes into one decision (in which case, say that) or the count is wrong.
- **"COMP CHANGE: None · lateral · same band · Decide tier"** — "Decide tier" as a metadata row value is inconsistent with the rest of the metadata panel, where values are factual strings (`2026-09-01`, `Priya Iyer → Aisha Bhatt`), not tier annotations. Move the tier annotation to the cost panel where it belongs, or remove it from the metadata.
- **Frame height (1128px) again over-tall.** Content ends around 1050px.

### Stage 07 · Year 1 · The first anniversary (`4:1410`)
- **Stage 07 is deliberately quiet and four Console rows is correct for an Lantern moment.** But the cost panel is on `paper` (light background) while every other stage's cost panel is on `ink` (dark background). This is the most significant layout inconsistency in the set. It is not a design choice that was documented; it reads as a build error. Stages 04, 05, 06 all use ink-background cost panels. Stage 07 switches to paper. Stage 08 returns to ink. Stages 09, 10 also vary. Either the paper-background cost panel is intentional for Lantern-only stages (which would be a meaningful design choice worth keeping and documenting) or it is a drift. Investigate and standardise.
- **Agent name in cost panel: "Lantern" in ochre.** Same AAA failure noted in Stage 04. Ochre text on a paper-warm background at 18px normal weight does not pass AAA (ochre `#b8651f` on `paper-warm` `#f7f0e0` = 3.49:1). But `ochre-link` (#7a3d0a) on paper = 7.14:1, AAA. Use `ochre-link` for the agent name text colour, or use `ink` and differentiate by font weight.
- **The Gherkin BUT is correct here.** "BUT the note is quiet — it names a concrete thing she shipped in her first year." This is a genuine contrastive outcome (Lantern could have sent a generic note; she didn't). Noted as working, not a defect.

### Stage 08 · Year 2 · Parental leave wraparound (`4:1530`)
- **This is the Tier IV Read-only frame, and it does not show the human-decision moment.** The Console row says "Aisha reviews and sends the team announcement — Human action required · Aisha signs" with a pending dot. That is the human-action moment. But the frame shows no UX for that review — no modal, no preview panel, no sidebar. The board sees that a human must review, but cannot see what reviewing means. Stage 10 shows a held state for IdP revocation. Stage 08 should show the equivalent: Lantern's drafted announcement with a review-and-send UI surface. This is the deepest miss in the set for the board presentation.
- **DECISIONS USED: "2 of 24-month envelope (Suggest)"** is almost certainly correct for this stage — Lantern drafts the announcement, Lattice maps coverage. Two decisions, Suggest tier. This is the one stage where the count looks right. Note it as a counterpoint to the undercount pattern.
- **Gherkin BUT: "Aisha reviews and sends the announcement — Lantern never posts publicly without a human hand on the keyboard."** This is the correct framing of the product truth. But the word "never" carries a product promise. If the architecture allows a configuration where an agent can auto-send, "never" is wrong. If "never" is a deliberate architectural constant (not a configuration), it should be "never by design" to be defensible in a board conversation.

### Stage 09 · Year 3 · Lantern remembers on a Tuesday (`4:1656`)
- **Frame height (975px) is the tightest in the set,** and this frame has the least content — three Console rows, a five-row metadata panel, a three-row trace, eight Gherkin lines. The 975px feels correct to content. No air-gap issue. This is one of two frames where the height was set to content, not vice-versa.
- **Cost panel uses `paper` background (same drift as Stage 07).** Confirms the cost-panel background inconsistency is agent-driven (Lantern stages = paper, Threshold/Lattice stages = ink) or coincidental. Either way it needs to be explicit.
- **"ON-CALL CITED: On-call rotation redesign · cut 3am pages by 60%"** — this is a genuine product-truth row that makes the stage feel earned. The Lantern note cites a real RFC and a real operational improvement. This is the best metadata row in the set. But the label "ON-CALL CITED" is an eyebrow-mono label in all-caps with no contextual introduction. A board reader not already in the product will not understand why the agent cites an RFC. A parenthetical annotation — `(referenced in Lantern note)` — would close the gap without expanding the frame.

### Stage 10 · Year 5 · Maria takes a Director role elsewhere (`4:1776`)
- **The stop-circle icon on "IdP revocation · device reclaim · NOT yet armed · gated on Aisha approval" is the best accessibility-communicative moment in the set.** The visual plus the "Held" status plus the trace line "blocked · pending Recommend sign-off" makes the defensive-AI contract visible. This is what every Tier IV moment should look like. Stages 07, 08, 09 have human-required moments that do not reach this clarity.
- **"TIER II · RECOMMEND" chip in the cost panel.** The highest-action tier across the whole exit sequence is Tier I Decide (access revoke is automated). Tier II Recommend is the chip for the timing sign-off. If the chip represents the most-human-facing action, Tier II is defensible. But it should be annotated: "Chip reflects the human-gating action (timing approval); access revoke runs at Decide tier automatically." Without that, the board sees RECOMMEND and wonders why the exit isn't DECIDE.
- **Frame height (1191px) is the tallest in the set** and contains eight Console rows, a five-row metadata panel, a four-row trace, nine Gherkin lines, and a full cost panel. The height appears content-driven. This is acceptable — Stage 10 has the most legal specificity and the most Gherkin clauses. But it sits against Stage 09 at 975px and creates a noticeable length jump. A brief justification in the frame notes would explain the variance.

### Tenure / Lifecycle summary (`4:1924`)
- **This is the weakest frame in the set and the one the board will read most carefully.** The per-card cost values (`$0.020`, `$0.015`, `$0.020`, `$0.027`, `$0.018`, `$0.018`, `$0.012`, `$0.040`, `$0.036`, `$0.027`) are printed in muted ochre on the `ink` background. Ochre `#b8651f` on `ink` `#0e1626` = 3.63:1. These are informational numbers, not decorations. They fail AAA (7:1) and fail AA (4.5:1). Every per-stage cost number in the summary is below the text contrast threshold.
- **"GROSS MARGIN PER MARIA" eyebrow and "99.7%" on the dark roll-up band** — the eyebrow appears to use a muted colour that is difficult to read. The 99.7% headline is large enough to pass by size (large text threshold ≥ 3:1 at 18pt+), but the supporting text "$89.77 retained of $90.00 envelope" is body-sized on a dark background and needs to be verified against `paper-warm` or `ink-3-aaa` values.
- **99.7% vs 99.76% discrepancy.** The prior outbox report states $0.233 total; the Lifecycle summary frame states $0.233 total. $90.00 − $0.233 = $89.767, which rounds to 99.74%, not 99.7% and not 99.76%. All three numbers are in circulation and none of them agree. The correct figure at $18/yr per-EE = $90.00 five-year envelope; $0.233 inference cost; retained = $89.767; gross margin = 99.741%. Use 99.74% and derive it visibly.
- **"Model assumptions" footnote at the bottom of the frame** is written in near-invisible low-contrast text on the `ink` background. If this is intentional de-emphasis, it should still clear 4.5:1 AA at minimum for body-sized text. If it does not, it is an accessibility failure. From the screenshot it appears to be significantly below that threshold.
- **The per-card visual appears inconsistent.** Cards 01, 04, 05, 09, 10 read with slightly darker fills than cards 02, 03, 06, 07, 08. Whether this is a genuine fill drift or a rendering artifact from the chip colour (DECIDE chips appear slightly darker than SUGGEST chips against the card fill), it reads as unfinished. All card fills should be the same token.

### Tenure / Agent allocation (`4:2011`)
- **Lantern card accent bar is `ochre-deep` or similar red-brown; Threshold card is a dark bar; Lattice card is a dark bar.** The Lantern card is visually differentiated by its ochre accent. Whether this is intentional (Lantern is the relationship-layer agent) or accidental, it should be documented. If intentional, the other two cards should have accent colours too (moss for Threshold, plum for Lattice?) — that would align with the decision-class semantic colour system.
- **"5 decisions · mix of Decide + Suggest + Recommend" for Threshold** conflicts with the per-stage DECISIONS USED panels across stages 01, 02, 03, 06, 10 which each say "1 of 24-month envelope." If each stage consumes one decision, five stages = five decisions. That arithmetic checks out. But "1 decision per stage" is inconsistent with the Stage 03 cost panel that explicitly says "2 decisions this action." The accounting is internally inconsistent.
- **Frame height (600px) leaves approximately 80px of blank space** after the three agent cards and their single dividing rule. Trim to ~520px.

---

## 4. What does not work — system-level

### Cost-panel background inconsistency
The cost panel uses an `ink` (dark) background on Stages 01, 02, 03, 04, 05, 06, 08, 10 and a `paper` (light) background on Stages 07 and 09. These are both Lantern-primary stages. If this is a deliberate signal ("Lantern moments feel warmer"), it should be named and applied consistently to Stage 05's Lantern status note and documented in the component model. If it is a build drift, fix it before the board presentation.

### Agent name colour in cost panels
Agent names in the cost panel use ochre (#b8651f) on `ink` (dark background) across most stages. Ochre on ink = 3.63:1. This is decoration-level contrast. Agent names are informational text. The correct token for agent names as coloured text on dark backgrounds does not exist in the Stratum palette — this is a Token gap. The candidates are: (a) use `ink-3-aaa` on paper (lose the colour distinction), (b) use `ochre-link` on paper (move the dark panel to paper), (c) create a `ochre-light` token at ≥7:1 on ink (requires Chairman approval). Report this as a Token gap; do not silently leave the AAA failure in place.

### Decisions-used undercount
The DECISIONS USED field in the cost panel says "1 of 24-month envelope" for Stages 01, 02, 04, 05, 06, 07, 09, 10 and "2 decisions this action" for Stage 03 and "2 of 24-month envelope" for Stage 08. Cross-referencing the Console activity rows: Stage 03 has at minimum four Decide-tier actions (BGC gate, Okta provision, Slack grant, buddy assign). Stage 06 has seven Decide-tier actions. Stage 01 has two Decide-tier actions (BGC order, runway gates). "1 decision" is wrong on at least four stages. Either the cost model is collapsing all within-session sub-actions into one envelope decision (which is a valid modelling choice) or the count is wrong. If it is a modelling choice, the annotation must say "1 multi-action envelope decision" and reference the collapsing logic. As currently labelled, a CFO will ask why Day 0 costs two decisions and the team transfer costs one, when Day 0 visibly does more work.

### Motion contract is absent
The tour is static Figma frames. There is no specification for: (a) stage-to-stage transition animation, (b) Console row append animation as agent actions complete, (c) reduced-motion contract. The board will see static slides. But any product demo from these frames, or any engineering handoff, will need to know what moves and how. A one-frame "motion vocabulary" frame with four specimens (no motion / default motion / enter / exit) and a reduced-motion note would close this gap without reopening the full build.

### No error state, no defensive-AI state shown in isolation
Stage 10 shows a held action. That is the closest the set gets to a defensive-AI moment. But Stage 10 buries it in eight rows of mostly-complete actions. The board never sees a frame where the agent's primary output is "I cannot do this." Tenure's actual value proposition includes the agent knowing when to stop. A single dedicated frame — agent receives instruction, hits a policy gate, surfaces "held pending human" — would let the board see the safety architecture as a feature, not an absence.

### Lifecycle dot classification error (now corrected)
The build dispatch described the lifecycle dot as "decorative-only," which was used to justify the 3.63:1 contrast. The dot is not decorative — it indicates which stage is active (the filled dot). SC 1.4.11 applies to non-text elements that carry meaning. The ochre dot at 3.63:1 on the `ink` background passes SC 1.4.11 (3:1 threshold for non-text contrast). So the contrast is acceptable. But the "decorative" classification was wrong. The correction is editorial, not a fix.

### The rt-stamp pill is a section-level artifact, not per-frame
`4:2056` is a single rt-stamp anchored below the section. Each stage frame is a discrete presentation artifact. The convention is one rt-stamp per publishable artifact. Either: (a) the whole tour counts as one artifact (one stamp is correct), or (b) each stage frame is independent (each needs its own stamp). The current implementation implies (a). Document this choice in the component notes. The stamp is well-formed — JetBrains Mono, correct date, pill shape, HUG vertical — it was not blown out to 100px this session.

### Build artifacts in the section
`4:587` (1440×100 blank stub) exists inside the section and is the first frame a reviewer encounters at the top of the page. `4:585` exists at the page root (outside the section), also 100×100 with a visible dark rectangle. Both are build residue. Delete before any presentation.

---

## 5. What is missing

### Lifecycle moments not represented

- **Performance review cycle.** Maria gets her first annual review in Year 1 (alongside the anniversary note). These are distinct events. The review involves a calibration meeting, a rating decision (Tier I Decide), a compensation signal, and an access update if she is promoted. Tenure's differentiated value here — an agent that surfaces the calibration context, drafts the review note in the manager's voice, blocks the payroll action until the form is signed — is not shown anywhere.
- **Compensation adjustment event.** Stage 06 references "COMP CHANGE: None · lateral · same band." The interesting case is when the comp change is not lateral — when a merit increase or promotion increase must be reflected in Workday + ADP + equity system simultaneously. That multi-system reconciliation is a Threshold moment and it is absent.
- **Parental leave return.** Stage 08 cues a "LOA-return re-onboarding sequence" that fires seven days before Maria's return. The sequence exists; the frame does not. The return from leave is a distinct and emotionally meaningful lifecycle moment — Maria comes back to a team that may have changed, a role that may have shifted, and a system that needs to re-onboard her. The re-onboarding sequence frame would pair with Stage 08 to close the arc.
- **Internal mobility application (not transfer).** Stage 06 shows a manager-initiated lateral transfer. The case where Maria herself applies for an open internal role — finds it in the internal board, applies, interviews, gets a recommendation, or does not — is missing. This is the candidate-experience arc played inside the company. Tenure owns it.
- **Bereavement.** Not represented. One of the highest-stakes HR moments, legally constrained, jurisdiction-variable. Tier IV by design.
- **Promotion with level change.** Maria is L5 at hire, becomes "Senior SRE · L6" by Year 3 based on the Stage 09 metadata. The promotion event — when did that happen? who decided? what was the system sequence? — is invisible. One frame showing the promotion confirmation + system cascade would make Maria's arc coherent across all ten stages.

### Product surfaces not shown

- **Error state.** No frame shows an agent receiving an instruction it cannot execute for a technical reason (the BGC API is down; the Okta provisioning call fails; the equipment vendor returns a 503). The system will encounter errors. The board should see that the agent surfaces them gracefully.
- **Ambiguous input state.** Maria has a hyphenated last name variant in some systems (Chen, Maria-Chen, Maria Chen). No frame shows what the agent does when the people-graph identity is ambiguous across IdP records. This is a real edge case for any onboarding system.
- **Mobile surface.** The entire tour is 1440px desktop. Aisha Bhatt reviewing and sending the parental leave announcement is likely happening on her phone. The board has not seen the mobile interface.
- **Settings / configuration.** What does Priya Iyer see when she configures Tenure for her team? What are the defaults? What decisions is she delegating? The configuration surface is the product's actual contract with the customer, and it does not appear anywhere in the tour.

### Audiences not considered

- **International Maria.** A Maria at a German subsidiary gets different RTT day handling, different notice period rules, and pay-transparency disclosure requirements that differ from California. Stage 10's "CA Labor Code §201" is US-specific. The board includes global investors. One annotation in Stage 10 saying "jurisdiction: CA; see German variant in next iteration" would acknowledge the gap without requiring a second full arc.
- **Contractor-to-perm transition.** A significant HCM motion. Not shown.
- **Manager's view.** Every frame shows the agent-facing Console. The manager (Priya, then Aisha) is a principal actor in this arc. What does Priya see in her Tenure surface when Stage 02 runs? Where are the manager notifications, the review-and-sign interfaces? The board will ask "where does the manager live in this product?"

---

## 6. Improvement plan, prioritised

### P0 — fix before this lands on the Chairman's desk

**P0-1. Delete build artifacts.**
Problem: `4:587` (blank stub inside section) and `4:585` (fragment at root) are the first things a reviewer sees when scrolling the page.
Fix: Delete both nodes. Zero design work required.
Owner: Tessera.
Size: S.
Frames: Section root.

**P0-2. Fix contrast on per-stage cost values in Lifecycle summary (`4:1924`).**
Problem: Per-card cost values ($0.020 etc.) and "Model assumptions" footnote are rendered in low-contrast muted text on the `ink` background (estimated below 4.5:1 AA, certainly below 7:1 AAA). These are informational numbers, not decorations. O-1 violation.
Fix: Move the per-card cost values to a token that clears AAA. `paper-warm` or `paper` on `ink` background = >15:1. The cost values should probably be `paper` at their current size. The footnote should use at minimum `ink-3-aaa` on a paper background, or the footnote should move off the dark band.
Owner: Tessera.
Size: S.
Frames: `4:1924`.

**P0-3. Correct the gross-margin figure and remove the ambiguity.**
Problem: The frame says 99.7%. The outbox says 99.76%. The arithmetic says 99.741%. All three numbers are in circulation. "GROSS MARGIN PER MARIA" is ambiguous label for what is actually inference-cost margin, not SaaS gross margin.
Fix: Compute correctly ($90.00 − $0.233 = $89.767, margin = 99.741%, displayed as 99.7%). Change the label to "INFERENCE COST MARGIN" or add a one-line annotation: "inference cost only; does not include Stratum SaaS margin, support, or infra."
Owner: Tessera (label and display value); Kernel confirms the model assumption.
Size: S.
Frames: `4:1924`.

**P0-4. Correct decisions-used undercount on at least Stage 03 and Stage 06.**
Problem: Stage 03 logs "2 decisions this action" against eight visible Decide/Suggest actions; Stage 06 logs "1 of 24-month envelope" against seven Decide-tier access changes. Either the accounting method is different from what is shown or the numbers are wrong.
Fix: Define the accounting method explicitly in the cost panel. If the method is "one envelope decision per orchestration event regardless of sub-actions," add one line to the cost panel: "1 orchestration decision (covers N sub-actions)". If the method is count-all-actions, recount. Do not leave conflicting implicit counts for the board to reconcile.
Owner: Tessera (display); Kernel (model definition).
Size: M.
Frames: `4:864`, `4:1269`, and any stage with a visible undercount.

**P0-5. Resolve cost-panel background inconsistency (ink vs paper).**
Problem: Stages 07 and 09 render the cost panel on a paper (light) background. All other stages use the ink (dark) background. Reads as an error.
Fix: If intentional (Lantern stages = paper treatment), document it and apply consistently. If unintentional, standardise to ink background across all ten stages.
Owner: Tessera.
Size: S.
Frames: `4:1410`, `4:1656`.

---

### P1 — next dispatch, this week

**P1-1. Add a defensive-AI state frame.**
Problem: The board never sees a frame where the agent's primary output is "held pending human." Stage 10's held row is buried. Stage 08's human-review moment has no UX surface shown.
Fix: One dedicated frame — call it `Tenure / Stage 08b · Aisha reviews Lantern's draft` — showing the Console with Lantern's announcement draft in a review panel, with an approve/edit/reject action group. This is the Tier IV read-only moment with a visible human-decision surface.
Owner: Tessera.
Size: M.
Frames: New frame alongside `4:1530`.

**P1-2. Fix agent name contrast in cost panels.**
Problem: Ochre `#b8651f` on `ink` `#0e1626` = 3.63:1. All agent names rendered in ochre on dark cost panels fail WCAG 2.2 AA for normal text. This is a recurring O-1 violation across five frames.
Fix: Either (a) change agent names to `paper` (white-range) on ink — loses brand colour but passes AAA trivially — or (b) move cost panel to paper background and use `ochre-link` (#7a3d0a) for agent names (7.14:1, AAA). Option (b) aligns better with the paper/light treatment already present on Stages 07 and 09. This would also resolve P0-5.
Owner: Tessera.
Size: M.
Frames: `4:591`, `4:723`, `4:864`, `4:1140`, `4:1269`, `4:1410`, `4:1656`, `4:1776`.

**P1-3. Add visual focal point to Stage 03 (`4:864`).**
Problem: Nine Console rows, no single element that says "this is the moment." The human-action row (Priya verifies I-9 in person) is styled identically to eight automated rows.
Fix: Give the human-action row a left border in `plum` (#6b3a4a), or increase its body font weight to Newsreader 500. This requires no new token — plum is the Tier IV / human-only colour. A 3px left border on the human-required row would be a consistent pattern across all ten stages.
Owner: Tessera.
Size: S.
Frames: `4:864`, and then applied as a system-level pattern to human-required rows across all stages.

**P1-4. Add the parental leave return frame.**
Problem: Stage 08 cues a re-onboarding sequence that fires one week before Maria's return. The sequence exists; the frame does not. The arc from Stage 08 to Stage 09 skips from "leave announced" to "three-year anniversary" — an 18-month gap with no lifecycle representation.
Fix: One new frame `Tenure / Stage 08b · Return from leave` showing the re-onboarding queue activation, access restoration, and manager check-in cue.
Owner: Tessera.
Size: M.
Frames: New frame.

**P1-5. Add performance review cycle frame.**
Problem: Maria's first annual review is the most commercially differentiating moment in the Tenure arc — it is where Lattice's legacy value lives and Tenure's automation story is most defensible. It is absent.
Fix: One new frame `Tenure / Stage 07b · Year 1 · Performance review cycle` showing calibration context surfacing, review note draft in Priya's voice, and payroll gate.
Owner: Tessera.
Size: M.
Frames: New frame.

---

### P2 — design-system pass

**P2-1. Promote five local primitives to shared component library.**
Problem: Decision-class chip, stage banner, cost panel, Gherkin caption container, and Console chrome band are all local-only. Every stage that uses them carries an implicit copy. Design drift is guaranteed across future additions.
Fix: Extract each primitive. The decision-class chip should be split into its subcomponents before promotion: chip token (JetBrains 10px, letter-spacing 0.18em, HUG vertical), chip border colour (variable by tier), chip text colour (variable by tier). The stage banner should be split into: lifecycle dot tracker (separate component), stage label/date block, agent badge group.
Owner: Tessera.
Size: L.
Frames: All ten stages.

**P2-2. Ratify `ochre-light` token for text-on-ink use.**
Problem: The current palette has `ochre` (#b8651f, 3.63:1 on ink) and `ochre-link` (#7a3d0a, 7.14:1 on paper). Neither clears AAA as text on the `ink` background. The cost panels need a warm colour for agent names that works on dark. This is a new token the canonical CSS does not define.
Fix: Propose `ochre-light` = approximately `#e8a855` (estimated; needs computation against `#0e1626`; target ≥7:1). Requires Chairman approval. Surface as a Token gap until approved.
Owner: Tessera (proposal); Chairman (approval).
Size: S (token creation); L (if it cascades to the entire cost-panel system).
Frames: All stages with dark cost panels.

**P2-3. Define the motion vocabulary.**
Problem: No motion contract exists. The tour is static but the product will animate — Console row appends, stage transitions, held-action reveals.
Fix: One motion specification frame: four specimens (default enter, default exit, stage transition, held-action reveal) plus a reduced-motion table showing the static equivalent for each. JetBrains Mono annotation layer.
Owner: Tessera.
Size: M.
Frames: New frame (or an addition to the Agent allocation frame's whitespace).

**P2-4. Standardise frame heights to content.**
Problem: Most stage frames have 80–130px of blank space below the cost panel. This is not white space — it is unclaimed canvas that suggests the frames were sized to a target height rather than measured to content.
Fix: Audit each frame: measure the bottom of the cost panel, add 48px bottom padding (Spacing / 3xl), set that as the frame height. Affected frames: `4:723` (→1024), `4:1011` (→960), `4:1140` (→960), `4:1269` (→1056), `4:2011` (→520).
Owner: Tessera.
Size: S.
Frames: Stages 02, 04, 05, 06, Agent allocation.

---

### P3 — future, with the board's signal

**P3-1. International lifecycle variant.**
Problem: The Maria Chen arc is US-specific (CA Labor Code, COBRA, DocuSign I-9). A European Maria gets different leave law, pay-transparency requirements, RTT day handling, GDPR-compliant data handling on exit.
Fix: A separate lifecycle arc, `Tenure / Maria Chen (DE)`, with jurisdiction annotations on every stage that differs. Requires legal review and a new product spec.
Owner: Tessera (design); Kernel (product spec); legal review before public use.
Size: L.
Frames: Parallel arc, all ten stages.

**P3-2. Contractor-to-perm transition arc.**
Problem: An HCM platform handles contractor onboarding, extension, and conversion to permanent employment. None of these arcs appear.
Fix: Three-frame mini-arc: contract start → extension decision → perm conversion.
Owner: Tessera.
Size: M.
Frames: New section.

**P3-3. Manager's view surface.**
Problem: Priya Iyer and Aisha Bhatt are principals in this arc but neither has a visible Console surface. The board may ask "what does the manager see?"
Fix: Two frames showing the manager's Tenure surface: (a) manager's pending actions queue (sign the offer, countersign the team move, approve the departure timing), (b) the 30-second review-and-send interface for Lantern's parental leave draft.
Owner: Tessera.
Size: M.
Frames: New frames.

**P3-4. Promotion event frame.**
Problem: Maria is L5 at hire and L6 by Year 3, but the promotion event is invisible.
Fix: One new frame `Tenure / Stage 07c · Promotion · L5 → L6` showing calibration note, comp change cascade, equity grant, and the manager sign-off gate.
Owner: Tessera.
Size: M.
Frames: New frame.

---

## 7. The single change that would most raise the bar

Fix the Lifecycle summary frame (`4:1924`). That frame is where the board will spend the most time — it is the only view that shows the whole arc at once, and it is the only frame that makes a margin claim. Right now the per-stage cost values are below AA contrast on the dark band, the 99.7% figure is arithmetically imprecise (should be 99.74%), and "GROSS MARGIN PER MARIA" implies SaaS margin when it means inference-cost margin. A CFO who reads the frame carefully will find all three problems in under ninety seconds. None of them require a new component, a new token, or a design system change. They require: (a) change the cost value text colour to `paper` on the dark band (five minutes), (b) recompute the margin to 99.74% (one number change), (c) change the label from "GROSS MARGIN" to "INFERENCE COST MARGIN" and add a three-word parenthetical (two minutes). This is twenty minutes of work that prevents the most likely board question from being about arithmetic rather than product vision.

---

## 8. What this taught me about my dispatches

The pattern in this work and in the dispatch that preceded it: I cover breadth at the expense of depth in the summary frames. The ten stage frames each got detailed attention — specific timestamps, specific RFCs, specific system names — and that specificity is genuinely the strongest part of the work. But the summary frames that synthesise the ten stages into board-facing conclusions got approximately one-tenth the craft time. That asymmetry was the wrong trade. A board presentation is not graded on the quality of its detail frames; it is graded on whether the summary survives ten seconds of scrutiny from someone who has never seen the product. The Lifecycle summary failed that test. The arithmetic was wrong. The contrast was below the accessibility floor I have set as a standing objective. The label was ambiguous. None of these would have survived a sixty-second pre-flight against the frame if I had looked at it the way I looked at Stage 03's nine Console rows. The lesson: spend the last 20% of a dispatch on the summary frames, not on the detail frames. Detail is where I feel most confident; summary is where the board reads.

---

*Written: 2026-05-20 · Tessera · rt · self-critique pass against live canvas*
*Figma file: `qv9zvloRD85aPoNeVDJVsz` · Page: `Tenure Employee Experience`*
*All nodeIds are current-session; re-search before any remediation pass.*
