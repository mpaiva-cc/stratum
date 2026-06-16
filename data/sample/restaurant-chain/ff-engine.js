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
    if (!scope) return { ok: true };
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

  function aggregate(nodes, spec, db, purpose, trace) {
    var groups = {};
    nodes.forEach(function (n) {
      var key = spec.groupBy ? n.props[spec.groupBy] : '__all__';
      (groups[key] = groups[key] || []).push(n);
    });
    return Object.keys(groups).map(function (key) {
      var members = groups[key], vals = [];
      if (spec.field) {
        members.forEach(function (n) {
          var verdict = n.type === 'person'
            ? canRead(n.title, spec.field, db, purpose) : { ok: true };
          if (!verdict.ok) {
            if (trace) trace.push({ person: n.title, field: spec.field,
                                    scope: db.meta.gatedProps[spec.field], reason: verdict.reason });
            return;
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
        ctx.hops[hop.as || hop.to] = neighbors(db, n.title, hop, purpose, trace).map(function (m) {
          citations[m.title] = m.type; return m.title;
        });
      });
      return ctx;
    });
    (spec.require || []).forEach(function (asName) {
      enriched = enriched.filter(function (c) { return (c.hops[asName] || []).length > 0; });
    });
    enriched.forEach(function (c) { citations[c.node.title] = c.node.type; });
    if (spec.aggregate) {
      var agg = aggregate(enriched.map(function (c) { return c.node; }), spec.aggregate, db, purpose, trace);
      return { rows: agg, trace: trace,
               citations: Object.keys(citations).map(function (t) {
                 return { title: t, type: citations[t] }; }) };
    }
    var rows = enriched.map(function (c) {
      var row = project(c.node, spec.select, db, purpose, trace);
      Object.keys(c.hops).forEach(function (k) { row[k] = c.hops[k]; });
      return row;
    });
    return { rows: rows, trace: trace,
             citations: Object.keys(citations).map(function (t) {
               return { title: t, type: citations[t] }; }) };
  }

  var api = { buildDb: buildDb, runSpec: runSpec, matchFilter: matchFilter,
              neighbors: neighbors, aggregate: aggregate,
              canRead: canRead, canReadTarget: canReadTarget,
              canReadEdge: canReadEdge, checkGrant: checkGrant };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.FFEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
