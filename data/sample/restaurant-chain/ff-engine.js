// ff-engine.js — deterministic graph engine for the Fork & Flame contextual map.
// Runs a constrained traversal spec and ENFORCES the v6 governance-basis model
// (default-deny, purpose->scope) in code. Dual-mode: Node (module.exports) and
// browser (window.FFEngine).
(function (global) {
  'use strict';

  function buildDb(graph) {
    var nodesByTitle = {}, nodesByType = {}, idToTitle = {};
    graph.nodes.forEach(function (n) {
      nodesByTitle[n.title] = n;
      (nodesByType[n.type] = nodesByType[n.type] || []).push(n);
      if (n.id) idToTitle[n.id] = n.title;
    });
    var fwd = {}, rev = {};
    graph.edges.forEach(function (e) {
      (fwd[e.verb] = fwd[e.verb] || {});
      (fwd[e.verb][e.src] = fwd[e.verb][e.src] || []).push(e.dst);
      (rev[e.verb] = rev[e.verb] || {});
      (rev[e.verb][e.dst] = rev[e.verb][e.dst] || []).push(e.src);
    });
    return { graph: graph, meta: graph.meta, grants: graph.grants,
             nodesByTitle: nodesByTitle, nodesByType: nodesByType, fwd: fwd, rev: rev,
             idToTitle: idToTitle };
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

  // --- consent-only public predicates (not used internally; see readField) ---
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

  function computePopulation(role, db) {
    if (!role || !role.population || role.population.type === 'all') return { all: true };
    var t = role.population.type, v = role.population.value, set = new Set();
    if (t === 'self') { set.add((db.idToTitle && db.idToTitle[v]) || v); }
    else if (t === 'store') { ((db.rev['works_at'] || {})[v] || []).forEach(function (p) { set.add(p); }); }
    else if (t === 'region') {
      db.nodesByType.person.forEach(function (pn) {
        var st = db.nodesByTitle[pn.props.works_at];
        if (st && st.props.region === v) set.add(pn.title);
      });
    } else if (t === 'subtree') {
      var root = (db.idToTitle && db.idToTitle[v]) || v;
      var stack = [root]; set.add(root);
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

  // readField is the CANONICAL field-level enforcement predicate: role authority
  // (access layer) AND consent (consent layer), access reported first on conflict.
  // All internal field gating MUST go through readField (and nodeReadable for whole
  // gated-record nodes). canRead/canReadTarget/canReadEdge below are consent-only
  // public predicates, NOT used on the enforcement path — do not add gating to them.
  // Combined field predicate: role authority first (access layer), population second, then consent.
  function readField(subjectTitle, scope, db, purpose, role, pop) {
    if (!roleAllowsScope(role, scope)) return { ok: false, layer: 'access', reason: 'role-restricted' };
    if (pop && !pop.all && !inPopulation(pop, subjectTitle)) return { ok: false, layer: 'access', reason: 'out-of-population' };
    var v = gate(subjectTitle, scope, db, purpose);
    if (!v.ok) return { ok: false, layer: 'consent', reason: v.reason };
    return { ok: true };
  }

  // A node of a gated TYPE (its whole record is consent-bearing) is readable only
  // under the matching purpose AND with a valid grant from its SUBJECT person.
  // Non-gated (directory) nodes are always visible.
  function nodeReadable(node, db, purpose, trace, role, pop) {
    var scope = db.meta.gatedTargets[node.type];
    if (scope) {                                   // person-subject record: role + population + consent
      var subject = node.props.person;
      var r = readField(subject, scope, db, purpose, role, pop);
      if (!r.ok) { refuse(trace, subject || node.title, node.type, scope, r.reason, r.layer); return false; }
      return true;
    }
    var yscope = (db.meta.gatedTypes || {})[node.type];
    if (yscope) {                                  // institutional record (e.g. candidate): role + purpose
      // Inlined (NOT readField) by design: institutional records have no data-subject
      // employee, so they skip the population + per-person consent checks (consent is
      // implied by application). Do not route this through readField/gate.
      if (!roleAllowsScope(role, yscope)) {
        refuse(trace, node.title, node.type, yscope, 'role-restricted', 'access'); return false;
      }
      if (db.meta.purposes[purpose] !== yscope) {
        refuse(trace, node.title, node.type, yscope, 'out-of-purpose', 'consent'); return false;
      }
      return true;
    }
    return true;                                    // directory node
  }

  function refuse(trace, person, field, scope, reason, layer) {
    if (trace) trace.push({ person: person, field: field, scope: scope,
                            reason: reason, layer: layer || 'consent' });
  }

  function project(node, select, db, purpose, trace, role, pop) {
    var row = {}, fields = select || ['title'];
    fields.forEach(function (field) {
      if (field === 'title') { row.title = node.title; return; }
      var scope = node.type === 'person' ? db.meta.gatedProps[field] : null;
      if (!scope) { row[field] = node.props[field]; return; }
      var r = readField(node.title, scope, db, purpose, role, pop);
      if (r.ok) { row[field] = node.props[field]; }
      else { row[field] = null; refuse(trace, node.title, field, scope, r.reason, r.layer); }
    });
    if (fields.indexOf('title') === -1) row.title = node.title;
    return row;
  }

  function neighbors(db, title, hop, purpose, trace, role, pop) {
    var map = hop.direction === 'in' ? db.rev[hop.on] : db.fwd[hop.on];
    var titles = (map && map[title]) || [];
    var result = titles.map(function (t) { return db.nodesByTitle[t]; }).filter(Boolean)
      .filter(function (n) { return !hop.to || n.type === hop.to; })
      .filter(function (n) {
        return (hop.filters || []).every(function (f) {
          var s = db.meta.gatedProps[f.field];
          if (s && n.type === 'person') {
            var rf = readField(n.title, s, db, purpose, role, pop);
            if (!rf.ok) { refuse(trace, n.title, f.field, s, rf.reason, rf.layer); return false; }
          }
          return matchFilter(n, f);
        });
      });
    // Gated-record targets: gate by SUBJECT (population + role + consent), regardless of
    // anchor type. nodeReadable returns true for non-gated-record types (directory — always visible).
    result = result.filter(function (n) {
      if (!db.meta.gatedTargets[n.type] && !(db.meta.gatedTypes || {})[n.type]) return true;
      return nodeReadable(n, db, purpose, trace, role, pop);
    });
    // Gated edge (e.g. distributes_to): gate by the neighbor person.
    var eScope = db.meta.gatedEdges[hop.on];
    if (eScope) {
      result = result.filter(function (n) {
        if (n.type !== 'person') return true;
        var er = readField(n.title, eScope, db, purpose, role, pop);
        if (!er.ok) { refuse(trace, n.title, hop.on, eScope, er.reason, er.layer); return false; }
        return true;
      });
    }
    return result;
  }

  function aggregate(nodes, spec, db, purpose, trace, role, pop) {
    var groups = {};
    nodes.forEach(function (n) {
      var key;
      if (spec.groupBy) {
        var gscope = db.meta.gatedProps[spec.groupBy];
        if (gscope && n.type === 'person') {
          var gr = readField(n.title, gscope, db, purpose, role, pop);
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
            var r = readField(n.title, scope, db, purpose, role, pop);
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

  function runSpec(spec, db, purpose, role) {
    var trace = [], citations = {};
    var pop = computePopulation(role, db);
    var nodes = (db.nodesByType[spec.from] || []).slice();
    (spec.filters || []).forEach(function (f) {
      var scope = db.meta.gatedProps[f.field];
      nodes = nodes.filter(function (n) {
        if (scope && n.type === 'person') {
          var r = readField(n.title, scope, db, purpose, role, pop);
          if (!r.ok) { refuse(trace, n.title, f.field, scope, r.reason, r.layer); return false; }
        }
        return matchFilter(n, f);
      });
    });
    nodes = nodes.filter(function (n) { return nodeReadable(n, db, purpose, trace, role, pop); });
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
      var agg = aggregate(enriched.map(function (c) { return c.node; }), spec.aggregate, db, purpose, trace, role, pop);
      return { rows: agg, trace: trace, citations: citeArr() };
    }
    var rows = enriched.map(function (c) {
      var row = project(c.node, spec.select, db, purpose, trace, role, pop);
      Object.keys(c.hops).forEach(function (k) { row[k] = c.hops[k]; });
      return row;
    });
    return { rows: rows, trace: trace, citations: citeArr() };
  }

  var api = { buildDb: buildDb, runSpec: runSpec, matchFilter: matchFilter,
              neighbors: neighbors, aggregate: aggregate,
              canRead: canRead, canReadTarget: canReadTarget,
              canReadEdge: canReadEdge, checkGrant: checkGrant,
              nodeReadable: nodeReadable,
              computePopulation: computePopulation, inPopulation: inPopulation,
              roleAllowsScope: roleAllowsScope, readField: readField,
              idToTitle: function (db, id) { return db.idToTitle && db.idToTitle[id]; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.FFEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
