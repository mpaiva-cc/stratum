# Ember plan reconciliation — Abound Health prototype review

**Source:** External customer research. Abound Health CRM-prototype review, 2026-06-09.
Participant: Natalya Kurzinski, Talent Acquisition Manager. Abound Health — healthcare
employer, many recruiters, predominantly clinical roles.

**Handling:** External research, on its own terms. Abound Health is **not** a Stratum
design partner and is **not** written into the Stratum narrative (the Ember design
partners of record remain Mercator and Halcyon). This document maps Natalya's feedback
against the product as specified in **PLN-2026-004 v1.1** (`/ember/plan.html`) and the
roadmap, and proposes plan/roadmap deltas. It is internal working material — not a
public page.

**Status:** Reconciliation only. No plan or roadmap files were edited; the deltas below
are proposed, not applied.

> n = 1. One prospect in clinical staffing. Treat every item as a signal to weigh, not a
> mandate. None of this touches the canonical Ember evaluation gates (100% consent
> coverage, >60% unprompted adoption, etc.) — this is product-shaping input, not a gate
> result.

---

## 1. Source context (current state at Abound Health)

- **Stack:** Google Sheets / Excel to track event prospects; HireEasy for campaigns
  (scheduled send, click tracking); replies route to the sender's Outlook.
- **Deliverability ceiling:** ~500 emails per send before Outlook flags as spam — a
  *current, live* constraint, not a hypothetical.
- **Org shape:** many recruiters, mostly clinical-side, who (per Natalya) should *not*
  have campaign-editing access.
- **Top unmet need:** an automated alert when new job openings appear — today only
  visible via a manually generated report "once every couple of weeks."

---

## 2. What the feedback validates (premise corroboration)

Three of Natalya's points independently confirm choices the plan already made:

- **Decaying spreadsheet lists.** Event prospects live in Sheets/Excel that rot the
  moment they're built — the exact problem the **resolved-identity pool** targets
  (§ III, § IV "the pool that does not rot"). Clean corroboration of the core thesis.
- **Resistance to per-unit fees.** Her pushback on a *credit system* and on "being
  charged for internal candidates" lands on the same side as **§ V**: no per-seat, no
  per-unit; meter only on consented conversations and rediscovery-influenced hires. Her
  instinct *is* the plan's instinct.
- **Restrict who can run campaigns.** Her permissions demand rhymes with the
  agent-proposes / human-approves governance posture and the "one bad default away from a
  spam cannon" refusal stance (§ III, § VII) — though the plan never names operator-level
  permissions (see Gap 2).

---

## 3. Reconciliation — finding by finding

| # | Finding | In the plan today? | Verdict | Proposed delta |
|---|---------|--------------------|---------|----------------|
| 1 | Alert TA team when **new reqs open** | Lifecycle-triggered rediscovery fires on req-open, but surfaces *candidates* to a sourcer (§ III, v1) | **Partial / adjacent** — right trigger, wrong consumer & payload | Extend the existing req-open trigger to also emit a **team-facing "new opening" notification** (subscribe by team/department/pool). Rides infra that already exists. v1–v2. Keep it consent/permission-aware; avoid a notification firehose. |
| 2 | **Role-based permissions** — only specific people edit campaigns | Silent | **Gap (material)** | Add **operator RBAC** to § III scope + substrate: create/modify-campaign vs. view-only vs. no-access. Frame as the governance surface (Decide / Recommend / Read-only) turned toward *operators*, not just agent actions. Buyer-gating for a multi-recruiter, clinical-heavy org → treat as **v1**, not nice-to-have. |
| 3 | **Rule-setup confusing** for non-tech-savvy users | No rule-builder in the plan — model is "agent proposes, human sends" (§ III) | **Plan already answers it; prototype drifted** | The *plan's* intent (no manual rule config) is the fix. Action is on the **prototype**, not the plan: minimize/remove the rule-builder in favor of agent-proposed campaigns the user approves; where rules are unavoidable, use plain-language/templated UX. Flag prototype↔plan drift to design/Forge. |
| 4 | **Credit system** for smart search; "don't charge for internal candidates" | § V explicitly rejects per-seat **and** per-unit; meters consented conversations + rediscovery-influenced hires | **Conflict — prototype contradicts the plan** | No plan change (the plan is correct and on her side). Fix the **prototype/pricing UI**: remove per-search credits; internal candidates / internal mobility are not "consented external conversations" and must not be metered. Flag to Compass (pricing owner). |
| 5 | Campaign **messaging limits**; do messages **consume credits**? | Unit is defined (consented conversation, § V) but customer-facing clarity is absent | **Partial — clarity gap** | Pricing-clarity addition: state plainly what a metered "consented conversation" is, what's free, and any fair-use limits — legible to a non-finance user. Compass. |
| 6 | **500-email / Outlook spam** ceiling | Plan treats spam as a *consent* problem; no operational *deliverability* mechanism | **Gap (orthogonal to consent)** | Add a **deliverability / sending-infrastructure** line to § III substrate: dedicated sending domains, SPF/DKIM/DMARC, warmup, rate-shaping/throttling — and explicitly **not** sending at volume through the user's own Outlook mailbox. Important framing: *compliant ≠ deliverable.* v1-critical if campaigns send at volume. Forge. |
| 7 | Event prospects in **Sheets/Excel** | "Employer-brand & events campaigns — event check-in to pool" is a v2/deferred feature (§ III) | **Covered as deferred; demand-validated** | Keep deferred, but log Abound as a demand signal raising **event-import / check-in** priority for v2. |

---

## 4. Net deltas, prioritized

**v1-critical gaps (the plan is currently silent and a buyer like this gates on them):**
1. **Operator RBAC** — who can create/modify campaigns vs. view-only. (Finding 2)
2. **Deliverability / sending infrastructure** — dedicated domains, auth, warmup,
   throttling; do not relay volume through the user's mailbox. (Finding 6)

**Prototype fixes (drift *from* the plan, not gaps *in* it):**
3. Remove the **credit / per-search** pricing UI; don't meter internal candidates.
   (Finding 4)
4. Minimize the **manual rule-builder**; lean into agent-proposed-campaigns the user
   approves. (Finding 3)

**Enhancement (rides existing infra):**
5. **Team-facing new-req alert** on the lifecycle trigger. (Finding 1)

**Clarity:**
6. **Plain-language pricing** on what counts as a metered conversation and any limits.
   (Finding 5)

**Validated as-is (no change; cite as corroboration):**
- Outcome/no-per-seat pricing (§ V); resolved-identity pool (§ IV); agent-proposes
  governance (§ III). Event-import demand signal raises v2 priority (Finding 7).

---

## 5. Caveats / how to read this

- **n = 1**, clinical-staffing buyer. Strong on operational pain (deliverability, RBAC,
  notifications); not a basis to re-architect the core theses.
- Some asks border on **ATS territory** rather than CRM — e.g., a team-wide "new opening"
  alert is arguably a requisition-broadcast feature; weigh whether it belongs in Ember or
  upstream in Recruiter before committing it to the Ember scope.
- **Deliverability is a genuinely hard, ongoing problem** (domain reputation, provider
  policy). Treat Finding 6 as a workstream, not a checkbox.
- The two clearest takeaways are mirror images: the plan is **ahead** of this buyer on
  pricing and rule-avoidance (the prototype, not the plan, is what disappointed her), and
  **behind** on the unglamorous operational layer (permissions, deliverability) that a
  real sourcing team needs on day one.

---

## 6. Routing (proposed, if applied)

- **Forge** — RBAC model; deliverability/sending infrastructure.
- **Compass** — pricing-UI correction (kill credits); plain-language metering.
- **Design / prototype owner** — remove rule-builder, reaffirm agent-proposes; correct the
  pricing surface the prototype showed.
- **Product / roadmap** — team-req-alert scoping (Ember vs. Recruiter); raise event-import
  to a tracked v2 item.

*Deltas above are proposed only. Say which to apply and I'll edit `/ember/plan.html` and
the roadmap as in-world product changes (attributed to evaluation feedback generically —
Abound Health stays out of the narrative).*
