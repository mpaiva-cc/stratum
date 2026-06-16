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
