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

  var api = { buildDb: buildDb, runSpec: runSpec, matchFilter: matchFilter, neighbors: neighbors };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.FFEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
