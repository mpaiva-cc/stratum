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
  assert.ok(r.rows.length >= 1);
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
