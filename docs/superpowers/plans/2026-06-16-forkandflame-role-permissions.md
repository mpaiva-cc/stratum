# Fork & Flame — Role-Based Permission Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministically-enforced viewer-**role** access axis (CHRO/HRBP/manager/IC/peer) beside the existing consent/purpose gate, AND-combined, with a "Viewing as" selector and a permission panel.

**Architecture:** A new `ff-roles.js` defines 5 personas (population rule + allowed scopes). `ff-engine.js` gains role-gating — row-level (population, computed from real edges) and field-level (allowed scopes) — applied at every site the consent-gate already covers, with a layered refusal trace (`consent` vs `access`). `runSpec` gains an optional `role` arg (omitted → no role-gate, preserving the existing 28 tests).

**Tech Stack:** pure JS (dual-mode UMD), `node --test`, plain HTML/JS UI, Python generator (whitelist only).

**Spec:** `docs/superpowers/specs/2026-06-16-forkandflame-role-permissions-design.md`

**Working directory for all paths:** repo root `/Users/mp/git-repos/poc-autonomous-hcm`. App lives in `data/sample/restaurant-chain/`.

---

## Conventions / current state

- `ff-engine.js` (dual-mode IIFE, `window.FFEngine` / `module.exports`) currently exports: `buildDb, runSpec, matchFilter, neighbors, aggregate, canRead, canReadTarget, canReadEdge, checkGrant, nodeReadable`. `runSpec(spec, db, purpose)`. Result shape `{rows, trace, citations}`. Trace entries today: `{person, field, scope, reason}`.
- Key internals: `gate(personTitle, requiredScope, db, purpose)` → `{ok}` or `{ok:false, reason}`; `refuse(trace, person, field, scope, reason)` pushes a trace entry; `project`, `neighbors`, `aggregate`, `nodeReadable` take `(…, db, purpose, trace)`.
- `db` shape: `{graph, meta, grants, nodesByTitle, nodesByType, fwd, rev}`. `db.meta.gatedProps`={pay_rate,pay_unit→hr.payroll}; `db.meta.gatedTargets`={time_off_request→hr.scheduling, certification/training_record→hr.certifications, performance_review/employment_event→hr.employment}; `db.meta.gatedEdges`={distributes_to→hr.payroll}.
- Tests: `node --test data/sample/restaurant-chain/*.test.js` → 28 pass today.
- Verified fixture facts: `EMP-0001 Mateo Thomas` (GM) reports-subtree = 25 incl. self; `EMP-0002 Samir Abara` in `Store 01 - Austin Domain`; `Store 01 - Austin Domain` headcount 25; `West Region` = 125 people (person→works_at→store.props.region).
- **Backward-compat rule:** when `role` is `null`/`undefined`, every role check is a no-op. Existing trace assertions check `t.reason` (not full-object equality), so adding a `layer` field to trace entries does not break them — confirm this while implementing.

---

## Task 1: Role personas (`ff-roles.js`) + whitelist

**Files:**
- Create: `data/sample/restaurant-chain/ff-roles.js`
- Create: `data/sample/restaurant-chain/ff-roles.test.js`
- Modify: `data/sample/restaurant-chain/_generate.py` (KEEP whitelist)

- [ ] **Step 1: Write the failing test** `data/sample/restaurant-chain/ff-roles.test.js`:

```javascript
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const FR = require('./ff-roles.js');
const FF = require('./ff-engine.js');
const db = FF.buildDb(JSON.parse(
  fs.readFileSync(path.join(__dirname, 'forkandflame.graph.json'), 'utf8')));

const SCOPES = ['hr.scheduling', 'hr.payroll', 'hr.certifications', 'hr.employment'];

test('all five personas exist with valid shape', () => {
  ['chro', 'hrbp', 'manager', 'ic', 'peer'].forEach(id => {
    const r = FR.ROLES[id];
    assert.ok(r, 'role ' + id);
    assert.strictEqual(r.id, id);
    assert.ok(typeof r.label === 'string' && r.label.length);
    assert.ok(['all', 'region', 'subtree', 'self', 'store'].includes(r.population.type));
    r.scopes.forEach(s => assert.ok(SCOPES.includes(s), id + ' scope ' + s));
  });
});

test('persona scope authority matches the design matrix', () => {
  assert.deepStrictEqual(FR.ROLES.chro.scopes.sort(), SCOPES.slice().sort());
  assert.deepStrictEqual(FR.ROLES.hrbp.scopes.sort(), SCOPES.slice().sort());
  assert.ok(!FR.ROLES.manager.scopes.includes('hr.payroll'), 'manager has no payroll');
  assert.ok(FR.ROLES.manager.scopes.includes('hr.employment'));
  assert.deepStrictEqual(FR.ROLES.ic.scopes.sort(), SCOPES.slice().sort());
  assert.deepStrictEqual(FR.ROLES.peer.scopes, []);
});

test('non-null anchors and population values exist in the fixture', () => {
  Object.values(FR.ROLES).forEach(r => {
    if (r.anchor) assert.ok(db.nodesByTitle[r.anchor], r.id + ' anchor exists: ' + r.anchor);
    if (r.population.type === 'self' || r.population.type === 'subtree')
      assert.ok(db.nodesByTitle[r.population.value], r.id + ' pop person exists');
    if (r.population.type === 'store')
      assert.ok(db.nodesByTitle[r.population.value], r.id + ' pop store exists');
    if (r.population.type === 'region')
      assert.ok(db.nodesByType.store.some(s => s.props.region === r.population.value),
        r.id + ' region exists');
  });
});
```

- [ ] **Step 2: Run, confirm FAIL** — `node --test data/sample/restaurant-chain/ff-roles.test.js` → `Cannot find module './ff-roles.js'`.

- [ ] **Step 3: Create `data/sample/restaurant-chain/ff-roles.js`:**

```javascript
// ff-roles.js — viewer-role personas for the permission layer. Pure data + dual-mode.
// Each role: { id, label, anchor, anchorDesc, population, scopes }.
//   population.type: 'all' | 'region' | 'subtree' | 'self' | 'store'  (+ value)
//   scopes: subset of the four consent scopes the role's AUTHORITY permits
//           (directory is always allowed for a visible person).
(function (global) {
  'use strict';
  var ALL = ['hr.scheduling', 'hr.payroll', 'hr.certifications', 'hr.employment'];
  var ROLES = {
    chro: { id: 'chro', label: 'CHRO', anchor: null, anchorDesc: 'corporate',
            population: { type: 'all' }, scopes: ALL.slice() },
    hrbp: { id: 'hrbp', label: 'HRBP', anchor: null, anchorDesc: 'West Region',
            population: { type: 'region', value: 'West Region' }, scopes: ALL.slice() },
    manager: { id: 'manager', label: 'Manager', anchor: 'EMP-0001 Mateo Thomas',
            anchorDesc: 'GM, Store 01',
            population: { type: 'subtree', value: 'EMP-0001 Mateo Thomas' },
            scopes: ['hr.scheduling', 'hr.certifications', 'hr.employment'] },
    ic: { id: 'ic', label: 'IC', anchor: 'EMP-0002 Samir Abara', anchorDesc: 'Store 01',
            population: { type: 'self', value: 'EMP-0002 Samir Abara' }, scopes: ALL.slice() },
    peer: { id: 'peer', label: 'Peer', anchor: 'EMP-0002 Samir Abara', anchorDesc: 'Store 01',
            population: { type: 'store', value: 'Store 01 - Austin Domain' }, scopes: [] },
  };
  var api = { ROLES: ROLES, ALL_SCOPES: ALL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.FFRoles = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run, confirm all 3 tests PASS.**

- [ ] **Step 5: Add the two new files to the generator's wipe whitelist.** In `data/sample/restaurant-chain/_generate.py`, find the `KEEP = {` set and add `"ff-roles.js"` and `"ff-roles.test.js"`. The set should become:

```python
    KEEP = {os.path.basename(__file__), "index.html", "app.js", "ff-engine.js",
            "ff-engine.test.js", "ff-starters.test.js", "ff-roles.js",
            "ff-roles.test.js", "CLAUDE.md"}
```

- [ ] **Step 6: Verify regen preserves them:** `python3 data/sample/restaurant-chain/_generate.py >/dev/null && ls data/sample/restaurant-chain/ff-roles.js data/sample/restaurant-chain/ff-roles.test.js` → both listed.

- [ ] **Step 7: Commit:**

```bash
git add data/sample/restaurant-chain/ff-roles.js data/sample/restaurant-chain/ff-roles.test.js data/sample/restaurant-chain/_generate.py
git commit -m "Roles: 5 viewer personas (ff-roles.js) + wipe whitelist"
```

---

## Task 2: Engine role helpers + layered `refuse`

Add population/role helpers and a combined field predicate, and extend `refuse` with a `layer`. No wiring yet — behavior unchanged when role is absent.

**Files:**
- Modify: `data/sample/restaurant-chain/ff-engine.js`
- Modify: `data/sample/restaurant-chain/ff-engine.test.js`

- [ ] **Step 1: Add failing tests** (append to `ff-engine.test.js`). The fixture is already loaded as `db` at the top of that file; reuse it.

```javascript
test('computePopulation: all -> {all:true}; self -> single; store/subtree/region sized', () => {
  assert.strictEqual(FF.computePopulation({ population: { type: 'all' } }, db).all, true);
  assert.strictEqual(FF.computePopulation(null, db).all, true);
  const self = FF.computePopulation({ population: { type: 'self', value: 'EMP-0002 Samir Abara' } }, db);
  assert.deepStrictEqual([...self.set], ['EMP-0002 Samir Abara']);
  const store = FF.computePopulation({ population: { type: 'store', value: 'Store 01 - Austin Domain' } }, db);
  assert.strictEqual(store.set.size, 25);
  const sub = FF.computePopulation({ population: { type: 'subtree', value: 'EMP-0001 Mateo Thomas' } }, db);
  assert.ok(sub.set.has('EMP-0001 Mateo Thomas') && sub.set.size >= 2 && sub.set.size <= 30);
  const region = FF.computePopulation({ population: { type: 'region', value: 'West Region' } }, db);
  assert.strictEqual(region.set.size, 125);
});

test('roleAllowsScope: null role allows all; empty scopes allows none', () => {
  assert.strictEqual(FF.roleAllowsScope(null, 'hr.payroll'), true);
  assert.strictEqual(FF.roleAllowsScope({ scopes: [] }, 'hr.payroll'), false);
  assert.strictEqual(FF.roleAllowsScope({ scopes: ['hr.payroll'] }, 'hr.payroll'), true);
  assert.strictEqual(FF.roleAllowsScope({ scopes: ['hr.scheduling'] }, 'hr.payroll'), false);
});
```

- [ ] **Step 2: Run, confirm FAIL** (`FF.computePopulation is not a function`).

- [ ] **Step 3: In `ff-engine.js`, change `refuse` to accept a `layer`** (default `'consent'` so existing call sites need no change yet):

```javascript
  function refuse(trace, person, field, scope, reason, layer) {
    if (trace) trace.push({ person: person, field: field, scope: scope,
                            reason: reason, layer: layer || 'consent' });
  }
```

- [ ] **Step 4: Add the role helpers** (place after `canReadEdge`, before `nodeReadable`):

```javascript
  function computePopulation(role, db) {
    if (!role || !role.population || role.population.type === 'all') return { all: true };
    var t = role.population.type, v = role.population.value, set = new Set();
    if (t === 'self') { set.add(v); }
    else if (t === 'store') { ((db.rev['works_at'] || {})[v] || []).forEach(function (p) { set.add(p); }); }
    else if (t === 'region') {
      db.nodesByType.person.forEach(function (pn) {
        var st = db.nodesByTitle[pn.props.works_at];
        if (st && st.props.region === v) set.add(pn.title);
      });
    } else if (t === 'subtree') {
      var stack = [v]; set.add(v);
      while (stack.length) {
        var cur = stack.pop();
        ((db.rev['reports_to'] || {})[cur] || []).forEach(function (k) {
          if (!set.has(k)) { set.add(k); stack.push(k); }
        });
      }
    }
    return { set: set };
  }

  function inPopulation(pop, title) { return pop.all || (pop.set && pop.set.has(title)); }

  function roleAllowsScope(role, scope) {
    return !role || (role.scopes && role.scopes.indexOf(scope) !== -1);
  }

  // Combined field predicate: role authority first (access layer), then consent.
  function readField(subjectTitle, scope, db, purpose, role) {
    if (!roleAllowsScope(role, scope)) return { ok: false, layer: 'access', reason: 'role-restricted' };
    var v = gate(subjectTitle, scope, db, purpose);
    if (!v.ok) return { ok: false, layer: 'consent', reason: v.reason };
    return { ok: true };
  }
```

- [ ] **Step 5: Export the helpers.** Update the `var api = {…}` object to also include `computePopulation`, `inPopulation`, `roleAllowsScope`, `readField`.

- [ ] **Step 6: Run the FULL suite** — `node --test data/sample/restaurant-chain/*.test.js`. Expected: prior 28 + 2 new = 30 pass (no wiring yet, so prior behavior unchanged).

- [ ] **Step 7: Commit:**

```bash
git add data/sample/restaurant-chain/ff-engine.js data/sample/restaurant-chain/ff-engine.test.js
git commit -m "Engine: role/population helpers + layered refuse (no wiring yet)"
```

---

## Task 3: Wire the role-gate into `runSpec`

Thread `role` + computed `pop` through every gated site: population row-drop on person anchors, person traversal targets, and gated-record subjects; class redaction via `readField` in project/aggregate/filters/neighbors. AND-combined with consent; access layer takes precedence in the reason reported.

**Files:**
- Modify: `data/sample/restaurant-chain/ff-engine.js`
- Modify: `data/sample/restaurant-chain/ff-engine.test.js`

- [ ] **Step 1: Add failing tests** (append to `ff-engine.test.js`). Add a roles require at the top of the file if not present: `const FR = require('./ff-roles.js');` — place it next to the other requires.

```javascript
test('ROLE population: manager sees only their subtree as person anchors', () => {
  const sub = FF.computePopulation(FR.ROLES.manager, db);
  const r = FF.runSpec({ from: 'person', select: ['title'] }, db, 'employment', FR.ROLES.manager);
  assert.strictEqual(r.rows.length, sub.set.size, 'rows == subtree size');
  assert.ok(r.trace.some(t => t.layer === 'access' && t.reason === 'out-of-population'));
});

test('ROLE class: manager cannot read pay even under payroll + consent (role-restricted)', () => {
  const r = FF.runSpec({ from: 'person', select: ['title', 'pay_rate'] }, db, 'payroll', FR.ROLES.manager);
  assert.ok(r.rows.length > 0 && r.rows.every(x => x.pay_rate === null), 'all pay redacted');
  assert.ok(r.trace.some(t => t.layer === 'access' && t.reason === 'role-restricted' && t.field === 'pay_rate'));
});

test('ROLE peer: directory visible for store coworkers, all sensitive role-restricted', () => {
  const dir = FF.runSpec({ from: 'person', select: ['title', 'position'] }, db, 'scheduling', FR.ROLES.peer);
  assert.strictEqual(dir.rows.length, 25, 'store coworkers visible');
  assert.ok(dir.rows.every(x => x.position), 'directory field shown');
  const pay = FF.runSpec({ from: 'person', select: ['title', 'pay_rate'] }, db, 'payroll', FR.ROLES.peer);
  assert.ok(pay.rows.every(x => x.pay_rate === null) && pay.trace.some(t => t.reason === 'role-restricted'));
});

test('ROLE ic: sees only self', () => {
  const r = FF.runSpec({ from: 'person', select: ['title'] }, db, 'employment', FR.ROLES.ic);
  assert.deepStrictEqual(r.rows.map(x => x.title), ['EMP-0002 Samir Abara']);
});

test('AND with consent: CHRO (all authority) still blocked by consent purpose mismatch', () => {
  const r = FF.runSpec({ from: 'person', select: ['title', 'pay_rate'] }, db, 'scheduling', FR.ROLES.chro);
  assert.ok(r.rows.every(x => x.pay_rate === null), 'pay redacted under scheduling');
  assert.ok(r.trace.some(t => t.layer === 'consent' && t.reason === 'out-of-purpose'));
});

test('backward-compat: omitting role reproduces prior behavior', () => {
  const r = FF.runSpec({ from: 'person', select: ['title', 'pay_rate'] }, db, 'payroll');
  assert.ok(r.rows.length >= 400, 'all people visible without a role');
  assert.ok(r.trace.every(t => t.layer === 'consent'), 'no access-layer refusals without a role');
});
```

- [ ] **Step 2: Run, confirm the new role tests FAIL** (role not yet wired — e.g. manager rows == all people, pay not role-restricted).

- [ ] **Step 3: Replace `nodeReadable`** to take `role, pop` and check population (subject) + role+consent:

```javascript
  function nodeReadable(node, db, purpose, trace, role, pop) {
    var scope = db.meta.gatedTargets[node.type];
    if (!scope) return true;                 // not a gated-record type
    var subject = node.props.person;
    if (pop && !pop.all && !inPopulation(pop, subject)) {
      refuse(trace, subject || node.title, node.type, null, 'out-of-population', 'access');
      return false;
    }
    var r = readField(subject, scope, db, purpose, role);
    if (!r.ok) { refuse(trace, subject || node.title, node.type, scope, r.reason, r.layer); return false; }
    return true;
  }
```

- [ ] **Step 4: Replace `project`** to take `role` and gate via `readField`:

```javascript
  function project(node, select, db, purpose, trace, role) {
    var row = {}, fields = select || ['title'];
    fields.forEach(function (field) {
      if (field === 'title') { row.title = node.title; return; }
      var scope = node.type === 'person' ? db.meta.gatedProps[field] : null;
      if (!scope) { row[field] = node.props[field]; return; }   // directory / ungated
      var r = readField(node.title, scope, db, purpose, role);
      if (r.ok) { row[field] = node.props[field]; }
      else { row[field] = null; refuse(trace, node.title, field, scope, r.reason, r.layer); }
    });
    if (fields.indexOf('title') === -1) row.title = node.title;
    return row;
  }
```

- [ ] **Step 5: Replace `neighbors`** to take `role, pop` — gate target type + hop filters via `readField`, drop out-of-population person neighbors, gate the distributes_to edge via `readField`:

```javascript
  function neighbors(db, title, hop, purpose, trace, role, pop) {
    var src = db.nodesByTitle[title];
    var tscope = db.meta.gatedTargets[hop.to];
    if (src && src.type === 'person' && tscope) {
      var tr = readField(title, tscope, db, purpose, role);
      if (!tr.ok) { refuse(trace, title, hop.to, tscope, tr.reason, tr.layer); return []; }
    }
    var map = hop.direction === 'in' ? db.rev[hop.on] : db.fwd[hop.on];
    var titles = (map && map[title]) || [];
    var result = titles.map(function (t) { return db.nodesByTitle[t]; }).filter(Boolean)
      .filter(function (n) { return !hop.to || n.type === hop.to; })
      .filter(function (n) {
        return (hop.filters || []).every(function (f) {
          var s = db.meta.gatedProps[f.field];
          if (s && n.type === 'person') {
            var rf = readField(n.title, s, db, purpose, role);
            if (!rf.ok) { refuse(trace, n.title, f.field, s, rf.reason, rf.layer); return false; }
          }
          return matchFilter(n, f);
        });
      });
    if (pop && !pop.all) {
      result = result.filter(function (n) {
        if (n.type !== 'person') return true;
        if (inPopulation(pop, n.title)) return true;
        refuse(trace, n.title, '(record)', null, 'out-of-population', 'access');
        return false;
      });
    }
    var eScope = db.meta.gatedEdges[hop.on];
    if (eScope) {
      result = result.filter(function (n) {
        if (n.type !== 'person') return true;
        var er = readField(n.title, eScope, db, purpose, role);
        if (!er.ok) { refuse(trace, n.title, hop.on, eScope, er.reason, er.layer); return false; }
        return true;
      });
    }
    return result;
  }
```

- [ ] **Step 6: Replace `aggregate`** to take `role` and gate groupBy + field via `readField`:

```javascript
  function aggregate(nodes, spec, db, purpose, trace, role) {
    var groups = {};
    nodes.forEach(function (n) {
      var key;
      if (spec.groupBy) {
        var gscope = db.meta.gatedProps[spec.groupBy];
        if (gscope && n.type === 'person') {
          var gr = readField(n.title, spec.groupBy === spec.groupBy ? gscope : gscope, db, purpose, role);
          if (!gr.ok) { refuse(trace, n.title, spec.groupBy, gscope, gr.reason, gr.layer); key = '(redacted)'; }
          else key = n.props[spec.groupBy];
        } else { key = n.props[spec.groupBy]; }
      } else { key = '__all__'; }
      (groups[key] = groups[key] || []).push(n);
    });
    return Object.keys(groups).map(function (key) {
      var members = groups[key], vals = [];
      if (spec.field) {
        members.forEach(function (n) {
          var scope = db.meta.gatedProps[spec.field];
          if (scope && n.type === 'person') {
            var r = readField(n.title, spec.field, db, purpose, role);
            if (!r.ok) { refuse(trace, n.title, spec.field, scope, r.reason, r.layer); return; }
          }
          var x = Number(n.props[spec.field]);
          if (!isNaN(x)) vals.push(x);
        });
      }
      var value;
      switch (spec.op) {
        case 'count': value = members.length; break;
        case 'sum': value = vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) : null; break;
        case 'avg': value = vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : null; break;
        case 'min': value = vals.length ? Math.min.apply(null, vals) : null; break;
        case 'max': value = vals.length ? Math.max.apply(null, vals) : null; break;
        default: value = null;
      }
      var row = { value: value, n: members.length, included: vals.length };
      if (spec.groupBy) row.group = key;
      return row;
    });
  }
```

(Note: the `spec.groupBy === spec.groupBy ? gscope : gscope` is intentionally just `gscope`; write it as `var gr = readField(n.title, spec.groupBy, db, purpose, role);` — pass the groupBy field through `readField` which looks up its own scope via gatedProps. CORRECTION: `readField` takes a *scope*, not a field. Use: `var gr = readField(n.title, gscope, db, purpose, role);`.)

- [ ] **Step 7: Replace `runSpec`** to compute `pop`, thread `role`/`pop`, and add the person-anchor population filter:

```javascript
  function runSpec(spec, db, purpose, role) {
    var trace = [], citations = {};
    var pop = computePopulation(role, db);
    var nodes = (db.nodesByType[spec.from] || []).slice();
    (spec.filters || []).forEach(function (f) {
      var scope = db.meta.gatedProps[f.field];
      nodes = nodes.filter(function (n) {
        if (scope && n.type === 'person') {
          var r = readField(n.title, scope, db, purpose, role);
          if (!r.ok) { refuse(trace, n.title, f.field, scope, r.reason, r.layer); return false; }
        }
        return matchFilter(n, f);
      });
    });
    nodes = nodes.filter(function (n) { return nodeReadable(n, db, purpose, trace, role, pop); });
    if (!pop.all) {
      nodes = nodes.filter(function (n) {
        if (n.type !== 'person') return true;
        if (inPopulation(pop, n.title)) return true;
        refuse(trace, n.title, '(record)', null, 'out-of-population', 'access');
        return false;
      });
    }
    var hops = spec.traverse || [];
    var enriched = nodes.map(function (n) {
      var ctx = { node: n, hops: {} };
      hops.forEach(function (hop) {
        ctx.hops[hop.as || hop.to] = neighbors(db, n.title, hop, purpose, trace, role, pop)
          .map(function (m) { citations[m.title] = m.type; return m.title; });
      });
      return ctx;
    });
    (spec.require || []).forEach(function (asName) {
      enriched = enriched.filter(function (c) { return (c.hops[asName] || []).length > 0; });
    });
    enriched.forEach(function (c) { citations[c.node.title] = c.node.type; });
    var citeArr = function () {
      return Object.keys(citations).map(function (t) { return { title: t, type: citations[t] }; });
    };
    if (spec.aggregate) {
      var agg = aggregate(enriched.map(function (c) { return c.node; }), spec.aggregate, db, purpose, trace, role);
      return { rows: agg, trace: trace, citations: citeArr() };
    }
    var rows = enriched.map(function (c) {
      var row = project(c.node, spec.select, db, purpose, trace, role);
      Object.keys(c.hops).forEach(function (k) { row[k] = c.hops[k]; });
      return row;
    });
    return { rows: rows, trace: trace, citations: citeArr() };
  }
```

- [ ] **Step 8: Run the FULL suite** — `node --test data/sample/restaurant-chain/*.test.js`. Expected: all pass (30 prior + 6 new = 36). If any prior test regressed, fix wiring without weakening either gate.

- [ ] **Step 9: Commit:**

```bash
git add data/sample/restaurant-chain/ff-engine.js data/sample/restaurant-chain/ff-engine.test.js
git commit -m "Engine: wire role-gate (population row-drop + class redaction), AND-combined with consent, layered trace"
```

---

## Task 4: UI — role selector, permission panel, layered trace

**Files:**
- Modify: `data/sample/restaurant-chain/index.html`
- Modify: `data/sample/restaurant-chain/app.js`

- [ ] **Step 1: Add the role selector + panel + roles script to `index.html`.** In the controls `.panel`, after the purpose `<label>…</label>` block, add:

```html
    <label>Viewing as
      <select id="role">
        <option value="chro">CHRO</option>
        <option value="hrbp">HRBP</option>
        <option value="manager">Manager</option>
        <option value="ic">IC</option>
        <option value="peer">Peer</option>
      </select>
    </label>
    <div class="panel" id="permpanel" style="margin-top:.75rem"></div>
```

And add the roles script BEFORE `app.js` (after `ff-engine.js`):

```html
  <script src="ff-roles.js"></script>
```

- [ ] **Step 2: In `app.js`, add the permission-panel renderer and role plumbing.** Add near the top (after `db` is built):

```javascript
  var ROLES = window.FFRoles.ROLES;
  var SCOPE_LABEL = { 'hr.scheduling': 'scheduling', 'hr.payroll': 'compensation',
    'hr.certifications': 'compliance', 'hr.employment': 'employment' };
  var ALL_SCOPES = window.FFRoles.ALL_SCOPES;

  function currentRole() { return ROLES[$('role').value]; }

  function renderPermPanel() {
    var role = currentRole();
    var pop = window.FFEngine.computePopulation(role, db);
    var total = db.nodesByType.person.length;
    var seen = pop.all ? total : pop.set.size;
    var classes = ['directory'].concat(role.scopes.map(function (s) { return SCOPE_LABEL[s]; }));
    var hiddenClasses = ALL_SCOPES.filter(function (s) { return role.scopes.indexOf(s) === -1; })
      .map(function (s) { return SCOPE_LABEL[s]; });
    var who = pop.all ? 'everyone (' + total + ' people)'
      : (role.population.type === 'self' ? 'just yourself (1)'
         : 'your population (' + seen + ' of ' + total + ')');
    var anchor = role.anchor ? (' — ' + role.anchor + ' (' + role.anchorDesc + ')') : ' — ' + role.anchorDesc;
    var html = '<strong>Viewing as ' + esc(role.label) + '</strong>' + esc(anchor) +
      '<br><strong>Sees:</strong> ' + classes.map(esc).join(' · ') + ', for <strong>' + esc(who) + '</strong>';
    if (hiddenClasses.length || !pop.all) {
      html += '<br><span class="redacted"><strong>Hidden:</strong> ' +
        (hiddenClasses.map(esc).join(' · ') || 'no extra classes') +
        (pop.all ? '' : ' · everyone outside your population (' + (total - seen) + ')') + '</span>';
    }
    $('permpanel').innerHTML = html;
  }
```

- [ ] **Step 3: Render the layered trace.** REPLACE the trace block inside `renderResult` (the `if (result.trace.length)` section) with a layer-grouped version:

```javascript
    if (result.trace.length) {
      var groups = { access: {}, consent: {} };
      result.trace.forEach(function (t) {
        var layer = t.layer || 'consent';
        var key = t.reason + (t.field && t.field !== '(record)' && t.scope ? ' (' + t.field + ')' : '');
        groups[layer][key] = (groups[layer][key] || 0) + 1;
      });
      html += '<div class="panel trace"><strong>Governance trace</strong>';
      ['access', 'consent'].forEach(function (layer) {
        var keys = Object.keys(groups[layer]);
        if (!keys.length) return;
        html += '<div><em>' + layer + '</em><ul>' + keys.map(function (k) {
          return '<li><span class="badge">' + esc(k) + '</span> ' + groups[layer][k] + ' refusal(s)</li>';
        }).join('') + '</ul></div>';
      });
      html += '</div>';
    }
```

- [ ] **Step 4: Pass the role into both query calls.** In the click handler, change the two engine/translate call sites to use the role:
  - `var result = window.FFEngine.runSpec(spec, db, purpose, currentRole());` (both the translate-path and, if present, any direct run).
  Then wire the panel: add at the END of the IIFE (before `window.FFApp = …`):

```javascript
  $('role').addEventListener('change', renderPermPanel);
  renderPermPanel();
```

  And add `currentRole` and `renderPermPanel` to the `window.FFApp` export object.

- [ ] **Step 5: Parse-check app.js:** `node -e "new Function(require('fs').readFileSync('data/sample/restaurant-chain/app.js','utf8'))"` exits 0.

- [ ] **Step 6: Manual/automated browser verification** (no API key needed — uses engine + panel only). Open the page and drive it via DevTools/console-equivalent, or run this assertion in the browser console after loading `file:///…/index.html`:

```javascript
// expected: manager panel says ~25; selecting peer shows directory-only; engine row counts match
FFApp.renderPermPanel; // exists
document.getElementById('role').value='manager'; document.getElementById('role').dispatchEvent(new Event('change'));
console.log(document.getElementById('permpanel').innerText);  // mentions Manager, compensation hidden
const r = FFEngine.runSpec({from:'person',select:['title','pay_rate']}, FFApp.db, 'payroll', FFApp.currentRole());
console.log('manager rows', r.rows.length, 'all pay redacted', r.rows.every(x=>x.pay_rate===null));
```
Expected: panel names Manager + "Hidden: compensation"; `manager rows` ≈ 25, all pay redacted.

- [ ] **Step 7: Commit:**

```bash
git add data/sample/restaurant-chain/index.html data/sample/restaurant-chain/app.js
git commit -m "UI: Viewing-as role selector, permission panel, layer-grouped governance trace"
```

---

## Task 5: Docs + final verification

**Files:**
- Modify: `data/sample/restaurant-chain/CLAUDE.md`

- [ ] **Step 1: Append a roles subsection to the "HCM system of understanding" section in `data/sample/restaurant-chain/CLAUDE.md`:**

```markdown
### Role-based permission layer

A second access axis beside consent/purpose, enforced in the engine and AND-combined:
- `ff-roles.js` — five viewer personas (CHRO/HRBP/manager/IC/peer): each a population
  rule + allowed scopes. Anchors are concrete fixture people (configurable).
- `ff-engine.js` — `runSpec(spec, db, purpose, role)` (role optional → no role-gate).
  Role-gate is row-level (population, computed from `reports_to`/`works_at`/region
  edges) + field-level (allowed scopes). Refusal trace carries a `layer`:
  `access` (`out-of-population`, `role-restricted`) vs `consent`
  (`out-of-purpose|no-grant|revoked|expired`). When both block a field, access wins.
- UI: a "Viewing as" selector + a permission panel that shows, per role, who and what
  is visible (live population counts). Trace is grouped by layer.
```

- [ ] **Step 2: Final whole-loop verification** (regen preserves all source files, full suite green on regenerated fixture):

```bash
python3 data/sample/restaurant-chain/_generate.py >/dev/null && \
ls data/sample/restaurant-chain/ff-roles.js data/sample/restaurant-chain/ff-roles.test.js \
   data/sample/restaurant-chain/ff-engine.js data/sample/restaurant-chain/app.js \
   data/sample/restaurant-chain/index.html data/sample/restaurant-chain/CLAUDE.md && \
node --test data/sample/restaurant-chain/*.test.js 2>&1 | grep -E "tests [0-9]+|pass [0-9]+|fail [0-9]+"
```
Expected: all source files present; `tests 36 / pass 36 / fail 0` (3 in ff-roles.test.js + 33 in ff-engine.test.js + 4 in ff-starters.test.js — confirm fail 0; exact totals may shift if counts differ, the invariant is fail 0).

- [ ] **Step 3: Commit:**

```bash
git add data/sample/restaurant-chain/CLAUDE.md
git commit -m "Docs: document the role-based permission layer"
```

- [ ] **Step 4: Finish the branch** — use `superpowers:finishing-a-development-branch`.

---

## Self-review

- **Spec coverage:** two-axis AND model (Tasks 2–3) ✓; field classes = scopes+directory (readField + project) ✓; 5 personas with anchors (Task 1) ✓; computePopulation for all/region/subtree/self/store (Task 2) ✓; population row-drop + class redaction (Task 3) ✓; layered trace access/consent with access precedence (refuse layer + readField order) ✓; backward-compat role-optional (Task 3 test) ✓; UI selector + permission panel + layered trace (Task 4) ✓; tests incl. AND-with-consent and per-role (Tasks 2–4) ✓; docs (Task 5) ✓; whitelist for new files (Task 1) ✓.
- **Placeholder scan:** none. The one inline correction (aggregate groupBy `readField` call) is called out explicitly with the exact correct line.
- **Type consistency:** `refuse(trace, person, field, scope, reason, layer)` used consistently; `readField(subjectTitle, scope, db, purpose, role)` returns `{ok, layer, reason}` and is used identically at every site; `runSpec(spec, db, purpose, role)`; `computePopulation` returns `{all:true}` or `{set:Set}` and `inPopulation` handles both; role object shape `{id,label,anchor,anchorDesc,population:{type,value},scopes}` consistent between `ff-roles.js`, engine, and UI.
- **Carried risk:** anchors validated in Task 1 Step 4/6; region count 125 and store count 25 asserted in Task 2.
