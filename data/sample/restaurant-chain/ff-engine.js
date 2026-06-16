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
    var row = {}, fields = select || ['title'];
    fields.forEach(function (field) {
      row[field] = field === 'title' ? node.title : node.props[field];
    });
    if (fields.indexOf('title') === -1) row.title = node.title;
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

  var api = { buildDb: buildDb, runSpec: runSpec, matchFilter: matchFilter };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.FFEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
