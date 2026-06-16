# Fork & Flame — HCM System of Understanding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the static `restaurant-chain` Obsidian vault into a standalone, BYO-key page that answers plain-language HCM questions, with the v6 governance-basis model **enforced deterministically in code**.

**Architecture:** A constrained traversal spec is the only thing the LLM emits; a pure-JS engine executes it over a generated graph fixture and applies the governance predicate (default-deny, purpose→scope) in code; the LLM then narrates the engine's rows. Two phases: Phase 1 (generator + engine + fixture) is fully testable headless; Phase 2 (browser UI + LLM) builds on it.

**Tech Stack:** Python 3 stdlib (generator), pure JS (engine, dual-mode UMD), `node --test` (`node:test`/`node:assert`) for engine tests, plain HTML/JS for the UI, Anthropic Messages API called direct-from-browser (BYO key, tool use for structured output).

**Spec:** `docs/superpowers/specs/2026-06-16-forkandflame-understanding-design.md`

**Working directory for all paths below:** repo root `/Users/mp/git-repos/poc-autonomous-hcm`. The app lives in `data/sample/restaurant-chain/`.

---

## Key conventions (read before starting)

- **Engine is dual-mode** (mirrors `engineering/people-graph-playground.js`): wrap in `(function(global){ ... })(typeof window!=='undefined'?window:globalThis)` and end with `if (typeof module!=='undefined'&&module.exports) module.exports=api; else global.FFEngine=api;`.
- **Tests** run `node --test data/sample/restaurant-chain/ff-engine.test.js` and read the **generated** fixture from disk. So the generator (Tasks 1–3) must run before engine tests pass.
- **Determinism:** the generator is seeded (`SEED = 20260615`). Re-running it must produce a byte-identical fixture. All grant assignment uses the existing seeded `random`.
- **The vault wipes itself on every generator run** (`_generate.py` deletes everything except the script). Task 1 adds the app files to a whitelist so regen doesn't delete them. The fixture is a generated artifact (NOT whitelisted — rebuilt each run).

---

## Governance model (reference for Tasks 2, 8, 11)

Four purposes, each mapped to one consent scope:

| Purpose      | Scope                |
|--------------|----------------------|
| `scheduling` | `hr.scheduling`      |
| `payroll`    | `hr.payroll`         |
| `compliance` | `hr.certifications`  |
| `employment` | `hr.employment`      |

**Gated person props:** `pay_rate`, `pay_unit` → `hr.payroll`.
**Gated traversal targets (node types reached from a person):** `time_off_request` → `hr.scheduling`; `certification`, `training_record` → `hr.certifications`; `performance_review`, `employment_event` → `hr.employment`.
**Gated edges:** `distributes_to` (tip_pool→person) → `hr.payroll`.
**Always visible (directory layer):** person `name`, `status`, `employment_type`, `hire_date`, `email`, and edges `works_at`, `in_department`, `position`, `reports_to`, `skills`. All authorization-basis entities (store, shift, schedule, device, position, region, department, organization, tip_pool node itself) are never consent-gated.

**Default-deny.** To read a gated prop/target/edge for person P, BOTH must hold: (a) the active purpose's scope equals the item's required scope, else refusal reason `out-of-purpose`; (b) P holds a grant for that scope with `status=="active"` and (`valid_to=="open"` or `valid_to >= meta.generated`), else reason `no-grant` / `revoked` / `expired`. On refusal: in `select`, redact the value; in `filters`/`traverse`, exclude the person/branch. Every refusal appends one trace entry `{person, field, scope, reason}`.

---

# Phase 1 — Generator, fixture, engine (headless, fully tested)

## Task 1: Add app files to the generator's wipe whitelist

**Files:**
- Modify: `data/sample/restaurant-chain/_generate.py:301-306`

- [ ] **Step 1: Read the current wipe block** (lines 301–306) to confirm it matches below.

```python
# wipe-and-rebuild: remove everything except this generator script
for name in os.listdir(VAULT):
    if name == os.path.basename(__file__):
        continue
    p = os.path.join(VAULT, name)
    shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
```

- [ ] **Step 2: Replace it with a whitelist**

```python
# wipe-and-rebuild: remove generated content, but preserve the generator and the
# hand-authored "system of understanding" app (index.html, app.js, ff-engine.js,
# ff-engine.test.js, CLAUDE.md). The graph fixture is generated, so it is NOT
# preserved here — it gets rebuilt every run.
KEEP = {os.path.basename(__file__), "index.html", "app.js", "ff-engine.js",
        "ff-engine.test.js", "CLAUDE.md"}
for name in os.listdir(VAULT):
    if name in KEEP:
        continue
    p = os.path.join(VAULT, name)
    shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
```

- [ ] **Step 3: Verify the generator still runs and rebuilds**

Run: `python3 data/sample/restaurant-chain/_generate.py`
Expected: prints `Vault generated at: ...` and the summary counts; no error.

- [ ] **Step 4: Commit**

```bash
git add data/sample/restaurant-chain/_generate.py
git commit -m "Generator: whitelist app files in wipe step"
```

---

## Task 2: Comprehensive, purpose-aligned consent grants

Replace the current near-vacuous block (15 people, one random scope) with a per-person baseline across all four scopes, plus a deliberate minority that triggers each refusal reason.

**Files:**
- Modify: `data/sample/restaurant-chain/_generate.py:688-696`

- [ ] **Step 1: Read the current consent-grant block** (lines 688–696) to confirm it matches below.

```python
# consent grants (the traversal predicate's source)
for ptitle, store_title, position, dept, eid, name, hire in random.sample(all_people, 15):
    scope = random.choice(["hr.employment", "hr.scheduling", "hr.payroll", "hr.certifications"])
    note("Governance", f"{eid} - consent ({scope})",
         {"type": "consent_grant", "id": nid("CNS"), "person": link(ptitle),
          "scope": scope, "purpose": "store operations", "valid_to": "open",
          "basis": "consent"},
         f"{link(ptitle)} granted scope `{scope}` for store operations. The traversal "
         f"predicate reads this grant.")
```

- [ ] **Step 2: Replace it with comprehensive grants**

```python
# consent grants (the traversal predicate's source).
# Every person gets a baseline grant for ALL FOUR scopes, EXCEPT a deliberate
# minority engineered so each refusal reason is reachable by a realistic query:
#   - declined:  no hr.payroll grant at all            -> reason "no-grant"
#   - expired:   hr.certifications grant past valid_to  -> reason "expired"
#   - revoked:   hr.scheduling grant status=revoked     -> reason "revoked"
# Seeded RNG keeps this deterministic.
SCOPES = ["hr.scheduling", "hr.payroll", "hr.certifications", "hr.employment"]
people_pool = list(all_people)
random.shuffle(people_pool)
declined_payroll = set(p[4] for p in people_pool[:60])              # ~12% no payroll grant
expired_certs    = set(p[4] for p in people_pool[60:100])           # ~8% expired cert grant
revoked_sched    = set(p[4] for p in people_pool[100:130])          # ~6% revoked scheduling grant
past_date = d(today - datetime.timedelta(days=45))

for ptitle, store_title, position, dept, eid, name, hire in all_people:
    for scope in SCOPES:
        if scope == "hr.payroll" and eid in declined_payroll:
            continue  # declined -> grant simply absent
        status, valid_to = "active", "open"
        if scope == "hr.certifications" and eid in expired_certs:
            valid_to = past_date
        if scope == "hr.scheduling" and eid in revoked_sched:
            status = "revoked"
        note("Governance", f"{eid} - consent ({scope})",
             {"type": "consent_grant", "id": nid("CNS"), "person": link(ptitle),
              "scope": scope, "purpose": "store operations", "status": status,
              "valid_to": valid_to, "basis": "consent"},
             f"{link(ptitle)} — scope `{scope}` · status `{status}` · valid_to `{valid_to}`. "
             f"The traversal predicate reads this grant.")
```

- [ ] **Step 3: Regenerate and verify the distribution**

Run:
```bash
python3 data/sample/restaurant-chain/_generate.py >/dev/null && \
python3 - <<'PY'
import glob, re, collections
c = collections.Counter()
declined = set(); 
for f in glob.glob("data/sample/restaurant-chain/Governance/*consent*.md"):
    t = open(f).read()
    scope = re.search(r"scope: (\S+)", t).group(1).strip('"`')
    status = re.search(r"status: (\S+)", t).group(1)
    valid = re.search(r"valid_to: (\S+)", t).group(1).strip('"')
    c[(scope, status, "open" if valid=="open" else "dated")] += 1
for k in sorted(c): print(k, c[k])
PY
```
Expected (counts approximate, but each category present): `hr.scheduling active open` ≈ 470, `hr.scheduling revoked open` = 30, `hr.payroll active open` ≈ 440 (60 absent), `hr.certifications active dated` = 40 plus `hr.certifications active open` ≈ 460, `hr.employment active open` = 500.

- [ ] **Step 4: Commit**

```bash
git add data/sample/restaurant-chain/_generate.py
git commit -m "Generator: comprehensive purpose-aligned consent grants with deliberate refusals"
```

---

## Task 3: Capture nodes/edges and emit the graph fixture

Hook the existing `note()` writer to record every node and every frontmatter wiki-link as an edge (verb = frontmatter key), then emit `forkandflame.graph.json` (canonical) and `forkandflame.graph.js` (browser, `window.FF_GRAPH = …`).

**Files:**
- Modify: `data/sample/restaurant-chain/_generate.py:67-77` (the `note()` function) and end of file (add `emit_fixture()` + call)

- [ ] **Step 1: Add edge/node capture inside `note()`.** Replace the existing `note()` function (lines 67–77) with:

```python
NODES = []   # [{type,title,id,props,basis}]
EDGES = []   # [{src,verb,dst}]
_WIKILINK = __import__("re").compile(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]")

def note(folder, title, frontmatter, body):
    d = os.path.join(VAULT, folder) if folder else VAULT
    os.makedirs(d, exist_ok=True)
    fm = "---\n"
    for k, v in frontmatter.items():
        fm += f"{k}:{' ' if not (isinstance(v, list) and v) else ''}{yaml_value(v)}\n"
    fm += "---\n\n"
    with open(os.path.join(d, slug(title) + ".md"), "w") as f:
        f.write(fm + body.rstrip() + "\n")
    # --- fixture capture: record the node and its frontmatter-link edges
    props = {}
    for k, v in frontmatter.items():
        if isinstance(v, str):
            m = _WIKILINK.findall(v)
            for dst in m:
                EDGES.append({"src": title, "verb": k, "dst": dst})
            props[k] = v if not m else m[0]
        elif isinstance(v, list):
            links = [mm for item in v for mm in _WIKILINK.findall(str(item))]
            for dst in links:
                EDGES.append({"src": title, "verb": k, "dst": dst})
            props[k] = links if links else v
        else:
            props[k] = v
    NODES.append({"type": frontmatter.get("type", "unknown"), "title": title,
                  "id": frontmatter.get("id"), "props": props,
                  "basis": frontmatter.get("basis")})
```

- [ ] **Step 2: Add `emit_fixture()` and call it.** Append to the end of `_generate.py` (after the report `print` block, ~line 819):

```python
# ---------------------------------------------------------------------------
# 6. fixture — the served graph the "system of understanding" reads
# ---------------------------------------------------------------------------
import json as _json

def build_grant_index():
    idx = {}
    for n in NODES:
        if n["type"] != "consent_grant":
            continue
        person = n["props"].get("person")
        if not person:
            continue
        idx.setdefault(person, []).append({
            "scope": n["props"].get("scope"),
            "status": n["props"].get("status", "active"),
            "valid_to": n["props"].get("valid_to", "open"),
        })
    return idx

def emit_fixture():
    meta = {
        "generated": d(today),
        "purposes": {"scheduling": "hr.scheduling", "payroll": "hr.payroll",
                     "compliance": "hr.certifications", "employment": "hr.employment"},
        "gatedProps": {"pay_rate": "hr.payroll", "pay_unit": "hr.payroll"},
        "gatedTargets": {"time_off_request": "hr.scheduling",
                         "certification": "hr.certifications",
                         "training_record": "hr.certifications",
                         "performance_review": "hr.employment",
                         "employment_event": "hr.employment"},
        "gatedEdges": {"distributes_to": "hr.payroll"},
    }
    graph = {"meta": meta, "nodes": NODES, "edges": EDGES, "grants": build_grant_index()}
    payload = _json.dumps(graph, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(VAULT, "forkandflame.graph.json"), "w") as f:
        f.write(payload)
    with open(os.path.join(VAULT, "forkandflame.graph.js"), "w") as f:
        f.write("/* generated by _generate.py — do not edit */\n")
        f.write("var FF_GRAPH = " + payload + ";\n")
        f.write("if (typeof module!=='undefined'&&module.exports) module.exports=FF_GRAPH;\n")
        f.write("else window.FF_GRAPH = FF_GRAPH;\n")
    print(f"  fixture:               {len(NODES)} nodes, {len(EDGES)} edges")

emit_fixture()
```

- [ ] **Step 3: Regenerate and verify the fixture**

Run:
```bash
python3 data/sample/restaurant-chain/_generate.py | tail -2 && \
python3 - <<'PY'
import json
g = json.load(open("data/sample/restaurant-chain/forkandflame.graph.json"))
print("nodes", len(g["nodes"]), "edges", len(g["edges"]), "grants_for_people", len(g["grants"]))
p = next(n for n in g["nodes"] if n["type"]=="person")
print("sample person props keys:", sorted(p["props"]))
print("has works_at edge:", any(e["verb"]=="works_at" for e in g["edges"]))
print("has 'person' reverse edges (TOR/review->person):", any(e["verb"]=="person" for e in g["edges"]))
PY
```
Expected: ~2000+ nodes, several thousand edges, `grants_for_people` ≈ 500; person props include `pay_rate`, `works_at`, `position`; both edge checks `True`.

- [ ] **Step 4: Commit**

```bash
git add data/sample/restaurant-chain/_generate.py data/sample/restaurant-chain/forkandflame.graph.json data/sample/restaurant-chain/forkandflame.graph.js
git commit -m "Generator: capture nodes/edges and emit graph fixture (json + browser js)"
```

---

## Task 4: Engine — load fixture into indices

**Files:**
- Create: `data/sample/restaurant-chain/ff-engine.js`
- Create: `data/sample/restaurant-chain/ff-engine.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// ff-engine.test.js
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const FF = require('./ff-engine.js');

const graph = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'forkandflame.graph.json'), 'utf8'));
const db = FF.buildDb(graph);

test('buildDb indexes nodes by title and type', () => {
  assert.ok(db.nodesByType.person.length >= 400, 'has people');
  const p = db.nodesByType.person[0];
  assert.strictEqual(db.nodesByTitle[p.title].id, p.id);
});

test('buildDb builds forward and reverse adjacency', () => {
  const person = db.nodesByType.person.find(n => n.props.works_at);
  const store = person.props.works_at;
  assert.ok(db.fwd.works_at[person.title].includes(store), 'forward works_at');
  assert.ok(db.rev.works_at[store].includes(person.title), 'reverse works_at');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test data/sample/restaurant-chain/ff-engine.test.js`
Expected: FAIL — `Cannot find module './ff-engine.js'`.

- [ ] **Step 3: Write the engine skeleton + `buildDb`**

```javascript
// ff-engine.js — deterministic graph engine for the Fork & Flame contextual map.
// Runs a constrained traversal spec and ENFORCES the v6 governance-basis model
// (default-deny, purpose->scope) in code. Dual-mode: Node (module.exports) and
// browser (window.FFEngine).
(function (global) {
  'use strict';

  function buildDb(graph) {
    var nodesByTitle = {}, nodesByType = {};
    graph.nodes.forEach(function (n) {
      nodesByTitle[n.title] = n;
      (nodesByType[n.type] = nodesByType[n.type] || []).push(n);
    });
    var fwd = {}, rev = {};
    graph.edges.forEach(function (e) {
      (fwd[e.verb] = fwd[e.verb] || {});
      (fwd[e.verb][e.src] = fwd[e.verb][e.src] || []).push(e.dst);
      (rev[e.verb] = rev[e.verb] || {});
      (rev[e.verb][e.dst] = rev[e.verb][e.dst] || []).push(e.src);
    });
    return { graph: graph, meta: graph.meta, grants: graph.grants,
             nodesByTitle: nodesByTitle, nodesByType: nodesByType, fwd: fwd, rev: rev };
  }

  var api = { buildDb: buildDb };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.FFEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test data/sample/restaurant-chain/ff-engine.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add data/sample/restaurant-chain/ff-engine.js data/sample/restaurant-chain/ff-engine.test.js
git commit -m "Engine: buildDb loads fixture into title/type/adjacency indices"
```

---

## Task 5: Engine — `from` + `filters`

**Files:**
- Modify: `data/sample/restaurant-chain/ff-engine.js`, `data/sample/restaurant-chain/ff-engine.test.js`

- [ ] **Step 1: Add the failing test** (append to test file)

```javascript
test('from+filters: bartenders at Store 11 are found by position', () => {
  const res = FF.runSpec({
    from: 'person',
    filters: [
      { field: 'works_at', op: 'eq', value: 'Store 11 - Chicago Loop' },
      { field: 'position', op: 'eq', value: 'Bartender' }
    ],
    select: ['title', 'position']
  }, db, 'scheduling');
  assert.ok(res.rows.length >= 1, 'at least one bartender');
  res.rows.forEach(r => assert.strictEqual(r.position, 'Bartender'));
});

test('filter op "contains" works on list props (skills)', () => {
  const res = FF.runSpec({
    from: 'person',
    filters: [{ field: 'skills', op: 'contains', value: 'Guest Recovery' }],
    select: ['title']
  }, db, 'scheduling');
  assert.ok(res.rows.length > 0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test data/sample/restaurant-chain/ff-engine.test.js`
Expected: FAIL — `FF.runSpec is not a function`.

- [ ] **Step 3: Implement `runSpec` (from + filters + select), add to `api`**

Insert before the `var api =` line:

```javascript
  function matchFilter(node, f) {
    var v = node.props[f.field];
    switch (f.op) {
      case 'eq': return v === f.value;
      case 'neq': return v !== f.value;
      case 'in': return Array.isArray(f.value) && f.value.indexOf(v) !== -1;
      case 'contains':
        return Array.isArray(v) ? v.indexOf(f.value) !== -1
                                : typeof v === 'string' && v.indexOf(f.value) !== -1;
      case 'gt': return Number(v) > Number(f.value);
      case 'lt': return Number(v) < Number(f.value);
      case 'exists': return v !== undefined && v !== null && v !== '';
      default: return false;
    }
  }

  function project(node, select) {
    var row = {};
    (select || ['title']).forEach(function (field) { row[field] = node.props[field]; });
    if (!select || select.indexOf('title') === -1) row.title = node.title;
    return row;
  }

  function runSpec(spec, db, purpose) {
    var trace = [], citations = {};
    var nodes = (db.nodesByType[spec.from] || []).slice();
    (spec.filters || []).forEach(function (f) {
      nodes = nodes.filter(function (n) { return matchFilter(n, f); });
    });
    nodes.forEach(function (n) { citations[n.title] = n.type; });
    var rows = nodes.map(function (n) { return project(n, spec.select); });
    return { rows: rows, trace: trace,
             citations: Object.keys(citations).map(function (t) {
               return { title: t, type: citations[t] }; }) };
  }
```

Add `matchFilter`, `project`, `runSpec` to the `api` object:

```javascript
  var api = { buildDb: buildDb, runSpec: runSpec, matchFilter: matchFilter };
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test data/sample/restaurant-chain/ff-engine.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add data/sample/restaurant-chain/ff-engine.js data/sample/restaurant-chain/ff-engine.test.js
git commit -m "Engine: runSpec from+filters+select"
```

---

## Task 6: Engine — `traverse` (outbound and inbound edges)

`traverse` follows an edge from the current node set to related nodes. `direction:"out"` uses `db.fwd[verb]` (e.g. person → store via `works_at`); `direction:"in"` uses `db.rev[verb]` filtered by target type (e.g. person ← `person` from `time_off_request` notes).

**Files:**
- Modify: `data/sample/restaurant-chain/ff-engine.js`, `data/sample/restaurant-chain/ff-engine.test.js`

- [ ] **Step 1: Add the failing test**

```javascript
test('traverse out: person -> store name via works_at', () => {
  const res = FF.runSpec({
    from: 'person',
    filters: [{ field: 'position', op: 'eq', value: 'General Manager' }],
    traverse: [{ to: 'store', on: 'works_at', direction: 'out', as: 'store' }],
    select: ['title']
  }, db, 'scheduling');
  assert.ok(res.rows.length >= 1);
  assert.ok(res.rows.every(r => r.store && r.store.length));
});

test('traverse in: person <- time_off_request via person edge', () => {
  // every TOR note links to its person via the "person" verb (inbound to person)
  const withTOR = FF.runSpec({
    from: 'person',
    traverse: [{ to: 'time_off_request', on: 'person', direction: 'in', as: 'timeoff' }],
    select: ['title'],
    require: ['timeoff']           // keep only people who have ≥1 matched neighbor
  }, db, 'scheduling');
  assert.ok(withTOR.rows.length >= 1, 'someone has a time-off request');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test data/sample/restaurant-chain/ff-engine.test.js`
Expected: FAIL — traversal not implemented / `store` undefined in rows.

- [ ] **Step 3: Implement traversal.** Replace `runSpec` with this version (adds `traverse` + `require`):

```javascript
  function neighbors(db, title, hop) {
    var map = hop.direction === 'in' ? db.rev[hop.on] : db.fwd[hop.on];
    var titles = (map && map[title]) || [];
    return titles
      .map(function (t) { return db.nodesByTitle[t]; })
      .filter(Boolean)
      .filter(function (n) { return !hop.to || n.type === hop.to; })
      .filter(function (n) {
        return (hop.filters || []).every(function (f) { return matchFilter(n, f); });
      });
  }

  function runSpec(spec, db, purpose) {
    var trace = [], citations = {};
    var nodes = (db.nodesByType[spec.from] || []).slice();
    (spec.filters || []).forEach(function (f) {
      nodes = nodes.filter(function (n) { return matchFilter(n, f); });
    });
    // traversals attach matched neighbor titles under each hop's `as`
    var hops = spec.traverse || [];
    var enriched = nodes.map(function (n) {
      var ctx = { node: n, hops: {} };
      hops.forEach(function (hop) {
        ctx.hops[hop.as || hop.to] = neighbors(db, n.title, hop).map(function (m) {
          citations[m.title] = m.type; return m.title;
        });
      });
      return ctx;
    });
    (spec.require || []).forEach(function (asName) {
      enriched = enriched.filter(function (c) { return (c.hops[asName] || []).length > 0; });
    });
    enriched.forEach(function (c) { citations[c.node.title] = c.node.type; });
    var rows = enriched.map(function (c) {
      var row = project(c.node, spec.select);
      Object.keys(c.hops).forEach(function (k) { row[k] = c.hops[k]; });
      return row;
    });
    return { rows: rows, trace: trace,
             citations: Object.keys(citations).map(function (t) {
               return { title: t, type: citations[t] }; }) };
  }
```

Update `api` to also export `neighbors`:

```javascript
  var api = { buildDb: buildDb, runSpec: runSpec, matchFilter: matchFilter, neighbors: neighbors };
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test data/sample/restaurant-chain/ff-engine.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add data/sample/restaurant-chain/ff-engine.js data/sample/restaurant-chain/ff-engine.test.js
git commit -m "Engine: traverse outbound/inbound edges with require filter"
```

---

## Task 7: Engine — `aggregate` (count/avg/sum/min/max + groupBy)

**Files:**
- Modify: `data/sample/restaurant-chain/ff-engine.js`, `data/sample/restaurant-chain/ff-engine.test.js`

- [ ] **Step 1: Add the failing test**

```javascript
test('aggregate count groupBy in_department matches per-dept node counts', () => {
  const res = FF.runSpec({
    from: 'person',
    aggregate: { op: 'count', groupBy: 'in_department' }
  }, db, 'scheduling');
  // independently count from the index
  const expected = {};
  db.nodesByType.person.forEach(p => {
    const k = p.props.in_department; expected[k] = (expected[k] || 0) + 1;
  });
  res.rows.forEach(r => assert.strictEqual(r.value, expected[r.group],
    'dept ' + r.group));
  assert.strictEqual(res.rows.length, Object.keys(expected).length);
});

test('aggregate count (no groupBy) returns total', () => {
  const res = FF.runSpec({ from: 'store', aggregate: { op: 'count' } }, db, 'scheduling');
  assert.strictEqual(res.rows[0].value, db.nodesByType.store.length);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test data/sample/restaurant-chain/ff-engine.test.js`
Expected: FAIL — aggregate ignored, rows are raw nodes.

- [ ] **Step 3: Implement aggregation.** Add `aggregate()` and branch in `runSpec` before the `var rows =` line — replace the `rows`/return tail of `runSpec` with:

```javascript
    if (spec.aggregate) {
      var agg = aggregate(enriched.map(function (c) { return c.node; }), spec.aggregate);
      return { rows: agg, trace: trace,
               citations: Object.keys(citations).map(function (t) {
                 return { title: t, type: citations[t] }; }) };
    }
    var rows = enriched.map(function (c) {
      var row = project(c.node, spec.select);
      Object.keys(c.hops).forEach(function (k) { row[k] = c.hops[k]; });
      return row;
    });
    return { rows: rows, trace: trace,
             citations: Object.keys(citations).map(function (t) {
               return { title: t, type: citations[t] }; }) };
  }

  function aggregate(nodes, spec) {
    var groups = {};
    nodes.forEach(function (n) {
      var key = spec.groupBy ? n.props[spec.groupBy] : '__all__';
      (groups[key] = groups[key] || []).push(n);
    });
    return Object.keys(groups).map(function (key) {
      var vals = groups[key].map(function (n) { return Number(n.props[spec.field]); })
        .filter(function (x) { return !isNaN(x); });
      var value;
      switch (spec.op) {
        case 'count': value = groups[key].length; break;
        case 'sum': value = vals.reduce(function (a, b) { return a + b; }, 0); break;
        case 'avg': value = vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : null; break;
        case 'min': value = vals.length ? Math.min.apply(null, vals) : null; break;
        case 'max': value = vals.length ? Math.max.apply(null, vals) : null; break;
        default: value = null;
      }
      var row = { value: value, n: groups[key].length };
      if (spec.groupBy) row.group = key;
      return row;
    });
  }
```

Update `api`:

```javascript
  var api = { buildDb: buildDb, runSpec: runSpec, matchFilter: matchFilter,
              neighbors: neighbors, aggregate: aggregate };
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test data/sample/restaurant-chain/ff-engine.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add data/sample/restaurant-chain/ff-engine.js data/sample/restaurant-chain/ff-engine.test.js
git commit -m "Engine: aggregate count/avg/sum/min/max with groupBy"
```

---

## Task 8: Engine — governance predicate + trace (THE core feature)

Gate reads of consent-protected props, traversal targets, and edges. This is the load-bearing task; it has tests for all four refusal reasons.

**Files:**
- Modify: `data/sample/restaurant-chain/ff-engine.js`, `data/sample/restaurant-chain/ff-engine.test.js`

- [ ] **Step 1: Add the failing tests**

```javascript
const { test: t2 } = require('node:test'); // alias not needed; reuse `test`

test('canRead: out-of-purpose blocks pay_rate under scheduling', () => {
  const p = db.nodesByType.person.find(n => n.props.pay_rate);
  const v = FF.canRead(p.title, 'pay_rate', db, 'scheduling');
  assert.strictEqual(v.ok, false);
  assert.strictEqual(v.reason, 'out-of-purpose');
});

test('canRead: pay_rate allowed under payroll when grant active', () => {
  // find a person who is NOT in the declined-payroll set: has an active hr.payroll grant
  const ok = db.nodesByType.person.find(n =>
    (db.grants[n.title] || []).some(g => g.scope === 'hr.payroll' && g.status === 'active'));
  const v = FF.canRead(ok.title, 'pay_rate', db, 'payroll');
  assert.strictEqual(v.ok, true);
});

test('canRead: no-grant when person declined hr.payroll', () => {
  const declined = db.nodesByType.person.find(n =>
    !(db.grants[n.title] || []).some(g => g.scope === 'hr.payroll'));
  assert.ok(declined, 'fixture has a declined-payroll person');
  const v = FF.canRead(declined.title, 'pay_rate', db, 'payroll');
  assert.deepStrictEqual([v.ok, v.reason], [false, 'no-grant']);
});

test('canRead: expired when hr.certifications grant past valid_to', () => {
  const expired = db.nodesByType.person.find(n =>
    (db.grants[n.title] || []).some(g => g.scope === 'hr.certifications'
      && g.valid_to !== 'open' && g.valid_to < db.meta.generated));
  assert.ok(expired, 'fixture has an expired-cert person');
  // certifications are reached as a traversal target; canReadTarget mirrors canRead
  const v = FF.canReadTarget(expired.title, 'certification', db, 'compliance');
  assert.deepStrictEqual([v.ok, v.reason], [false, 'expired']);
});

test('canRead: revoked when hr.scheduling grant status=revoked', () => {
  const revoked = db.nodesByType.person.find(n =>
    (db.grants[n.title] || []).some(g => g.scope === 'hr.scheduling' && g.status === 'revoked'));
  assert.ok(revoked, 'fixture has a revoked-scheduling person');
  const v = FF.canReadTarget(revoked.title, 'time_off_request', db, 'scheduling');
  assert.deepStrictEqual([v.ok, v.reason], [false, 'revoked']);
});

test('select of pay_rate under payroll redacts declined person and traces it', () => {
  const res = FF.runSpec({
    from: 'person', select: ['title', 'pay_rate']
  }, db, 'payroll');
  const redacted = res.rows.filter(r => r.pay_rate === null);
  assert.ok(redacted.length >= 1, 'some pay_rate redacted');
  assert.ok(res.trace.some(t => t.reason === 'no-grant' && t.field === 'pay_rate'));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test data/sample/restaurant-chain/ff-engine.test.js`
Expected: FAIL — `FF.canRead is not a function`.

- [ ] **Step 3: Implement the governance predicate and wire it into `project`/`neighbors`.**

Add these functions before `runSpec`:

```javascript
  function checkGrant(personTitle, scope, db) {
    var grants = (db.grants[personTitle] || []).filter(function (g) { return g.scope === scope; });
    if (!grants.length) return { ok: false, reason: 'no-grant' };
    var active = grants.filter(function (g) { return g.status === 'active'; });
    if (!active.length) return { ok: false, reason: 'revoked' };
    var unexpired = active.filter(function (g) {
      return g.valid_to === 'open' || g.valid_to >= db.meta.generated;
    });
    if (!unexpired.length) return { ok: false, reason: 'expired' };
    return { ok: true };
  }

  function gate(personTitle, requiredScope, db, purpose) {
    var purposeScope = db.meta.purposes[purpose];
    if (purposeScope !== requiredScope) return { ok: false, reason: 'out-of-purpose' };
    return checkGrant(personTitle, requiredScope, db);
  }

  function canRead(personTitle, field, db, purpose) {
    var scope = db.meta.gatedProps[field];
    if (!scope) return { ok: true };            // directory-level prop
    return gate(personTitle, scope, db, purpose);
  }

  function canReadTarget(personTitle, targetType, db, purpose) {
    var scope = db.meta.gatedTargets[targetType];
    if (!scope) return { ok: true };
    return gate(personTitle, scope, db, purpose);
  }

  function canReadEdge(personTitle, verb, db, purpose) {
    var scope = db.meta.gatedEdges[verb];
    if (!scope) return { ok: true };
    return gate(personTitle, scope, db, purpose);
  }
```

Replace `project` so it gates fields and records trace (it needs `db`, `purpose`, `trace`):

```javascript
  function project(node, select, db, purpose, trace) {
    var row = {}, fields = select || ['title'];
    fields.forEach(function (field) {
      if (field === 'title') { row.title = node.title; return; }
      var verdict = node.type === 'person'
        ? canRead(node.title, field, db, purpose) : { ok: true };
      if (verdict.ok) { row[field] = node.props[field]; }
      else {
        row[field] = null;
        trace.push({ person: node.title, field: field,
                     scope: db.meta.gatedProps[field], reason: verdict.reason });
      }
    });
    if (fields.indexOf('title') === -1) row.title = node.title;
    return row;
  }
```

Update `neighbors` to gate traversal targets (and record trace). Change its signature and body:

```javascript
  function neighbors(db, title, hop, purpose, trace) {
    var verdict = canReadTarget(title, hop.to, db, purpose);
    if (!verdict.ok) {
      if (trace) trace.push({ person: title, field: hop.to,
                              scope: db.meta.gatedTargets[hop.to], reason: verdict.reason });
      return [];
    }
    var map = hop.direction === 'in' ? db.rev[hop.on] : db.fwd[hop.on];
    var titles = (map && map[title]) || [];
    return titles.map(function (t) { return db.nodesByTitle[t]; }).filter(Boolean)
      .filter(function (n) { return !hop.to || n.type === hop.to; })
      .filter(function (n) { return (hop.filters || []).every(function (f) { return matchFilter(n, f); }); });
  }
```

In `runSpec`, update the two call sites to pass `purpose`/`trace`:
- the traversal call: `ctx.hops[hop.as || hop.to] = neighbors(db, n.title, hop, purpose, trace)...`
- the projection call: `var row = project(c.node, spec.select, db, purpose, trace);`

Update `api` to export the predicate functions:

```javascript
  var api = { buildDb: buildDb, runSpec: runSpec, matchFilter: matchFilter,
              neighbors: neighbors, aggregate: aggregate,
              canRead: canRead, canReadTarget: canReadTarget,
              canReadEdge: canReadEdge, checkGrant: checkGrant };
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test data/sample/restaurant-chain/ff-engine.test.js`
Expected: PASS (all tests, including the 6 governance tests).

- [ ] **Step 5: Commit**

```bash
git add data/sample/restaurant-chain/ff-engine.js data/sample/restaurant-chain/ff-engine.test.js
git commit -m "Engine: deterministic governance predicate (default-deny) + refusal trace"
```

---

## Task 9: Validate the starter questions resolve against the fixture

Pin the demo questions by writing their traversal specs by hand and asserting non-empty / governed results. This guarantees the few-shot examples in Phase 2 are real.

**Files:**
- Create: `data/sample/restaurant-chain/ff-starters.test.js`

- [ ] **Step 1: Write the test (each starter = a confirmed spec)**

```javascript
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const FF = require('./ff-engine.js');
const graph = JSON.parse(fs.readFileSync(path.join(__dirname, 'forkandflame.graph.json'), 'utf8'));
const db = FF.buildDb(graph);

test('Q: how many people per department', () => {
  const r = FF.runSpec({ from: 'person', aggregate: { op: 'count', groupBy: 'in_department' } }, db, 'employment');
  assert.ok(r.rows.length >= 3 && r.rows.every(x => x.value > 0));
});

test('Q: bartenders at Store 11 (directory, no refusals)', () => {
  const r = FF.runSpec({ from: 'person', filters: [
    { field: 'works_at', op: 'eq', value: 'Store 11 - Chicago Loop' },
    { field: 'position', op: 'eq', value: 'Bartender' }], select: ['title', 'position'] }, db, 'scheduling');
  assert.strictEqual(r.trace.length, 0);
});

test('Q: average pay by department under payroll fires real refusals', () => {
  const r = FF.runSpec({ from: 'person', select: ['title', 'pay_rate'] }, db, 'payroll');
  assert.ok(r.trace.some(t => t.reason === 'no-grant'));
  assert.ok(r.rows.some(x => x.pay_rate !== null), 'most pay visible');
});

test('Q: pay under scheduling is wholesale out-of-purpose', () => {
  const r = FF.runSpec({ from: 'person', select: ['title', 'pay_rate'] }, db, 'scheduling');
  assert.ok(r.rows.every(x => x.pay_rate === null));
  assert.ok(r.trace.every(t => t.reason === 'out-of-purpose'));
});
```

- [ ] **Step 2: Run to verify** (these should pass immediately if the engine is correct)

Run: `node --test data/sample/restaurant-chain/ff-starters.test.js`
Expected: PASS (4 tests). If "bartenders at Store 11" returns rows but you want to confirm count, run the spec ad hoc; if zero bartenders exist at Store 11, change the starter to a store that has one (find with: `grep -l 'position: "\[\[Bartender\]\]"' data/sample/restaurant-chain/People/*.md | xargs grep -l 'Store 11' ` and pick a store that matches).

- [ ] **Step 3: Commit**

```bash
git add data/sample/restaurant-chain/ff-starters.test.js
git commit -m "Engine: pin starter questions as validated traversal specs"
```

---

**Phase 1 checkpoint:** `node --test data/sample/restaurant-chain/*.test.js` is green. The engine + governance work with no API key. This is independently shippable.

---

# Phase 2 — Browser UI + LLM

## Task 10: UI shell — load engine + fixture, purpose selector, render a hard-coded spec

No LLM yet. Prove the engine renders in the browser and the governance trace shows. Manually verified (DOM, no key).

**Files:**
- Create: `data/sample/restaurant-chain/index.html`
- Create: `data/sample/restaurant-chain/app.js`

- [ ] **Step 1: Write `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fork &amp; Flame — System of Understanding</title>
  <style>
    :root { --ink:#1a1a1a; --paper:#faf8f3; --ochre:#b8860b; --moss:#4a5d3a;
            --plum:#6b4e71; --line:#e0dccf; }
    body { font:16px/1.55 -apple-system,Segoe UI,Roboto,sans-serif; color:var(--ink);
           background:var(--paper); max-width:760px; margin:2rem auto; padding:0 1rem; }
    h1 { font-weight:700; } .muted { color:#777; }
    select,input,button { font:inherit; padding:.5rem .6rem; border:1px solid var(--line); border-radius:6px; }
    #q { width:100%; box-sizing:border-box; }
    button { background:var(--ink); color:var(--paper); cursor:pointer; border:none; }
    .panel { border:1px solid var(--line); border-radius:8px; padding:1rem; margin:1rem 0; background:#fff; }
    .trace { border-left:3px solid var(--plum); background:#f7f3f8; }
    .spec { font:13px/1.4 ui-monospace,Menlo,monospace; white-space:pre-wrap; background:#f4f2ec; padding:.75rem; border-radius:6px; }
    .badge { font-size:12px; padding:1px 7px; border-radius:10px; background:#eee; }
    .redacted { color:var(--plum); font-style:italic; }
    table { border-collapse:collapse; width:100%; } td,th { border-bottom:1px solid var(--line); padding:.35rem .5rem; text-align:left; }
  </style>
</head>
<body>
  <h1>Fork &amp; Flame · System of Understanding</h1>
  <p class="muted">Ask the contextual map a question. Governance is enforced — answers
     that a purpose can’t satisfy are refused, in code.</p>

  <div class="panel">
    <label>Purpose
      <select id="purpose">
        <option value="scheduling">scheduling</option>
        <option value="payroll">payroll</option>
        <option value="compliance">compliance</option>
        <option value="employment">employment</option>
      </select>
    </label>
    <p><input id="q" placeholder="e.g. average pay by department"></p>
    <p>
      <input id="key" type="password" placeholder="Anthropic API key (kept in this browser only)" size="40">
      <button id="ask">Ask</button>
    </p>
    <p class="muted" id="status"></p>
  </div>

  <div id="answer"></div>

  <script src="forkandflame.graph.js"></script>
  <script src="ff-engine.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `app.js` with a `renderResult` and a temporary hard-coded run**

```javascript
'use strict';
(function () {
  var db = window.FFEngine.buildDb(window.FF_GRAPH);
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g,
    function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' })[c]; }); }

  function renderResult(spec, result, narrative) {
    var html = '';
    if (narrative) html += '<div class="panel"><p>' + esc(narrative) + '</p></div>';
    // rows
    html += '<div class="panel"><strong>Result (' + result.rows.length + ' rows)</strong><table><tbody>';
    result.rows.slice(0, 50).forEach(function (r) {
      html += '<tr>' + Object.keys(r).map(function (k) {
        var v = r[k];
        if (v === null) return '<td class="redacted">redacted</td>';
        if (Array.isArray(v)) v = v.length;
        return '<td>' + esc(v) + '</td>';
      }).join('') + '</tr>';
    });
    html += '</tbody></table></div>';
    // governance trace
    if (result.trace.length) {
      var byReason = {};
      result.trace.forEach(function (t) { byReason[t.reason] = (byReason[t.reason] || 0) + 1; });
      html += '<div class="panel trace"><strong>Governance trace</strong><ul>';
      Object.keys(byReason).forEach(function (reason) {
        html += '<li><span class="badge">' + esc(reason) + '</span> ' + byReason[reason] + ' refusal(s)</li>';
      });
      html += '</ul></div>';
    }
    // the query that ran
    html += '<div class="panel"><strong>Query that ran</strong><div class="spec">' +
            esc(JSON.stringify(spec, null, 2)) + '</div></div>';
    // citations
    html += '<div class="panel"><strong>Based on ' + result.citations.length +
            ' notes</strong></div>';
    $('answer').innerHTML = html;
  }

  // TEMPORARY smoke-test wiring (replaced in Task 12): run a fixed spec on click.
  $('ask').addEventListener('click', function () {
    var purpose = $('purpose').value;
    var spec = { from: 'person', select: ['title', 'pay_rate'] };
    var result = window.FFEngine.runSpec(spec, db, purpose);
    renderResult(spec, result, '(smoke test — fixed query)');
  });

  window.FFApp = { db: db, renderResult: renderResult, esc: esc };
})();
```

- [ ] **Step 3: Manually verify in the browser**

Run: `open data/sample/restaurant-chain/index.html`
Do: select **payroll**, click **Ask** → table shows pay rates with a few `redacted`, trace shows `no-grant` count, the spec panel shows the JSON. Switch to **scheduling**, click **Ask** → every pay_rate `redacted`, trace shows `out-of-purpose`. This is the "watch it fail" confirmation.

- [ ] **Step 4: Commit**

```bash
git add data/sample/restaurant-chain/index.html data/sample/restaurant-chain/app.js
git commit -m "UI: shell renders engine results + governance trace (no LLM yet)"
```

---

## Task 11: LLM translator — question → traversal spec (Claude tool use, BYO key)

**Files:**
- Modify: `data/sample/restaurant-chain/app.js`

**Reference:** consult the `claude-api` skill for the Messages API shape, current model IDs, and tool-use. Use model `claude-sonnet-4-6` (fast/cheap, reliable structured output). Direct-from-browser requires header `anthropic-dangerous-direct-browser-access: true`.

- [ ] **Step 1: Add the edge directory + tool schema + `translate()` to `app.js`** (insert above the click handler)

```javascript
  // Build the edge directory from the fixture so the LLM only references real edges.
  function edgeDirectory(db) {
    var byType = {};
    db.graph.edges.forEach(function (e) {
      var src = db.nodesByTitle[e.src], dst = db.nodesByTitle[e.dst];
      if (!src || !dst) return;
      byType[src.type] = byType[src.type] || {};
      byType[src.type][e.verb] = dst.type;
    });
    return byType;
  }

  var SPEC_TOOL = {
    name: 'run_query',
    description: 'Emit a traversal spec to run against the Fork & Flame contextual map.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'anchor node type, e.g. person, store' },
        filters: { type: 'array', items: { type: 'object', properties: {
          field: { type: 'string' }, op: { type: 'string',
            enum: ['eq','neq','in','contains','gt','lt','exists'] },
          value: {} }, required: ['field','op'] } },
        traverse: { type: 'array', items: { type: 'object', properties: {
          to: { type: 'string' }, on: { type: 'string' },
          direction: { type: 'string', enum: ['in','out'] }, as: { type: 'string' },
          filters: { type: 'array' } }, required: ['to','on','direction'] } },
        require: { type: 'array', items: { type: 'string' } },
        select: { type: 'array', items: { type: 'string' } },
        aggregate: { type: 'object', properties: {
          op: { type: 'string', enum: ['count','avg','sum','min','max'] },
          field: { type: 'string' }, groupBy: { type: 'string' } }, required: ['op'] }
      },
      required: ['from']
    }
  };

  function systemPrompt(db, purpose) {
    return [
      'You translate an HCM question into ONE run_query tool call over a graph.',
      'Node types: ' + Object.keys(db.nodesByType).join(', ') + '.',
      'Edge directory (fromType -> {verb: toType}): ' + JSON.stringify(edgeDirectory(db)) + '.',
      'Person props you may filter/select: title, name, status, employment_type,',
      'hire_date, position, works_at, in_department, reports_to, skills, pay_rate, pay_unit.',
      'Reverse traversals use direction:"in" on the verb that points at the person',
      '(e.g. time_off_request/performance_review/employment_event link a person via verb "person").',
      'The active purpose is "' + purpose + '". Do NOT try to bypass governance;',
      'the engine enforces it. Always answer with exactly one run_query tool call.'
    ].join(' ');
  }

  async function translate(question, db, purpose, key) {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key,
        'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024,
        system: systemPrompt(db, purpose), tools: [SPEC_TOOL],
        tool_choice: { type: 'tool', name: 'run_query' },
        messages: [{ role: 'user', content: question }] })
    });
    if (!res.ok) throw new Error('translate failed: ' + res.status + ' ' + (await res.text()));
    var data = await res.json();
    var tool = (data.content || []).find(function (b) { return b.type === 'tool_use'; });
    if (!tool) throw new Error('model did not emit a query');
    return tool.input;
  }
```

- [ ] **Step 2: Add a minimal spec validator**

```javascript
  function validateSpec(spec, db) {
    if (!spec || typeof spec.from !== 'string' || !db.nodesByType[spec.from])
      throw new Error('invalid "from": ' + (spec && spec.from));
    return spec;
  }
```

- [ ] **Step 3: Manual smoke test of translation** (temporary): change the click handler to log the spec.

```javascript
  $('ask').addEventListener('click', async function () {
    var purpose = $('purpose').value, key = $('key').value.trim(), question = $('q').value.trim();
    if (!key) { $('status').textContent = 'enter an API key'; return; }
    $('status').textContent = 'translating…';
    try {
      var spec = validateSpec(await translate(question, db, purpose, key), db);
      console.log('SPEC', spec);
      var result = window.FFEngine.runSpec(spec, db, purpose);
      renderResult(spec, result, null);
      $('status').textContent = '';
    } catch (e) { $('status').textContent = String(e.message); }
  });
```

- [ ] **Step 4: Verify in browser**

Run: `open data/sample/restaurant-chain/index.html`
Do: enter key, purpose **employment**, ask "how many people per department" → spec panel shows an aggregate spec; result table shows per-department counts. Ask "average pay by department" under **payroll** → spec has `aggregate avg pay_rate groupBy in_department`; refusals appear in trace. Confirm numbers match `node --test` expectations.

- [ ] **Step 5: Commit**

```bash
git add data/sample/restaurant-chain/app.js
git commit -m "UI: LLM translator (Claude tool use) question -> traversal spec"
```

---

## Task 12: LLM narrator + final wiring

**Files:**
- Modify: `data/sample/restaurant-chain/app.js`

- [ ] **Step 1: Add `narrate()`** (second LLM call: rows+trace → prose). Insert above the click handler.

```javascript
  async function narrate(question, spec, result, purpose, key) {
    var facts = { rows: result.rows.slice(0, 80),
                  refusals: result.trace.length,
                  refusal_reasons: result.trace.reduce(function (a, t) {
                    a[t.reason] = (a[t.reason] || 0) + 1; return a; }, {}) };
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key,
        'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 600,
        system: 'Answer the question in 1-3 sentences using ONLY these engine results. '
          + 'Never invent numbers. If refusals occurred, state that some records were '
          + 'withheld under the "' + purpose + '" purpose and why.',
        messages: [{ role: 'user', content: 'Q: ' + question + '\nRESULTS: ' + JSON.stringify(facts) }] })
    });
    if (!res.ok) throw new Error('narrate failed: ' + res.status);
    var data = await res.json();
    var block = (data.content || []).find(function (b) { return b.type === 'text'; });
    return block ? block.text : '';
  }
```

- [ ] **Step 2: Finalize the click handler** (replace the Task 11 temporary one)

```javascript
  $('ask').addEventListener('click', async function () {
    var purpose = $('purpose').value, key = $('key').value.trim(), question = $('q').value.trim();
    if (!key) { $('status').textContent = 'enter an API key'; return; }
    if (!question) { $('status').textContent = 'type a question'; return; }
    $('status').textContent = 'translating…';
    try {
      var spec = validateSpec(await translate(question, db, purpose, key), db);
      var result = window.FFEngine.runSpec(spec, db, purpose);
      $('status').textContent = 'answering…';
      var narrative = await narrate(question, spec, result, purpose, key);
      renderResult(spec, result, narrative);
      $('status').textContent = '';
    } catch (e) { $('status').textContent = String(e.message); }
  });
```

- [ ] **Step 3: End-to-end verification (the acceptance test)**

Run: `open data/sample/restaurant-chain/index.html`
Confirm, with a real key:
1. **Grounding:** "how many people work in the Kitchen?" → prose number equals the `node --test` count (no invented figures).
2. **Governance fires:** "what's the average server pay?" under **payroll** → answer states some records withheld; trace shows `no-grant`. Under **scheduling** → answer states pay is out of scope for scheduling; trace all `out-of-purpose`.
3. **Citations + spec** panels render for every answer.

- [ ] **Step 4: Commit**

```bash
git add data/sample/restaurant-chain/app.js
git commit -m "UI: LLM narrator + end-to-end question flow"
```

---

## Task 13: Document + final verification

**Files:**
- Modify: `data/sample/restaurant-chain/CLAUDE.md`

- [ ] **Step 1: Add an "HCM system of understanding" section to `CLAUDE.md`** documenting: the app files (`index.html`, `app.js`, `ff-engine.js`), that the fixture (`forkandflame.graph.*`) and the consent grants are generated by `_generate.py` (edit the generator, not the output), the wipe whitelist, the test command (`node --test data/sample/restaurant-chain/*.test.js`), and the governance model (purpose→scope, default-deny). Keep it consistent with the existing CLAUDE.md tone.

```markdown
## HCM system of understanding (the query app)

`index.html` + `app.js` + `ff-engine.js` turn this vault into a governance-enforced
query layer. Open `index.html` directly (it runs off `file://`; BYO Anthropic key,
kept in-browser). Plain-language question → `ff-engine` traversal spec (via Claude
tool use) → deterministic engine that **enforces consent in code** → narrated answer
with the query, a governance trace, and citations.

- `ff-engine.js` — pure, dual-mode (Node + browser) engine. **Governance lives here,
  not in the LLM.** Tested: `node --test data/sample/restaurant-chain/*.test.js`.
- `forkandflame.graph.json` / `.graph.js` — the served fixture. **Generated** by
  `_generate.py` (`emit_fixture()`); never hand-edit.
- Consent grants (`Governance/*consent*`) are also generated — comprehensive and
  purpose-aligned, with a deliberate minority declined/expired/revoked so refusals
  fire. Change the generator, not the notes.
- The wipe step whitelists `index.html`, `app.js`, `ff-engine.js`, `ff-engine.test.js`,
  `CLAUDE.md`; everything else (notes, fixture) is rebuilt each run.

Governance: purposes `scheduling|payroll|compliance|employment` map 1:1 to scopes
`hr.scheduling|hr.payroll|hr.certifications|hr.employment`. Default-deny: a gated
field/edge is readable only under its matching purpose AND with an active, unexpired
grant; refusal reasons are `out-of-purpose|no-grant|revoked|expired`.
```

- [ ] **Step 2: Full regen + test cycle (prove nothing drifted)**

Run:
```bash
python3 data/sample/restaurant-chain/_generate.py >/dev/null && \
node --test data/sample/restaurant-chain/*.test.js
```
Expected: generator succeeds, the app files survive (whitelist), and ALL tests pass against the freshly regenerated fixture.

- [ ] **Step 3: Commit**

```bash
git add data/sample/restaurant-chain/CLAUDE.md
git commit -m "Docs: document the HCM system-of-understanding app in vault CLAUDE.md"
```

- [ ] **Step 4: Finish the branch** — use the `superpowers:finishing-a-development-branch` skill to choose merge/PR/cleanup.

---

## Self-review notes (verification of this plan against the spec)

- **Spec coverage:** generator changes (Tasks 1–3) ✓; fixture emission (Task 3) ✓; engine with constrained spec — from/filters/traverse/aggregate (Tasks 5–7) ✓; deterministic governance default-deny + 4 reasons (Task 8) ✓; starter questions validated (Task 9) ✓; standalone file:// page + BYO key + purpose selector (Task 10) ✓; NL→spec via LLM (Task 11) ✓; narrator + trace + citations (Tasks 10,12) ✓; verification incl. "watch it fail" (Tasks 10,12) ✓; CLAUDE.md (Task 13) ✓.
- **Spec deviations (intentional):** (1) fixture is `.json` + a `.js` wrapper — needed because a `file://` page can't `fetch` JSON. (2) Engine file is `ff-engine.js`, browser glue is `app.js` (spec said engine = app.js) — split for one-job-per-file and testability. (3) Added a 4th refusal reason `out-of-purpose` — the spec's "scope must equal S" already implies it; surfacing it makes purpose-limitation visible.
- **Type consistency:** `buildDb`→`db` shape (`nodesByType`, `nodesByTitle`, `fwd`, `rev`, `grants`, `meta`) used identically across Tasks 4–8; `runSpec(spec, db, purpose)` and result `{rows, trace, citations}` consistent; `canRead`/`canReadTarget`/`canReadEdge`/`checkGrant`/`gate` names consistent between engine and tests.
- **Open item carried from spec:** if Store 11 has no Bartender in the seeded data, Task 9 Step 2 says how to repoint the starter to a store that does.
