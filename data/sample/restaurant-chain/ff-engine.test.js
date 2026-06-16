// ff-engine.test.js
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const FF = require('./ff-engine.js');
const FR = require('./ff-roles.js');

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
  const withTOR = FF.runSpec({
    from: 'person',
    traverse: [{ to: 'time_off_request', on: 'person', direction: 'in', as: 'timeoff' }],
    select: ['title'],
    require: ['timeoff']
  }, db, 'scheduling');
  assert.ok(withTOR.rows.length >= 1, 'someone has a time-off request');
});

test('aggregate count groupBy in_department matches per-dept node counts', () => {
  const res = FF.runSpec({
    from: 'person',
    aggregate: { op: 'count', groupBy: 'in_department' }
  }, db, 'scheduling');
  const expected = {};
  db.nodesByType.person.forEach(p => {
    const k = p.props.in_department; expected[k] = (expected[k] || 0) + 1;
  });
  res.rows.forEach(r => assert.strictEqual(r.value, expected[r.group], 'dept ' + r.group));
  assert.strictEqual(res.rows.length, Object.keys(expected).length);
});

test('aggregate count (no groupBy) returns total', () => {
  const res = FF.runSpec({ from: 'store', aggregate: { op: 'count' } }, db, 'scheduling');
  assert.strictEqual(res.rows[0].value, db.nodesByType.store.length);
});

test('canRead: out-of-purpose blocks pay_rate under scheduling', () => {
  const p = db.nodesByType.person.find(n => n.props.pay_rate);
  const v = FF.canRead(p.title, 'pay_rate', db, 'scheduling');
  assert.strictEqual(v.ok, false);
  assert.strictEqual(v.reason, 'out-of-purpose');
});

test('canRead: pay_rate allowed under payroll when grant active', () => {
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

test('canReadTarget: expired when hr.certifications grant past valid_to', () => {
  const expired = db.nodesByType.person.find(n =>
    (db.grants[n.title] || []).some(g => g.scope === 'hr.certifications'
      && g.valid_to !== 'open' && g.valid_to < db.meta.generated));
  assert.ok(expired, 'fixture has an expired-cert person');
  const v = FF.canReadTarget(expired.title, 'certification', db, 'compliance');
  assert.deepStrictEqual([v.ok, v.reason], [false, 'expired']);
});

test('canReadTarget: revoked when hr.scheduling grant status=revoked', () => {
  const revoked = db.nodesByType.person.find(n =>
    (db.grants[n.title] || []).some(g => g.scope === 'hr.scheduling' && g.status === 'revoked'));
  assert.ok(revoked, 'fixture has a revoked-scheduling person');
  const v = FF.canReadTarget(revoked.title, 'time_off_request', db, 'scheduling');
  assert.deepStrictEqual([v.ok, v.reason], [false, 'revoked']);
});

test('select of pay_rate under payroll redacts declined person and traces it', () => {
  const res = FF.runSpec({ from: 'person', select: ['title', 'pay_rate'] }, db, 'payroll');
  const redacted = res.rows.filter(r => r.pay_rate === null);
  assert.ok(redacted.length >= 1, 'some pay_rate redacted');
  assert.ok(res.trace.some(t => t.reason === 'no-grant' && t.field === 'pay_rate'));
});

test('aggregate avg pay_rate under scheduling is wholly out-of-purpose (no leak)', () => {
  const res = FF.runSpec({ from: 'person',
    aggregate: { op: 'avg', field: 'pay_rate', groupBy: 'in_department' } }, db, 'scheduling');
  res.rows.forEach(r => assert.strictEqual(r.value, null));
  assert.ok(res.trace.length > 0 && res.trace.every(t => t.reason === 'out-of-purpose'));
});

test('aggregate avg pay_rate under payroll excludes declined from the mean', () => {
  const res = FF.runSpec({ from: 'person',
    aggregate: { op: 'avg', field: 'pay_rate', groupBy: 'in_department' } }, db, 'payroll');
  assert.ok(res.rows.some(r => r.value !== null), 'most pay visible');
  assert.ok(res.trace.some(t => t.reason === 'no-grant'));
  assert.ok(res.rows.some(r => r.included < r.n), 'a declined person was excluded from some group mean');
});

test('LEAK A closed: filter on pay_rate under scheduling returns nothing (no oracle)', () => {
  const res = FF.runSpec({ from: 'person',
    filters: [{ field: 'pay_rate', op: 'gt', value: 1 }], select: ['title'] }, db, 'scheduling');
  assert.strictEqual(res.rows.length, 0, 'gated filter must exclude all under wrong purpose');
  assert.ok(res.trace.length > 0 && res.trace.every(t => t.reason === 'out-of-purpose'));
});

test('LEAK A closed: filter on pay_rate under payroll excludes declined persons', () => {
  const all = FF.runSpec({ from: 'person',
    filters: [{ field: 'pay_rate', op: 'gt', value: 1 }], select: ['title'] }, db, 'payroll');
  assert.ok(all.rows.length > 0, 'payroll filter returns consented people');
  assert.ok(all.trace.some(t => t.reason === 'no-grant'), 'declined persons excluded + traced');
});

test('LEAK B closed: groupBy pay_rate under scheduling never leaks real values as keys', () => {
  const res = FF.runSpec({ from: 'person',
    aggregate: { op: 'count', groupBy: 'pay_rate' } }, db, 'scheduling');
  assert.ok(res.rows.every(r => r.group === '(redacted)'),
    'all group keys redacted under wrong purpose');
  assert.ok(res.trace.length > 0 && res.trace.every(t => t.reason === 'out-of-purpose'));
});

test('LEAK C closed: distributes_to traversal under scheduling is gated', () => {
  const res = FF.runSpec({ from: 'tip_pool',
    traverse: [{ to: 'person', on: 'distributes_to', direction: 'out', as: 'recipients' }],
    select: ['title'] }, db, 'scheduling');
  const totalRecipients = res.rows.reduce((a, r) => a + (r.recipients ? r.recipients.length : 0), 0);
  assert.strictEqual(totalRecipients, 0, 'no recipients revealed under scheduling');
  assert.ok(res.trace.some(t => t.reason === 'out-of-purpose'));
});

test('C1: anchoring a gated-target type under wrong purpose is blocked', () => {
  const r = FF.runSpec({ from: 'employment_event', select: ['title', 'person', 'kind'] }, db, 'scheduling');
  assert.strictEqual(r.rows.length, 0, 'no employment_event rows under scheduling');
  assert.ok(r.trace.length > 0 && r.trace.every(t => t.reason === 'out-of-purpose'));
});

test('C1: anchoring a gated-target type under the MATCHING purpose works', () => {
  const r = FF.runSpec({ from: 'performance_review', select: ['title', 'person', 'rating'] }, db, 'employment');
  assert.ok(r.rows.length > 0, 'performance reviews readable under employment with grants');
});

test('C1: gated-target anchor aggregate does not leak distribution under wrong purpose', () => {
  const r = FF.runSpec({ from: 'performance_review', aggregate: { op: 'count', groupBy: 'rating' } }, db, 'scheduling');
  // all anchor nodes excluded -> the only group (if any) is empty; no real rating distribution
  const total = r.rows.reduce((a, x) => a + (x.value || 0), 0);
  assert.strictEqual(total, 0, 'no ratings counted under scheduling');
  assert.ok(r.trace.length > 0 && r.trace.every(t => t.reason === 'out-of-purpose'));
});

test('C2: hop.filters on a gated prop are gated (no traverse oracle)', () => {
  const r = FF.runSpec({ from: 'store',
    traverse: [{ to: 'person', on: 'works_at', direction: 'in', as: 'staff',
                 filters: [{ field: 'pay_rate', op: 'gt', value: 1 }] }],
    require: ['staff'], select: ['title'] }, db, 'scheduling');
  assert.strictEqual(r.rows.length, 0, 'no store yields pay-filtered staff under scheduling');
  assert.ok(r.trace.some(t => t.reason === 'out-of-purpose'));
});

test('computePopulation: all -> {all:true}; self -> single; store/subtree/region sized', () => {
  assert.strictEqual(FF.computePopulation({ population: { type: 'all' } }, db).all, true);
  assert.strictEqual(FF.computePopulation(null, db).all, true);
  const self = FF.computePopulation({ population: { type: 'self', value: 'EMP-0002' } }, db);
  assert.deepStrictEqual([...self.set], [db.idToTitle['EMP-0002']]);
  const store = FF.computePopulation({ population: { type: 'store', value: 'Store 01 - Austin Domain' } }, db);
  assert.strictEqual(store.set.size, 25);
  const sub = FF.computePopulation({ population: { type: 'subtree', value: 'EMP-0001' } }, db);
  assert.ok(sub.set.has(db.idToTitle['EMP-0001']) && sub.set.size >= 2 && sub.set.size <= 30);
  const region = FF.computePopulation({ population: { type: 'region', value: 'West Region' } }, db);
  assert.strictEqual(region.set.size, 125);
});

test('roleAllowsScope: null role allows all; empty scopes allows none', () => {
  assert.strictEqual(FF.roleAllowsScope(null, 'hr.payroll'), true);
  assert.strictEqual(FF.roleAllowsScope({ scopes: [] }, 'hr.payroll'), false);
  assert.strictEqual(FF.roleAllowsScope({ scopes: ['hr.payroll'] }, 'hr.payroll'), true);
  assert.strictEqual(FF.roleAllowsScope({ scopes: ['hr.scheduling'] }, 'hr.payroll'), false);
});

test('ROLE population: manager sees only their subtree as person anchors', () => {
  const sub = FF.computePopulation(FR.ROLES.manager, db);
  const r = FF.runSpec({ from: 'person', select: ['title'] }, db, 'employment', FR.ROLES.manager);
  assert.strictEqual(r.rows.length, sub.set.size, 'rows == subtree size');
  assert.ok(r.trace.some(t => t.layer === 'access' && t.reason === 'out-of-population'));
  assert.ok(r.rows.every(x => sub.set.has(x.title)), 'all returned rows are within the subtree');
});

test('ROLE class: manager cannot read pay even under payroll + consent (role-restricted)', () => {
  const r = FF.runSpec({ from: 'person', select: ['title', 'pay_rate'] }, db, 'payroll', FR.ROLES.manager);
  assert.ok(r.rows.length > 0 && r.rows.every(x => x.pay_rate === null), 'all pay redacted');
  assert.ok(r.trace.some(t => t.layer === 'access' && t.reason === 'role-restricted' && t.field === 'pay_rate'));
});

test('ROLE peer: directory visible for store coworkers, sensitive role-restricted', () => {
  const store01 = (db.rev['works_at']['Store 01 - Austin Domain'] || []).length;
  const dir = FF.runSpec({ from: 'person', select: ['title', 'position'] }, db, 'scheduling', FR.ROLES.peer);
  assert.strictEqual(dir.rows.length, store01, 'store coworkers visible');
  assert.ok(dir.rows.every(x => x.position), 'directory field shown');
  const pay = FF.runSpec({ from: 'person', select: ['title', 'pay_rate'] }, db, 'payroll', FR.ROLES.peer);
  assert.ok(pay.rows.every(x => x.pay_rate === null) &&
            pay.trace.some(t => t.layer === 'access' && t.reason === 'role-restricted'));
});

test('ROLE ic: sees only self', () => {
  const icTitle = db.idToTitle['EMP-0002'];
  const r = FF.runSpec({ from: 'person', select: ['title'] }, db, 'employment', FR.ROLES.ic);
  assert.deepStrictEqual(r.rows.map(x => x.title), [icTitle]);
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

test('NO BYPASS (role): peer reaches 0 employment_events via a store anchor', () => {
  const r = FF.runSpec({ from: 'store',
    traverse: [{ to: 'employment_event', on: 'store', direction: 'in', as: 'ev' }],
    select: ['title'] }, db, 'employment', FR.ROLES.peer);
  const reached = r.rows.reduce((a, x) => a + ((x.ev && x.ev.length) || 0), 0);
  assert.strictEqual(reached, 0, 'peer (no employment scope) reaches no events through a store');
  assert.ok(r.trace.some(t => t.layer === 'access' && t.reason === 'role-restricted'));
});

test('NO BYPASS (consent): employment_event via store anchor stays consent-gated under wrong purpose', () => {
  const r = FF.runSpec({ from: 'store',
    traverse: [{ to: 'employment_event', on: 'store', direction: 'in', as: 'ev' }],
    select: ['title'] }, db, 'scheduling');   // no role; wrong purpose for employment data
  const reached = r.rows.reduce((a, x) => a + ((x.ev && x.ev.length) || 0), 0);
  assert.strictEqual(reached, 0, 'no role: events still out-of-purpose under scheduling');
  assert.ok(r.trace.some(t => t.reason === 'out-of-purpose'));
});

test('traverse to gated record still works for authorized viewer', () => {
  // chro under employment purpose: events reachable from a store (subject consents to hr.employment)
  const r = FF.runSpec({ from: 'store',
    traverse: [{ to: 'employment_event', on: 'store', direction: 'in', as: 'ev' }],
    select: ['title'] }, db, 'employment', FR.ROLES.chro);
  const reached = r.rows.reduce((a, x) => a + ((x.ev && x.ev.length) || 0), 0);
  assert.ok(reached > 0, 'CHRO under employment can reach events');
});
