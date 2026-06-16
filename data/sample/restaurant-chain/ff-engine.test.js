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
