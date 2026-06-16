'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const FR = require('./ff-roles.js');
const FF = require('./ff-engine.js');
const db = FF.buildDb(JSON.parse(
  fs.readFileSync(path.join(__dirname, 'forkandflame.graph.json'), 'utf8')));

test('all five personas exist with valid shape', () => {
  ['chro', 'hrbp', 'manager', 'ic', 'peer'].forEach(id => {
    const r = FR.ROLES[id];
    assert.ok(r, 'role ' + id);
    assert.strictEqual(r.id, id);
    assert.ok(typeof r.label === 'string' && r.label.length);
    assert.ok(['all', 'region', 'subtree', 'self', 'store'].includes(r.population.type));
    r.scopes.forEach(s => assert.ok(FR.ALL_SCOPES.includes(s), id + ' scope ' + s));
  });
});

test('persona scope authority matches the design matrix', () => {
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
});

test('non-null anchors and population values exist in the fixture', () => {
  Object.values(FR.ROLES).forEach(r => {
    if (r.anchor) assert.ok(db.idToTitle[r.anchor], r.id + ' anchor id exists: ' + r.anchor);
    if (r.population.type === 'self' || r.population.type === 'subtree')
      assert.ok(db.idToTitle[r.population.value], r.id + ' pop id exists: ' + r.population.value);
    if (r.population.type === 'store')
      assert.ok(db.nodesByTitle[r.population.value], r.id + ' pop store exists');
    if (r.population.type === 'region')
      assert.ok(db.nodesByType.store.some(s => s.props.region === r.population.value),
        r.id + ' region exists');
  });
});
