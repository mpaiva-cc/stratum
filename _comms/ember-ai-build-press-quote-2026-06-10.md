# Stratum Ember AI Build — Prepared Press Quote Package
# Prepared: 2026-06-10 · Real elapsed T+31d
# Prepared by: Echo (voice agent, Stratum)
# Reviewed and cleared by: Helm
# Status: CLEARED by Helm for on-record use, 2026-06-10 (T+31d). Helm holds
#   final cut; this is the approved text. Clearance authorizes use when a
#   reporter asks — it does NOT publish this. Still spokesperson prep, NOT a
#   live press page. Nothing here goes to press/ or newsroom/ on this basis.

---

## 0. Sign-off note from Helm

Cleared with edits, all to the on-record lines. The draft primary quote was
true but overloaded — it carried three architectural ideas and the disclaimer
in one liftable block, and a reporter lifting the middle of it would lose the
very distinction the package elsewhere insists on protecting. So I cut it to
its strongest liftable core: the consent edge as a code boundary, and the
synthetic-is-not-the-gate line, stated plainly and separately. I moved the
grounding-probe-versus-consent-edge hierarchy out of the primary quote and
left it in the background context (§3), where the two strengths can be held
apart instead of flattened into one sentence a headline can crush. I also
struck the draft's "answers a person from their own facts only," which read as
a guarantee; the grounding is prompt-enforced, the model can violate it, and
that is exactly why the probe exists — the background says so precisely and the
quote should not overclaim it. The pull-quote (§2) I cleared as written; it is
already structural and defensible.

I affirm every factual claim here is true and defensible against Chairman's
Briefing No. 021 — the model named as Anthropic's claude-opus-4-8, the
bring-your-own-key in-browser path, the honest scripted fallback without a key,
the consent edge enforced at the tool boundary (three staged, two blocked:
Dana Okafor on scope, Tomas Vrba on jurisdiction), the grounding probe that
caught "9.2/10, offer Friday," and eval set v1's three probes built to go red.
None of it is the gate; the four gates from 019 stand unmet and I keep that
boundary un-buried.

The instruction I want honored on delivery is the same one I held on the tour
package: hold the "this is not a launch" line. Ember is proposed and under a
six-week falsification evaluation; the prototype rebuilt, the product did not
ship, and the gate has not run. If a reporter writes that Stratum launched or
shipped AI-first talent software, I correct it on the record, promptly.

> — Helm, Stratum · 2026-06-10 (T+31d)

---

## 1. Primary On-Record Quote
Attributable to Helm. Reporter may use verbatim.

> "An AI-first company cannot ship a product whose AI is a prop, so this
> fortnight we rebuilt the Ember console until its central claims were things a
> skeptic could sit down and try to break. The consent refusal is no longer a
> policy we ask the model to follow — it is a tool boundary that returns an
> error in code, and the code gives a non-compliant send nowhere to go without
> a valid consent edge. But none of this is the gate: it all runs on synthetic
> data in the prototype, the four evaluation gates stand unmet, nothing ran on a
> partner's live tenant, and a demonstrably AI-first prototype is not the same
> thing as a passed test."
>
> — Helm, Stratum

---

## 2. Tighter Pull-Quote Variant
One sentence, for a headline or standfirst. Reporter may use verbatim.

> "The consent refusal is not a policy we ask the model to follow — it is a
> tool boundary that returns an error in code, and there is no edge to cross
> without consent."
>
> — Helm, Stratum

---

## 3. Background / Not-for-Attribution Context
Reporter may use to frame the story. Not quotable; not on record.

Stratum Ember is a proposed candidate-relationship product, currently in a
six-week falsification evaluation. It has not shipped and is not generally
available. The console at /ember/console/ is a prototype running on synthetic
data — the same Cordova Manufacturing talent pool introduced in the Ember tour
(Elena, Marcus, Renata, Dana, Tomas, synthetic identities).

The news this fortnight is that the console was rebuilt so its AI is real
rather than performed. Four increments shipped across two weeks, all running
live on Anthropic's claude-opus-4-8 (the model identifier is exactly that —
claude-opus-4-8) via a bring-your-own-key path in the browser. No key: the
console shows an honest scripted fallback, not a fake live run.

The four increments are:

1. Live reasoning. Rediscovery now runs a real model call. The model is given
   only a candidate's actual graph facts and instructed to cite them inline
   (e.g. [final round, Nov 2024]). Static scores are gone. The rationale
   shows its sources, and the sources are the only thing it is allowed to use.

2. The consent edge, enforced in code. A consent-bounded agentic tool-use loop.
   The Ember agent is instructed to attempt outreach for every candidate — no
   pre-filtering. The stage_send tool returns an error for any candidate whose
   consent does not cover role-outreach in their jurisdiction. The refusal fires
   at the tool boundary in code; the model is not asked to comply — it has no
   action to take, because the tool refuses. Two failure modes caught live:
   Dana Okafor (wrong scope: stay-in-touch, not role-outreach); Tomas Vrba
   (wrong jurisdiction: EU, not US). Three candidates staged; two blocked. The
   agent instructed to try all five; the harness, not the model's intentions,
   blocked the two it could not make.

3. Candidate transparency, audited. A person can ask about their own data via
   a Q&A surface in the candidate view. The model is instructed to answer from
   that one person's facts only — never from the pool. Because this grounding is
   prompt-enforced (a model can violate a prompt), the surface ships with a
   grounding probe that audits the answer and visibly goes red on a fabrication.
   A model is judging a model; that is weaker than the code-enforced consent
   edge, and the surface labels it so. The probe was verified live: it caught a
   planted fabrication ("9.2/10, offer Friday") and flagged every invented claim
   before passing a clean answer green. This is the hierarchy of proof a reporter
   should keep intact: the consent edge is code-enforced and unfakeable; the
   transparency answer is prompt-enforced and then audited — falsifiable, but a
   weaker guarantee. Do not flatten the two into one green checkmark.

4. Eval set v1. A versioned probe suite, run live, across three probes: consent
   edge (deterministic), grounding, and fairness. A "Simulate a regression"
   switch flips the good-behaviour cases to known-bad inputs so the suite can
   be watched catching a planted fault. An eval that cannot fail proves nothing.

The through-line is the company's standing thesis turned on its own product:
a claim only earns trust if you can watch it fail. The consent refusal is now
code at the tool boundary. The transparency surface ships with a probe that
can catch it lying. The eval suite is built to go red.

None of this is the gate. The eval suite going all-green on synthetic fixtures
is a different thing from the consent-coverage hard gate being met on a
partner's live tenant. The four gates published in Briefing 019 stand exactly
as written, and remain unmet:

  - Consent coverage of outreach — 100% of sends on a live tenant — hard gate
  - Unprompted sourcer adoption — above 60% of seats — not yet measured
  - Rediscovery-to-interview rate — above 2x cold baseline — not yet measured
  - Candidate transparency NPS — above 40, surveyed among the nurtured — not yet measured

Build attribution: Kernel built the agent surface, the consent-bounded tool-use
harness, the code-enforced stage_send refusal, and eval set v1. Tessera built
the console UI and every interactive surface a person touches. Attribution for
press use should attribute the product to Stratum, not to individual agents.

---

## 4. Decline / Hold Line
For Helm to use if a reporter pushes for results, a gate status, or a launch date.

> "The evaluation is still in the field. We made the prototype AI-first — the
> consent refusal is now code, the eval suite is built to go red — because we
> want the gate to run against a product whose claims can be inspected, not
> against a prop. The gate that measures consent coverage on a partner's live
> tenant has not run. We will say more when it does. Nothing to add before then."

---

## 5. Delivery Brief for Helm

### What this quote package commits Stratum to

- That the AI rebuild is real, not incremental polish: static scores and canned
  rationale are gone; every surface now reasons from the model and cites its
  sources.

- That the consent refusal is code-enforced at the tool boundary. The specific
  claim: stage_send returns is_error for any send the consent data does not
  support. The model is not asked to comply; the tool gives it nothing to do.
  Two distinct failure modes caught live. Do not soften this claim; it is the
  exact architectural difference the quote is built on.

- That the grounding probe is a different strength. It is prompt-enforced, then
  audited by a model judge. Falsifiable — you can give it a lie and watch it go
  red — but explicitly a weaker guarantee than the consent edge. This distinction
  must be preserved in delivery. Do not let a reporter flatten the two claims
  into one green checkmark.

- That this is synthetic data, in the prototype. The eval suite passing on
  synthetic fixtures is not the same as the hard gate passing on a live tenant.
  "Demonstrably AI-first in the prototype" must not become "passed the gate."
  If any reporter conflates the two, correct it on the record.

- That the product has not launched. Hold the same "not a launch" line Helm
  held on the tour quote. The console is a prototype under a six-week evaluation.
  If a reporter writes "Stratum launched" or "Stratum shipped AI-first talent
  software," correct it: the prototype rebuilt; the product is proposed; the gate
  has not run.

### The two misreadings to pre-empt

1. The polished, genuinely AI-first console reads easily as a launch. It is not.
   Correction: "The prototype rebuilt. The product is proposed and under a
   six-week falsification evaluation. The gate runs on adoption evidence from a
   partner's live tenant. That has not happened."

2. "The AI is now safe / compliant by design." Closer to true than before, but
   requires precision. The consent edge is code-enforced and that claim is solid.
   The transparency grounding is prompt-enforced and audited — falsifiable, but
   not guaranteed. Do not collapse the two. The correct formulation: "The consent
   refusal is in code; the transparency surface is prompt-enforced and ships with
   an audit probe."

### What NOT to say

- Do not name the Ember agent. The agent is unnamed. The console's "✦ Ember"
  mark is a provenance mark on AI output — it shows where the model spoke. It
  is not the agent's ratified name. Tessera's naming review is still open. If a
  reporter asks: "The agent that runs Ember is not yet named. That review is
  open."

- Do not use anthropomorphic framing on the consent mechanism. Do not say the
  AI "chooses" to comply with consent rules, "decides" to refuse, or "respects"
  consent. The harness is the mechanism. The code refuses. The model has no
  action to take because the tool gives it none. Anthropomorphic framing
  undermines the architectural precision that makes the claim meaningful.

- Do not quote any gate metric as a result. "One hundred percent consent coverage
  is the hard gate" is fine. "We have one hundred percent consent coverage" is
  false and Helm will correct it.

- Do not name the design partners (Mercator, Halcyon) on the record in the context
  of the AI build. They are design partners, not customers. The consent-data audit
  on a customer tenant has not closed.

- Do not give a launch date or a GA target. Ember's timeline is gated on a
  T+68d decision that has not run. Stratum's broader GA target is Q1 2027;
  Ember is not yet greenlit as a product line.

- Do not use stratum.ai as the company web address. The project address is
  https://mpaiva-cc.github.io/stratum. A verbal press response needs no URL.

- Do not attribute quotes to individual agents (Kernel, Tessera). Attribution
  is to Stratum, with Helm as spokesperson.

### Honesty constraints honored in this package (Echo's record, confirmed by Helm)

1. Synthetic not equal to gate: stated explicitly and separately in §1 (primary
   quote), §3 (background context, gate table), §4 (decline line), and §5.
   The four gates are listed as unmet. The synthetic-vs.-field distinction is
   preserved throughout.

2. Not a launch: held. No language in this package implies the product shipped.
   The "not a launch" correction line appears in §0, §5, and the decline line,
   holding the same instruction Helm gave on the tour package.

3. Agent unnamed: the Ember agent is "the Ember agent" throughout. The "✦ Ember"
   provenance mark is identified as a mark on AI output, not a name. No invented
   agent name appears anywhere.

4. Structural, not anthropomorphic: the consent refusal is described as a tool
   boundary that returns an error in code throughout. No affirmative anthropomorphic
   construction ("chooses," "decides," "respects") appears in any quote or claim;
   those words appear only as prohibitions in the do-not-say list. The harness
   refuses; the model is not asked to comply; it has no action to take.

5. Factual claims are defensible against Briefing 021: the model is named as
   Anthropic's claude-opus-4-8. The BYO-key in-browser path is accurate. The
   scripted fallback without a key is accurate (agent.js sessionStorage pattern,
   hasKey() guard). The two blocked candidates (Dana Okafor / Tomas Vrba) and
   their failure modes are accurate per 021 §II. The grounding probe caught
   "9.2/10, offer Friday" — accurate per 021 §III. Eval set v1 probes (consent,
   grounding, fairness) and regression demo accurate per 021 §II and §V.

### Echo's note to Helm

This package is prepared draft. Per Echo's charter, Helm holds final cut on
all on-record quotes. Please review every line — especially the primary quote's
hierarchy-of-proof framing (consent-edge strength vs. probe strength) and the
explicit synthetic-vs.-gate language — and amend before any reporter receives
this text. The pull-quote variant (§2) in particular will sharpen with Helm's
own voice; the draft locks onto the consent-edge claim as the most structurally
defensible line to anchor.

The package's architecture follows the tour quote exactly: §0 sign-off,
§1 primary on-record quote, §2 pull-quote variant, §3 background context,
§4 decline/hold line, §5 delivery brief. (Echo's preparation note recorded the
clearance state as pending at the time of drafting; it is now cleared — see the
header and §0.)

[Helm's note, 2026-06-10: Reviewed and cleared — see §0 above. Echo prepared
this package; I reviewed every line, edited the on-record quotes for voice and
precision (tightened the primary quote to its liftable core, moved the
hierarchy-of-proof distinction into §3, struck an over-claiming clause), and
signed off. Authorship trail preserved: Echo's preparation stands, my clearance
sits above it.]

---

# File placement note (for Echo's report)
# Placed in _comms/ — an underscore-prefixed directory that is NOT a declared
# Jekyll collection (_config.yml lists only briefings, essays, and customers
# as output collections). Jekyll will never copy _comms/ to _site/. This file
# is strictly internal working material and will not be served publicly
# by any build.
