# Purpose Registry + Expanded Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make purposes data-driven (a generator-emitted catalog read by engine + UI) and expand from 4 to 9 categories, including a new institutional gating class for recruiting/candidates.

**Architecture:** A single `PURPOSES` list in `_generate.py` is the source of truth → emitted as `meta.purposeCatalog` and `meta.purposes`. Two re-slices (performance, learning) and two new gated person props (benefits, work_authorization) reuse the existing person-subject gate; recruiting gates `candidate` records via a new `meta.gatedTypes` map (role + purpose only, no per-subject consent/population). The engine, roles, and UI read the data; no new files.

**Tech Stack:** Python 3 stdlib generator, pure-JS dual-mode engine, `node --test`, plain HTML/JS UI.

**Spec:** `docs/superpowers/specs/2026-06-16-purpose-registry-and-categories-design.md`

**Working dir for all paths:** repo root `/Users/mp/git-repos/poc-autonomous-hcm`.

---

## Current-state anchors (verified)

- `_generate.py`: consent `SCOPES` list ≈ line 834; `emit_fixture()` `meta = {...}` ≈ line 1001 (keys `purposes`, `gatedProps`, `gatedTargets`, `gatedEdges`); `BENEFITS` list ≈ line 403; the person frontmatter dict `fm = {...}` is built in the per-store person loop (the block with `"type": "person", "id": eid, ...`).
- `ff-engine.js`: `nodeReadable` ≈ line 126; the neighbors gated-target filter `if (!db.meta.gatedTargets[n.type]) return true;` ≈ line 172; `roleAllowsScope`, `readField`, `gate`, `refuse(trace,person,field,scope,reason,layer)` all exist.
- `ff-roles.js`: `var ALL = [4 scopes]`; `api = { ROLES, ALL_SCOPES: ALL }`.
- `app.js`: `ALL_SCOPES = window.FFRoles.ALL_SCOPES`; impersonation builds `scopes: ALL_SCOPES.slice()`; `SCOPE_LABEL` (4 entries) ≈ line 22; `SCOPE_TO_PURPOSE` (4) ≈ line 251; permission panel and profile drawer (`gatedRow`, `buildProfile`) exist.
- `index.html`: hardcoded `<option>`s under `<select id="purpose">` ≈ line 84.
- Tests: `ff-engine.test.js` has a test "C1: anchoring a gated-target type under the MATCHING purpose works" using `from:'performance_review'` under purpose `'employment'` (≈ line 187) — the re-slice MOVES performance_review to `hr.performance`, so this test must change to purpose `'performance'`.

Run tests: `node --test data/sample/restaurant-chain/*.test.js` (44 pass today).

---

## Task 1: Generator — PURPOSES registry, catalog emission, re-slice

**Files:** Modify `data/sample/restaurant-chain/_generate.py`

- [ ] **Step 1: Add the `PURPOSES` source-of-truth list.** Place it just above the `emit_fixture()` definition (near the other module-level lists, after `BENEFITS` is fine — anywhere at module scope before `emit_fixture`):

```python
# Single source of truth for purpose categories (id, label, consent scope). 1:1 today.
PURPOSES = [
    ("scheduling", "scheduling", "hr.scheduling"),
    ("payroll", "payroll", "hr.payroll"),
    ("compliance", "compliance", "hr.certifications"),
    ("employment", "employment", "hr.employment"),
    ("performance", "performance", "hr.performance"),
    ("learning", "learning", "hr.learning"),
    ("benefits", "benefits", "hr.benefits"),
    ("work_authorization", "work authorization", "hr.work_auth"),
    ("recruiting", "recruiting", "hr.recruiting"),
]
```

- [ ] **Step 2: Rewrite the `meta` dict in `emit_fixture()`** (the block starting `meta = {` ≈ line 1001) to derive purposes from `PURPOSES`, re-slice gatedTargets, add benefits/work_auth gatedProps, and add `gatedTypes`:

```python
    meta = {
        "generated": d(today),
        "purposeCatalog": [{"id": pid, "label": lbl, "scope": sc} for pid, lbl, sc in PURPOSES],
        "purposes": {pid: sc for pid, lbl, sc in PURPOSES},
        "gatedProps": {"pay_rate": "hr.payroll", "pay_unit": "hr.payroll",
                       "benefits": "hr.benefits", "work_authorization": "hr.work_auth"},
        "gatedTargets": {"time_off_request": "hr.scheduling",
                         "certification": "hr.certifications",
                         "training_record": "hr.learning",
                         "performance_review": "hr.performance",
                         "employment_event": "hr.employment"},
        "gatedEdges": {"distributes_to": "hr.payroll"},
        "gatedTypes": {"candidate": "hr.recruiting"},
    }
```

- [ ] **Step 3: Regenerate and verify the catalog + re-slice**

```bash
python3 data/sample/restaurant-chain/_generate.py >/dev/null && \
python3 - <<'PY'
import json
m = json.load(open("data/sample/restaurant-chain/forkandflame.graph.json"))["meta"]
print("catalog ids:", [p["id"] for p in m["purposeCatalog"]])
print("purposes==catalog scopes:", all(m["purposes"][p["id"]]==p["scope"] for p in m["purposeCatalog"]))
print("perf re-slice:", m["gatedTargets"]["performance_review"])      # hr.performance
print("learning re-slice:", m["gatedTargets"]["training_record"])     # hr.learning
print("gatedTypes:", m["gatedTypes"])                                  # {candidate: hr.recruiting}
PY
```
Expected: 9 catalog ids; `purposes==catalog scopes: True`; performance_review→`hr.performance`; training_record→`hr.learning`; gatedTypes shows candidate→hr.recruiting.

- [ ] **Step 4: Commit** (generator + regenerated fixture only; not `.obsidian`/notes here — but the fixture IS needed):

```bash
git add data/sample/restaurant-chain/_generate.py data/sample/restaurant-chain/forkandflame.graph.json data/sample/restaurant-chain/forkandflame.graph.js
git commit -m "Generator: data-driven purpose catalog + re-slice performance/learning + gatedTypes"
```
(If `git status` shows changed `.md` notes from the regen, leave them unstaged for now — Task 2 also regenerates and Task 6 commits the full vault.)

---

## Task 2: Generator — new person props + 8-scope consent grants

**Files:** Modify `data/sample/restaurant-chain/_generate.py`

- [ ] **Step 1: Extend the consent `SCOPES` list** (≈ line 834) to the eight EMPLOYEE scopes (recruiting is institutional, no per-employee grant):

```python
SCOPES = ["hr.scheduling", "hr.payroll", "hr.certifications", "hr.employment",
          "hr.performance", "hr.learning", "hr.benefits", "hr.work_auth"]
```
(The existing declined/expired/revoked minorities stay keyed to `hr.payroll`/`hr.certifications`/`hr.scheduling`; the four new scopes are granted `active/open` for everyone by the same loop.)

- [ ] **Step 2: Add `benefits` and `work_authorization` to the person frontmatter.** In the per-store person loop, find the `fm = { "type": "person", ... }` dict and add the two fields. Just before that dict is assembled, compute them (place next to where `et` / `skills` are computed):

```python
        bens = ["Health PPO", "401(k) Match", "Shift Meal"] if et == "full_time" else ["Shift Meal"]
        wa_pool = ["citizen"] * 16 + ["permanent_resident"] * 2 + ["visa_h1b", "tn", "ead"]
        work_auth = random.choice(wa_pool)
```
Then add to the `fm` dict (anywhere among the person keys, e.g. after `"skills": [...]`):

```python
            "benefits": bens,
            "work_authorization": work_auth,
```
And add two lines to the person note body (after the Skills section render, before Lifecycle) so it shows in notes:

```python
        body += f"## Benefits\n\n" + "".join(f"- {b}\n" for b in bens) + "\n"
        body += f"## Work authorization\n\n- {work_auth}\n\n"
```

- [ ] **Step 3: Regenerate and verify new props + grants**

```bash
python3 data/sample/restaurant-chain/_generate.py >/dev/null && \
python3 - <<'PY'
import json, collections
g = json.load(open("data/sample/restaurant-chain/forkandflame.graph.json"))
p = next(n for n in g["nodes"] if n["type"]=="person")
print("benefits:", p["props"].get("benefits"), "| work_authorization:", p["props"].get("work_authorization"))
scopes = collections.Counter()
for grs in g["grants"].values():
    for gr in grs: scopes[gr["scope"]] += 1
print("grant scopes present:", sorted(scopes))
PY
```
Expected: person has `benefits` (list) + `work_authorization` (string); grant scopes include all 8 employee scopes (incl. `hr.performance`, `hr.learning`, `hr.benefits`, `hr.work_auth`); `hr.recruiting` NOT present.

- [ ] **Step 4: Commit** (generator + fixture):

```bash
git add data/sample/restaurant-chain/_generate.py data/sample/restaurant-chain/forkandflame.graph.json data/sample/restaurant-chain/forkandflame.graph.js
git commit -m "Generator: benefits + work_authorization person props; consent grants for 8 employee scopes"
```

---

## Task 3: Engine — institutional gating (`gatedTypes`) + tests

**Files:** Modify `data/sample/restaurant-chain/ff-engine.js`, `data/sample/restaurant-chain/ff-engine.test.js`

- [ ] **Step 1: Add failing tests** (append to `ff-engine.test.js`; `FR` and `db` already in scope):

```javascript
test('re-slice: performance_review gated by hr.performance, not hr.employment', () => {
  // chro has all scopes; under "performance" purpose, reviews are readable
  const ok = FF.runSpec({ from: 'performance_review', select: ['title', 'person', 'rating'] },
    db, 'performance', FR.ROLES.chro);
  assert.ok(ok.rows.length > 0, 'reviews readable under performance');
  // under "employment" purpose, reviews are now out-of-purpose
  const no = FF.runSpec({ from: 'performance_review', select: ['title', 'person', 'rating'] },
    db, 'employment', FR.ROLES.chro);
  assert.ok(no.rows.length === 0 && no.trace.some(t => t.reason === 'out-of-purpose'));
});

test('re-slice: training_record gated by hr.learning', () => {
  const ok = FF.runSpec({ from: 'training_record', select: ['title', 'person'] }, db, 'learning', FR.ROLES.chro);
  assert.ok(ok.rows.length > 0, 'training readable under learning');
  const no = FF.runSpec({ from: 'training_record', select: ['title', 'person'] }, db, 'compliance', FR.ROLES.chro);
  assert.ok(no.rows.length === 0 && no.trace.some(t => t.reason === 'out-of-purpose'));
});

test('new props: benefits/work_authorization gated; peer redacted, chro under right purpose shown', () => {
  const peer = FF.runSpec({ from: 'person', select: ['title', 'benefits', 'work_authorization'] },
    db, 'benefits', FR.ROLES.peer);
  assert.ok(peer.rows.every(r => r.benefits === null && r.work_authorization === null));
  assert.ok(peer.trace.some(t => t.layer === 'access' && t.reason === 'role-restricted'));
  const chroB = FF.runSpec({ from: 'person', select: ['title', 'benefits'] }, db, 'benefits', FR.ROLES.chro);
  assert.ok(chroB.rows.some(r => Array.isArray(r.benefits) && r.benefits.length), 'benefits shown under benefits purpose');
  const chroWrong = FF.runSpec({ from: 'person', select: ['title', 'benefits'] }, db, 'payroll', FR.ROLES.chro);
  assert.ok(chroWrong.rows.every(r => r.benefits === null) && chroWrong.trace.some(t => t.reason === 'out-of-purpose'));
});

test('recruiting: candidates readable ONLY under recruiting purpose + recruiting authority', () => {
  const ok = FF.runSpec({ from: 'candidate', select: ['title', 'stage'] }, db, 'recruiting', FR.ROLES.chro);
  assert.ok(ok.rows.length > 0, 'candidates visible to CHRO under recruiting');
  const wrongPurpose = FF.runSpec({ from: 'candidate', select: ['title', 'stage'] }, db, 'scheduling', FR.ROLES.chro);
  assert.ok(wrongPurpose.rows.length === 0 && wrongPurpose.trace.some(t => t.layer === 'consent' && t.reason === 'out-of-purpose'));
  const noAuth = FF.runSpec({ from: 'candidate', select: ['title', 'stage'] }, db, 'recruiting', FR.ROLES.manager);
  assert.ok(noAuth.rows.length === 0 && noAuth.trace.some(t => t.layer === 'access' && t.reason === 'role-restricted'));
});
```

- [ ] **Step 2: Run — confirm FAIL** (`from:'performance_review'` under performance currently out-of-purpose since not yet re-sliced in engine? No — re-slice is in the fixture from Task 1, so performance test may already pass; the recruiting/candidate tests FAIL because gatedTypes isn't enforced yet — `from:candidate` returns all rows ungated). Specifically the recruiting `wrongPurpose`/`noAuth` assertions fail (candidates returned ungated).

Run: `node --test data/sample/restaurant-chain/ff-engine.test.js`

- [ ] **Step 3: Teach `nodeReadable` the institutional class.** Replace `nodeReadable` (≈ line 126) with:

```javascript
  function nodeReadable(node, db, purpose, trace, role, pop) {
    var scope = db.meta.gatedTargets[node.type];
    if (scope) {                                   // person-subject record: role + population + consent
      var subject = node.props.person;
      var r = readField(subject, scope, db, purpose, role, pop);
      if (!r.ok) { refuse(trace, subject || node.title, node.type, scope, r.reason, r.layer); return false; }
      return true;
    }
    var yscope = (db.meta.gatedTypes || {})[node.type];
    if (yscope) {                                  // institutional record (candidate): role + purpose only
      if (!roleAllowsScope(role, yscope)) {
        refuse(trace, node.title, node.type, yscope, 'role-restricted', 'access'); return false;
      }
      if (db.meta.purposes[purpose] !== yscope) {
        refuse(trace, node.title, node.type, yscope, 'out-of-purpose', 'consent'); return false;
      }
      return true;
    }
    return true;                                    // directory node
  }
```

- [ ] **Step 4: Extend the neighbors gated-target filter** (≈ line 172) so traversals to institutional types are also gated. Change:

```javascript
    result = result.filter(function (n) {
      if (!db.meta.gatedTargets[n.type]) return true;
      return nodeReadable(n, db, purpose, trace, role, pop);
    });
```
to:

```javascript
    result = result.filter(function (n) {
      if (!db.meta.gatedTargets[n.type] && !(db.meta.gatedTypes || {})[n.type]) return true;
      return nodeReadable(n, db, purpose, trace, role, pop);
    });
```

- [ ] **Step 5: Fix the pre-existing re-slice test.** In `ff-engine.test.js`, find the test named `C1: anchoring a gated-target type under the MATCHING purpose works` (uses `from: 'performance_review'` under purpose `'employment'`). Change its purpose from `'employment'` to `'performance'` (performance_review now lives in `hr.performance`):

```javascript
  const r = FF.runSpec({ from: 'performance_review', select: ['title', 'person', 'rating'] },
    db, 'performance', FR.ROLES ? FR.ROLES.chro : undefined);
```
If that test originally passed no role (consent-only era), keep it role-less but switch the purpose to `'performance'`:
```javascript
  const r = FF.runSpec({ from: 'performance_review', select: ['title', 'person', 'rating'] }, db, 'performance');
```
Use whichever matches the existing test's signature — only the **purpose** must change `employment`→`performance`.

- [ ] **Step 6: Run the FULL suite** — `node --test data/sample/restaurant-chain/*.test.js`. Expected: all pass (44 prior, adjusted, + 4 new = 48). If a prior test asserts performance/training under the old scope, update its purpose the same way (employment→performance, compliance→learning) WITHOUT weakening a gate.

- [ ] **Step 7: Commit:**

```bash
git add data/sample/restaurant-chain/ff-engine.js data/sample/restaurant-chain/ff-engine.test.js
git commit -m "Engine: institutional gating class (gatedTypes) for candidates; re-slice tests"
```

---

## Task 4: Roles — 9-scope universe + persona authority

**Files:** Modify `data/sample/restaurant-chain/ff-roles.js`, `data/sample/restaurant-chain/ff-roles.test.js`

- [ ] **Step 1: Update `ff-roles.js`.** Replace the `var ALL = [...]` line and the persona `scopes` + the `api` export:

```javascript
  var EMPLOYEE = ['hr.scheduling', 'hr.payroll', 'hr.certifications', 'hr.employment',
                  'hr.performance', 'hr.learning', 'hr.benefits', 'hr.work_auth'];
  var ALL = EMPLOYEE.concat(['hr.recruiting']);
```
Persona scopes:
- `chro`: `scopes: ALL.slice()`
- `hrbp`: `scopes: ALL.slice()`
- `manager`: `scopes: ['hr.scheduling', 'hr.certifications', 'hr.employment', 'hr.performance', 'hr.learning']`
- `ic`: `scopes: EMPLOYEE.slice()`
- `peer`: `scopes: []`

Export both:
```javascript
  var api = { ROLES: ROLES, ALL_SCOPES: ALL, EMPLOYEE_SCOPES: EMPLOYEE };
```

- [ ] **Step 2: Update `ff-roles.test.js`** scope-matrix assertions to the new sets. Replace the body of the test named `persona scope authority matches the design matrix` with:

```javascript
  const ALL = FR.ALL_SCOPES, EMP = FR.EMPLOYEE_SCOPES;
  assert.strictEqual(ALL.length, 9);
  assert.strictEqual(EMP.length, 8);
  assert.ok(!EMP.includes('hr.recruiting'), 'employee scopes exclude recruiting');
  assert.deepStrictEqual(FR.ROLES.chro.scopes.slice().sort(), ALL.slice().sort());
  assert.deepStrictEqual(FR.ROLES.hrbp.scopes.slice().sort(), ALL.slice().sort());
  assert.deepStrictEqual(FR.ROLES.ic.scopes.slice().sort(), EMP.slice().sort());
  assert.ok(FR.ROLES.manager.scopes.includes('hr.performance') &&
            FR.ROLES.manager.scopes.includes('hr.learning') &&
            !FR.ROLES.manager.scopes.includes('hr.payroll') &&
            !FR.ROLES.manager.scopes.includes('hr.recruiting'), 'manager matrix');
  assert.deepStrictEqual(FR.ROLES.peer.scopes, []);
```
If other ff-roles tests referenced `SCOPES` of length 4, update them to use `FR.ALL_SCOPES`/`FR.EMPLOYEE_SCOPES`.

- [ ] **Step 3: Run** `node --test data/sample/restaurant-chain/*.test.js` → all pass.

- [ ] **Step 4: Commit:**

```bash
git add data/sample/restaurant-chain/ff-roles.js data/sample/restaurant-chain/ff-roles.test.js
git commit -m "Roles: 9-scope universe (EMPLOYEE_SCOPES + recruiting); persona authority matrix"
```

---

## Task 5: UI — data-driven dropdown, labels, drawer sections

**Files:** Modify `data/sample/restaurant-chain/index.html`, `data/sample/restaurant-chain/app.js`

- [ ] **Step 1: Make the purpose dropdown data-driven.** In `index.html`, replace the four hardcoded `<option>` lines inside `<select id="purpose">` with nothing (leave the empty select):

```html
        <select id="purpose"></select>
```

- [ ] **Step 2: In `app.js`, populate the dropdown from the catalog.** Near the top of the IIFE, after `var db = ...`, add a populate call; and define it. Add this function and invoke it before `renderPermPanel()` at the bottom:

```javascript
  function populatePurposes() {
    var cat = (db.meta && db.meta.purposeCatalog) || [];
    var sel = $('purpose');
    sel.innerHTML = cat.map(function (p) {
      return '<option value="' + escAttr(p.id) + '">' + esc(p.label) + '</option>';
    }).join('');
  }
```
And at the bottom, before `renderPermPanel();`, call `populatePurposes();`.

- [ ] **Step 3: Extend `SCOPE_LABEL` (≈ line 22) and `SCOPE_TO_PURPOSE` (≈ line 251)** with the five new scopes:

`SCOPE_LABEL` becomes:
```javascript
  var SCOPE_LABEL = { 'hr.scheduling': 'scheduling', 'hr.payroll': 'compensation',
    'hr.certifications': 'compliance', 'hr.employment': 'employment',
    'hr.performance': 'performance', 'hr.learning': 'learning',
    'hr.benefits': 'benefits', 'hr.work_auth': 'work authorization',
    'hr.recruiting': 'recruiting' };
```
`SCOPE_TO_PURPOSE` becomes:
```javascript
  var SCOPE_TO_PURPOSE = { 'hr.scheduling': 'scheduling', 'hr.payroll': 'payroll',
    'hr.certifications': 'compliance', 'hr.employment': 'employment',
    'hr.performance': 'performance', 'hr.learning': 'learning',
    'hr.benefits': 'benefits', 'hr.work_auth': 'work_authorization',
    'hr.recruiting': 'recruiting' };
```

- [ ] **Step 4: Impersonation uses EMPLOYEE_SCOPES.** In `setImpersonation`, change `scopes: ALL_SCOPES.slice()` to `scopes: (window.FFRoles.EMPLOYEE_SCOPES || ALL_SCOPES).slice()`.

- [ ] **Step 5: Profile drawer — add gated sections.** In `buildProfile`, after the existing Compensation and Compliance sections, add a helper and four rows. Add near the top of `buildProfile` (person branch) a record counter:

```javascript
    var recCount = function (t, type) {
      return (((db.rev['person'] || {})[t]) || []).filter(function (x) {
        var nn = db.nodesByTitle[x]; return nn && nn.type === type; }).length;
    };
```
Then append after the Compliance `<div class="sect">…</div>`:

```javascript
    html += '<div class="sect"><strong>Performance</strong><dl>'
      + gatedRow('Reviews on file', node.title, 'hr.performance', recCount(node.title, 'performance_review'),
          role, purpose, pop) + '</dl></div>';
    html += '<div class="sect"><strong>Learning</strong><dl>'
      + gatedRow('Training records', node.title, 'hr.learning', recCount(node.title, 'training_record'),
          role, purpose, pop) + '</dl></div>';
    html += '<div class="sect"><strong>Benefits</strong><dl>'
      + gatedRow('Enrolled', node.title, 'hr.benefits',
          (p.benefits && p.benefits.length ? p.benefits.join(', ') : 'none'), role, purpose, pop)
      + '</dl></div>';
    html += '<div class="sect"><strong>Work authorization</strong><dl>'
      + gatedRow('Status', node.title, 'hr.work_auth', (p.work_authorization || '—'), role, purpose, pop)
      + '</dl></div>';
```

- [ ] **Step 6: Parse-check** `node -e "new Function(require('fs').readFileSync('data/sample/restaurant-chain/app.js','utf8'))"` exits 0; run `node --test data/sample/restaurant-chain/*.test.js` (engine unaffected → still all pass).

- [ ] **Step 7: In-browser verification** (no key): open `data/sample/restaurant-chain/index.html` and run in the console:
```javascript
[...document.getElementById('purpose').options].map(o=>o.value)   // 9 ids incl performance/learning/benefits/work_authorization/recruiting
document.getElementById('role').value='peer'; document.getElementById('role').dispatchEvent(new Event('change'));
document.getElementById('permpanel').innerText                     // Hidden lists the new classes for peer
FFApp.openDrawer(FFApp.db.idToTitle['EMP-0001'], null);
document.getElementById('drawerBody').innerText                    // shows Performance/Learning/Benefits/Work authorization sections (hidden for peer)
```
Expected: 9 purpose options; panel + drawer render the new classes; peer sees them as hidden.

- [ ] **Step 8: Commit:**

```bash
git add data/sample/restaurant-chain/index.html data/sample/restaurant-chain/app.js
git commit -m "UI: data-driven purpose dropdown; new scope labels; drawer benefits/work_auth/performance/learning"
```

---

## Task 6: Docs + final verification

**Files:** Modify `data/sample/restaurant-chain/CLAUDE.md`

- [ ] **Step 1: Update the role/purpose docs** in `data/sample/restaurant-chain/CLAUDE.md`. In the "HCM system of understanding" / role section, replace the purpose enumeration with a note that purposes are now a **data-driven catalog** (`meta.purposeCatalog`, source = `PURPOSES` in `_generate.py`) of **9 categories** (scheduling, payroll, compliance, employment, performance, learning, benefits, work_authorization, recruiting); that purpose still maps 1:1 to a scope; and that **recruiting/candidates use an institutional gating class** (`meta.gatedTypes`) gated by role + purpose only (no per-subject consent or population). Add: to add a purpose, edit the `PURPOSES` list + its data gating (`gatedProps`/`gatedTargets`/`gatedTypes`) + consent grants if employee-scoped.

- [ ] **Step 2: Final whole-loop verification:**

```bash
python3 data/sample/restaurant-chain/_generate.py >/dev/null && \
ls data/sample/restaurant-chain/ff-roles.js data/sample/restaurant-chain/ff-engine.js \
   data/sample/restaurant-chain/app.js data/sample/restaurant-chain/index.html \
   data/sample/restaurant-chain/CLAUDE.md && \
node --test data/sample/restaurant-chain/*.test.js 2>&1 | grep -E "tests [0-9]+|pass [0-9]+|fail [0-9]+"
```
Expected: app files present; `fail 0`.

- [ ] **Step 3: Commit the regenerated vault + docs** (the generator's new props/grants rewrote many notes; commit them so the committed vault matches the generator):

```bash
git add data/sample/restaurant-chain/CLAUDE.md
git add data/sample/restaurant-chain/Governance data/sample/restaurant-chain/People \
        data/sample/restaurant-chain/Candidates data/sample/restaurant-chain/forkandflame.graph.json \
        data/sample/restaurant-chain/forkandflame.graph.js
# stage any other regenerated note folders that changed, EXCLUDING .obsidian:
git add data/sample/restaurant-chain --   # then unstage obsidian:
git reset -q data/sample/restaurant-chain/.obsidian
git commit -m "Docs + regenerate vault for expanded purpose categories"
```
Confirm `git status` shows no staged `.obsidian/*`.

- [ ] **Step 4: Finish the branch** — use `superpowers:finishing-a-development-branch`.

---

## Self-review

- **Spec coverage:** registry/catalog (Task 1) ✓; re-slice performance/learning (Task 1 fixture + Task 3 tests) ✓; new props benefits/work_authorization (Task 2) ✓; recruiting institutional `gatedTypes` (Task 1 meta + Task 3 engine) ✓; 8-scope grants (Task 2) ✓; role authority matrix incl. EMPLOYEE_SCOPES/ALL_SCOPES (Task 4) ✓; impersonation = EMPLOYEE_SCOPES (Task 5) ✓; data-driven UI dropdown + labels + drawer sections + narrator map (Task 5) ✓; docs (Task 6) ✓; verification incl. recruiting-no-leak and backward-compat (Task 3) ✓.
- **Placeholder scan:** none. Task 3 Step 5 gives the exact one-line test change with both signature variants spelled out; Task 6 Step 3 spells the staging including the `.obsidian` exclusion.
- **Type/identifier consistency:** scopes spelled identically everywhere (`hr.performance`, `hr.learning`, `hr.benefits`, `hr.work_auth`, `hr.recruiting`); `meta.gatedTypes`, `meta.purposeCatalog`, `EMPLOYEE_SCOPES`/`ALL_SCOPES`, `setImpersonation`, `gatedRow(label, subjectTitle, scope, rawVal, role, purpose, pop)` match the existing code.
- **Carried risk:** the re-slice breaks any test asserting performance/training under the old scope — Task 3 Steps 5–6 handle the known one and instruct fixing any others by switching the purpose (never weakening a gate).
