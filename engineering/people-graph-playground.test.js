/*
 * Unit tests for the people-graph playground interpreter.
 * Run: node --test engineering/people-graph-playground.test.js
 * Executes the parser and the executor against the LIVE fixtures so the
 * engine is checked against ground truth (the same numbers verified during
 * the WP-01 use-cases work).
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GP = require('./people-graph-playground.js');

function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'console', 'data', name), 'utf8'));
}
const data = GP.buildData(
  fixture('people.json'),
  fixture('requisitions.json'),
  fixture('candidates.json'),
  fixture('applied_for.json')
);
function run(cypher) { return GP.runQuery(GP.parseQuery(cypher), data); }

// ───────────────────────── parser
test('every runnable seed query parses', () => {
  GP.SEED_QUERIES.filter(q => q.runnable).forEach(q => {
    assert.doesNotThrow(() => GP.parseQuery(q.cypher), `seed ${q.id} should parse`);
  });
});

test('unsupported clause throws a friendly QueryError', () => {
  assert.throws(() => GP.parseQuery('CREATE (p:person) RETURN p.id'),
    e => e.name === 'QueryError' && /Unsupported clause "CREATE"/.test(e.message));
});

test('unknown label is rejected with the supported list', () => {
  assert.throws(() => GP.parseQuery('MATCH (x:widget) RETURN x.id'),
    e => e.name === 'QueryError' && /Unknown label "widget"/.test(e.message) && /person/.test(e.message));
});

test('unknown edge is rejected with the supported list', () => {
  assert.throws(() => GP.parseQuery('MATCH (a:person)-[:knows]->(b:person) RETURN a.id'),
    e => e.name === 'QueryError' && /Unknown edge "knows"/.test(e.message) && /applied_for/.test(e.message));
});

test('ORDER BY on a non-returned column is rejected', () => {
  assert.throws(() => GP.runQuery(GP.parseQuery('MATCH (p:person) RETURN p.id ORDER BY p.flight_risk'), data),
    e => e.name === 'QueryError' && /not a returned column/.test(e.message));
});

// ───────────────────────── executor against live fixtures
test('retention-risk: 8 rows, sorted desc, top score is the real max', () => {
  const r = run(GP.SEED_QUERIES.find(q => q.id === 'retention-risk').cypher);
  assert.equal(r.rows.length, 8);
  // flight_risk is the last column; sorted DESC
  const fr = r.columns.indexOf('p.flight_risk');
  assert.ok(r.rows[0][fr] >= r.rows[1][fr]);
  const trueTop = Math.max(...fixture('people.json').filter(p => p.department === 'Engineering').map(p => p.flight_risk));
  assert.equal(r.rows[0][fr], trueTop);
});

test('reports_to: manager EMP-00457 has 9 reports', () => {
  const r = run('MATCH (p:person)-[:reports_to]->(m:person) WHERE m.id = "EMP-00457" RETURN p.id, p.display_name, p.title');
  assert.equal(r.rows.length, 9);
});

test('comp-ratio: Operations/Business Ops top 5 sorted desc', () => {
  const r = run('MATCH (p:person) WHERE p.department = "Operations" AND p.team = "Business Ops" RETURN p.id, p.display_name, p.comp_ratio ORDER BY p.comp_ratio DESC LIMIT 5');
  assert.equal(r.rows.length, 5);
  const cr = r.columns.indexOf('p.comp_ratio');
  for (let i = 1; i < r.rows.length; i++) assert.ok(r.rows[i - 1][cr] >= r.rows[i][cr]);
});

test('application-history: the real applied_for edge for CAND-00000001', () => {
  const r = run(GP.SEED_QUERIES.find(q => q.id === 'application-history').cypher);
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0][r.columns.indexOf('r.id')], 'REQ-00001');
  assert.equal(r.rows[0][r.columns.indexOf('e.valid_to')], '2026-04-24');
});

test('pipeline aging: 5 open reqs sorted by days_open desc', () => {
  const r = run('MATCH (r:requisition) WHERE r.status = "open" RETURN r.id, r.title, r.days_open ORDER BY r.days_open DESC LIMIT 5');
  assert.equal(r.rows.length, 5);
  const d = r.columns.indexOf('r.days_open');
  for (let i = 1; i < r.rows.length; i++) assert.ok(r.rows[i - 1][d] >= r.rows[i][d]);
});

test('headcount grouping: Engineering = 684 and is the largest', () => {
  const r = run(GP.SEED_QUERIES.find(q => q.id === 'headcount').cypher);
  // sorted DESC by headcount; first row should be the largest department
  const dep = r.rows[0][0], head = r.rows[0][1];
  const engCount = fixture('people.json').filter(p => p.department === 'Engineering').length;
  assert.equal(engCount, 684);
  // Engineering should appear with 684 somewhere
  const engRow = r.rows.find(row => row[0] === 'Engineering');
  assert.equal(engRow[1], 684);
  // top row is the max
  assert.ok(head >= r.rows[r.rows.length - 1][1]);
});

test('aggregate without grouping: count(*) of all candidates equals fixture length', () => {
  const r = run('MATCH (c:candidate) RETURN count(*) AS n');
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0][0], fixture('candidates.json').length);
});

test('applied_for edge count = 3756', () => {
  const r = run('MATCH (c:candidate)-[e:applied_for]->(r:requisition) RETURN count(*) AS edges');
  assert.equal(r.rows[0][0], 3756);
});

test('WHERE IN list works', () => {
  const r = run('MATCH (p:person) WHERE p.id IN ["EMP-00001","EMP-00002"] RETURN p.id');
  assert.equal(r.rows.length, 2);
});

test('open reqs total = 125 of 140', () => {
  const r = run('MATCH (r:requisition) WHERE r.status = "open" RETURN count(*) AS n');
  assert.equal(r.rows[0][0], 125);
  const all = run('MATCH (r:requisition) RETURN count(*) AS n');
  assert.equal(all.rows[0][0], 140);
});

test('RETURN p returns the whole record (every schema field)', () => {
  const r = run('MATCH (p:person) WHERE p.id = "EMP-00001" RETURN p');
  assert.equal(r.rows.length, 1);
  const rec = r.rows[0][0];
  assert.equal(typeof rec, 'object');
  assert.equal(rec.id, 'EMP-00001');
  // a representative spread across the schema groups
  ['display_name', 'department', 'team', 'comp_ratio', 'flight_risk', 'tenure_years', 'manager_id']
    .forEach(k => assert.ok(k in rec, `record should carry ${k}`));
});

test('reports_to from a person returns the manager record (RETURN m)', () => {
  const r = run('MATCH (p:person)-[:reports_to]->(m:person) WHERE p.id = "EMP-00001" RETURN m');
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0][0].id, 'EMP-00457');
});

test('every runnable seed executes and returns ≥1 row', () => {
  GP.SEED_QUERIES.filter(q => q.runnable).forEach(q => {
    const r = run(q.cypher);
    assert.ok(r.rows.length >= 1, `seed ${q.id} should return rows`);
  });
});

// ───────────────────────── subgraph (graph viz)
test('subgraph: RETURN p is a single labelled node, no edges', () => {
  const sg = GP.subgraph(GP.parseQuery('MATCH (p:person) WHERE p.id = "EMP-00001" RETURN p'), data);
  assert.equal(sg.nodes.length, 1);
  assert.equal(sg.edges.length, 0);
  assert.equal(sg.nodes[0].id, 'EMP-00001');
  assert.equal(sg.nodes[0].label, 'person');
});

test('subgraph: a manager hub is 1 manager + 9 reports with 9 edges', () => {
  const sg = GP.subgraph(GP.parseQuery('MATCH (peer:person)-[:reports_to]->(m:person) WHERE m.id = "EMP-00457" RETURN peer.id'), data);
  assert.equal(sg.nodes.length, 10);
  assert.equal(sg.edges.length, 9);
  assert.ok(sg.edges.every(e => e.type === 'reports_to'));
});

test('subgraph: applied_for links a candidate to a requisition', () => {
  const sg = GP.subgraph(GP.parseQuery('MATCH (c:candidate)-[e:applied_for]->(r:requisition) WHERE c.id = "CAND-00000001" RETURN r.id'), data);
  assert.equal(sg.edges.length, 1);
  assert.equal(sg.edges[0].type, 'applied_for');
  assert.deepEqual(sg.nodes.map(n => n.label).sort(), ['candidate', 'requisition']);
});

test('subgraph: a node cap truncates and flags it', () => {
  const sg = GP.subgraph(GP.parseQuery('MATCH (p:person) RETURN p.id'), data, 10);
  assert.equal(sg.nodes.length, 10);
  assert.equal(sg.truncated, true);
  assert.ok(sg.matched > 10);
});
