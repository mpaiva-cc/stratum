/*
 * people-graph-playground.js — a constrained Cypher-subset interpreter that runs
 * client-side over the served people-graph fixtures (people / requisitions /
 * candidates / applied_for). Supports the white-paper's worked use cases as
 * runnable queries. No backend; no graph database; real data only.
 *
 * Works in the browser (window.GraphPlayground) and in Node (module.exports)
 * so the parser/executor can be unit-tested against the live fixtures.
 *
 * Supported grammar (v1):
 *   MATCH pattern (WHERE conds)? RETURN projection (ORDER BY orderlist)? (LIMIT int)?
 *   pattern  := (v:label) [ -[ (relvar)? (:type)? ]-> (v:label) ]
 *   cond     := var.prop (= | != | > | >= | < | <= | IN) literal   (joined by AND)
 *   item     := (var.prop | aggfn( var.prop | var | * )) (AS alias)?   aggfn: count avg sum min max
 *   labels: person, requisition, candidate   edges: applied_for, reports_to
 */
(function (global) {
  'use strict';

  // ───────────────────────────────────────────────────── error type
  function QueryError(message) {
    this.name = 'QueryError';
    this.message = message;
  }
  QueryError.prototype = Object.create(Error.prototype);
  QueryError.prototype.constructor = QueryError;

  // ───────────────────────────────────────────────────── schema knowledge
  // Which fixture backs each label, and the endpoints of each derived/real edge.
  var EDGES = {
    applied_for: { from: 'candidate', to: 'requisition' }, // real edge fixture
    reports_to: { from: 'person', to: 'person' }           // derived from manager_id
  };
  var LABELS = ['person', 'requisition', 'candidate'];

  // ───────────────────────────────────────────────────── data build / load
  function indexById(arr) {
    var m = Object.create(null);
    for (var i = 0; i < arr.length; i++) m[arr[i].id] = arr[i];
    return m;
  }

  // Build the in-memory graph from the raw fixture arrays.
  function buildData(people, reqs, cands, edges) {
    var byId = {
      person: indexById(people),
      requisition: indexById(reqs),
      candidate: indexById(cands)
    };
    var appliedFor = edges.map(function (e) {
      return {
        from: String(e.from).replace('candidate:', ''),
        to: String(e.to).replace('requisition:', ''),
        props: e
      };
    });
    var reportsTo = [];
    for (var i = 0; i < people.length; i++) {
      if (people[i].manager_id) {
        reportsTo.push({ from: people[i].id, to: people[i].manager_id, props: {} });
      }
    }
    return {
      nodes: { person: people, requisition: reqs, candidate: cands },
      byId: byId,
      edges: { applied_for: appliedFor, reports_to: reportsTo }
    };
  }

  // Browser loader. `base` is window.STRATUM_BASE (ends with "/").
  function loadFixtures(base) {
    base = base || '/';
    function get(p) {
      return fetch(base + 'console/data/' + p).then(function (r) {
        if (!r.ok) throw new QueryError('Could not load ' + p + ' (' + r.status + ').');
        return r.json();
      });
    }
    return Promise.all([
      get('people.json'), get('requisitions.json'), get('candidates.json'), get('applied_for.json')
    ]).then(function (a) { return buildData(a[0], a[1], a[2], a[3]); });
  }

  // ───────────────────────────────────────────────────── tokenizer
  var KEYWORDS = ['MATCH', 'WHERE', 'RETURN', 'ORDER', 'BY', 'LIMIT', 'AS', 'AND', 'ASC', 'DESC', 'IN'];
  var AGG = ['count', 'avg', 'sum', 'min', 'max'];

  function tokenize(text) {
    var toks = [];
    var i = 0, n = text.length;
    var multi = [']->', '-[', '>=', '<=', '!='];
    while (i < n) {
      var c = text[i];
      if (/\s/.test(c)) { i++; continue; }
      // string literal
      if (c === '"' || c === "'") {
        var q = c, j = i + 1, s = '';
        while (j < n && text[j] !== q) { s += text[j]; j++; }
        if (j >= n) throw new QueryError('Unterminated string in query.');
        toks.push({ t: 'str', v: s }); i = j + 1; continue;
      }
      // number
      if (/[0-9]/.test(c)) {
        var k = i, num = '';
        while (k < n && /[0-9.]/.test(text[k])) { num += text[k]; k++; }
        toks.push({ t: 'num', v: parseFloat(num) }); i = k; continue;
      }
      // multi-char operators
      var matched = null;
      for (var m = 0; m < multi.length; m++) {
        if (text.substr(i, multi[m].length) === multi[m]) { matched = multi[m]; break; }
      }
      if (matched) { toks.push({ t: 'op', v: matched }); i += matched.length; continue; }
      // single-char punctuation / operators
      if ('()[].,:*=><'.indexOf(c) !== -1) { toks.push({ t: 'op', v: c }); i++; continue; }
      // word: keyword or identifier
      if (/[A-Za-z_]/.test(c)) {
        var w = '', p = i;
        while (p < n && /[A-Za-z0-9_]/.test(text[p])) { w += text[p]; p++; }
        var up = w.toUpperCase();
        if (KEYWORDS.indexOf(up) !== -1) toks.push({ t: 'kw', v: up });
        else toks.push({ t: 'id', v: w });
        i = p; continue;
      }
      throw new QueryError('Unexpected character "' + c + '" in query.');
    }
    return toks;
  }

  // ───────────────────────────────────────────────────── parser (recursive descent)
  function parseQuery(text) {
    var toks = tokenize(text);
    var pos = 0;
    function peek() { return toks[pos]; }
    function next() { return toks[pos++]; }
    function isKw(v) { var t = peek(); return t && t.t === 'kw' && t.v === v; }
    function isOp(v) { var t = peek(); return t && t.t === 'op' && t.v === v; }
    function eatKw(v) {
      if (!isKw(v)) throw new QueryError('Expected ' + v + (peek() ? ' near "' + peek().v + '"' : ' but query ended.'));
      return next();
    }
    function eatOp(v) {
      if (!isOp(v)) throw new QueryError('Expected "' + v + '"' + (peek() ? ' near "' + peek().v + '"' : ' but query ended.'));
      return next();
    }
    function eatId() {
      var t = peek();
      if (!t || t.t !== 'id') throw new QueryError('Expected a name' + (t ? ' near "' + t.v + '"' : ' but query ended.'));
      return next().v;
    }

    // disallow obviously-unsupported clauses up front for a friendly message
    for (var z = 0; z < toks.length; z++) {
      if (toks[z].t === 'id' && /^(create|merge|delete|set|call|with|optional|union|detach)$/i.test(toks[z].v)) {
        throw new QueryError('Unsupported clause "' + toks[z].v.toUpperCase() +
          '" — the static demo supports MATCH / WHERE / RETURN / ORDER BY / LIMIT only.');
      }
    }

    function parseNode() {
      eatOp('(');
      var v = eatId();
      var label = null;
      if (isOp(':')) { next(); label = eatId(); if (LABELS.indexOf(label) === -1) throw new QueryError('Unknown label "' + label + '" — supported: ' + LABELS.join(', ') + '.'); }
      eatOp(')');
      return { var: v, label: label };
    }

    function parsePattern() {
      var nodes = [parseNode()];
      var rels = [];
      if (isOp('-[')) {
        next();
        var relvar = null, type = null;
        if (peek() && peek().t === 'id') relvar = next().v;
        if (isOp(':')) { next(); type = eatId(); if (!EDGES[type]) throw new QueryError('Unknown edge "' + type + '" — supported: ' + Object.keys(EDGES).join(', ') + '.'); }
        eatOp(']->');
        nodes.push(parseNode());
        rels.push({ var: relvar, type: type, from: nodes[0].var, to: nodes[1].var });
      }
      return { nodes: nodes, rels: rels };
    }

    function parseRef() {
      var v = eatId();
      eatOp('.');
      var prop = eatId();
      return { kind: 'ref', var: v, prop: prop };
    }

    function parseConds() {
      var conds = [];
      do {
        var ref = parseRef();
        var op = peek();
        var OPS = ['=', '!=', '>', '>=', '<', '<='];
        if (op && op.t === 'op' && OPS.indexOf(op.v) !== -1) {
          next();
          conds.push({ ref: ref, op: op.v, val: parseLiteral() });
        } else if (isKw('IN')) {
          next();
          conds.push({ ref: ref, op: 'IN', val: parseLiteral() });
        } else {
          throw new QueryError('Expected a comparison (=, !=, >, >=, <, <=, IN) in WHERE.');
        }
      } while (isKw('AND') && next());
      return conds;
    }

    function parseLiteral() {
      var t = peek();
      if (!t) throw new QueryError('Expected a value but query ended.');
      if (t.t === 'str') { next(); return t.v; }
      if (t.t === 'num') { next(); return t.v; }
      if (isOp('[')) {
        next();
        var list = [];
        while (!isOp(']')) {
          list.push(parseLiteral());
          if (isOp(',')) next();
          else break;
        }
        eatOp(']');
        return list;
      }
      throw new QueryError('Expected a value near "' + t.v + '".');
    }

    function parseItem() {
      var t = peek();
      // aggregate?
      if (t && t.t === 'id' && AGG.indexOf(t.v.toLowerCase()) !== -1 && toks[pos + 1] && toks[pos + 1].v === '(') {
        var fn = next().v.toLowerCase();
        eatOp('(');
        var arg;
        if (isOp('*')) { next(); arg = { kind: 'star' }; }
        else {
          var v = eatId();
          if (isOp('.')) { next(); arg = { kind: 'ref', var: v, prop: eatId() }; }
          else arg = { kind: 'var', var: v };
        }
        eatOp(')');
        var item = { kind: 'agg', fn: fn, arg: arg };
        if (isKw('AS')) { next(); item.alias = eatId(); }
        item.col = item.alias || (fn + '(' + (arg.kind === 'star' ? '*' : arg.kind === 'ref' ? arg.var + '.' + arg.prop : arg.var) + ')');
        return item;
      }
      // plain ref (var.prop) OR a bare node variable (the whole record, e.g. RETURN p)
      var vname = eatId();
      var it;
      if (isOp('.')) { next(); it = { kind: 'ref', var: vname, prop: eatId() }; it.col = vname + '.' + it.prop; }
      else { it = { kind: 'node', var: vname }; it.col = vname; }
      if (isKw('AS')) { next(); it.alias = eatId(); it.col = it.alias; }
      return it;
    }

    function parseProjection() {
      var items = [parseItem()];
      while (isOp(',')) { next(); items.push(parseItem()); }
      return items;
    }

    function parseOrder() {
      // order key is an alias (identifier) or a var.prop reference, with optional ASC/DESC
      var list = [];
      do {
        var name = eatId();
        var col = name;
        if (isOp('.')) { next(); col = name + '.' + eatId(); }
        var d = 'ASC';
        if (isKw('ASC')) { next(); d = 'ASC'; }
        else if (isKw('DESC')) { next(); d = 'DESC'; }
        list.push({ col: col, dir: d });
      } while (isOp(',') && next());
      return list;
    }

    // ---- top-level ----
    eatKw('MATCH');
    var pattern = parsePattern();
    var where = null;
    if (isKw('WHERE')) { next(); where = parseConds(); }
    eatKw('RETURN');
    var projection = parseProjection();
    var order = null;
    if (isKw('ORDER')) { next(); eatKw('BY'); order = parseOrder(); }
    var limit = null;
    if (isKw('LIMIT')) { next(); var lt = peek(); if (!lt || lt.t !== 'num') throw new QueryError('LIMIT expects a number.'); limit = next().v; }
    if (pos < toks.length) throw new QueryError('Unexpected "' + peek().v + '" after the query.');

    return { pattern: pattern, where: where, projection: projection, order: order, limit: limit };
  }

  // ───────────────────────────────────────────────────── executor
  function getProp(binding, ref) {
    var node = binding[ref.var];
    if (node === undefined) throw new QueryError('Unknown variable "' + ref.var + '" in the query.');
    return node ? node[ref.prop] : undefined;
  }

  function bindPattern(pattern, data) {
    var nodes = pattern.nodes, rels = pattern.rels;
    // validate labels exist
    nodes.forEach(function (nd) {
      if (nd.label && LABELS.indexOf(nd.label) === -1) throw new QueryError('Unknown label "' + nd.label + '".');
    });

    if (rels.length === 0) {
      var nd = nodes[0];
      if (!nd.label) throw new QueryError('Single-node patterns need a label, e.g. (' + nd.var + ':person).');
      return data.nodes[nd.label].map(function (rec) { var b = {}; b[nd.var] = rec; return b; });
    }

    // one relationship: (a)-[r:type]->(b)
    var rel = rels[0];
    var a = nodes[0], b = nodes[1];
    var type = rel.type;
    if (!type) throw new QueryError('Relationship needs a type, e.g. -[:applied_for]-> or -[:reports_to]->.');
    var spec = EDGES[type];
    // validate endpoint labels if provided
    if (a.label && a.label !== spec.from) throw new QueryError('Edge "' + type + '" goes from ' + spec.from + ', not ' + a.label + '.');
    if (b.label && b.label !== spec.to) throw new QueryError('Edge "' + type + '" goes to ' + spec.to + ', not ' + b.label + '.');
    var out = [];
    data.edges[type].forEach(function (e) {
      var fromRec = data.byId[spec.from][e.from];
      var toRec = data.byId[spec.to][e.to];
      if (!fromRec || !toRec) return;
      var bnd = {};
      bnd[a.var] = fromRec;
      bnd[b.var] = toRec;
      if (rel.var) bnd[rel.var] = e.props;
      out.push(bnd);
    });
    return out;
  }

  function applyWhere(bindings, where) {
    if (!where) return bindings;
    return bindings.filter(function (b) {
      return where.every(function (c) {
        var lhs = getProp(b, c.ref);
        var rhs = c.val;
        switch (c.op) {
          case '=': return lhs === rhs;
          case '!=': return lhs !== rhs;
          case '>': return lhs > rhs;
          case '>=': return lhs >= rhs;
          case '<': return lhs < rhs;
          case '<=': return lhs <= rhs;
          case 'IN': return Array.isArray(rhs) && rhs.indexOf(lhs) !== -1;
        }
        return false;
      });
    });
  }

  function aggregate(items, groupBindings) {
    var row = [];
    items.forEach(function (it) {
      if (it.kind === 'agg') {
        var vals;
        if (it.arg.kind === 'star') { row.push(groupBindings.length); return; }
        vals = groupBindings.map(function (b) {
          return it.arg.kind === 'ref' ? b[it.arg.var] && b[it.arg.var][it.arg.prop] : b[it.arg.var];
        }).filter(function (v) { return v !== undefined && v !== null; });
        var nums = vals.map(Number).filter(function (x) { return !isNaN(x); });
        switch (it.fn) {
          case 'count': row.push(vals.length); break;
          case 'sum': row.push(nums.reduce(function (a, x) { return a + x; }, 0)); break;
          case 'avg': row.push(nums.length ? +(nums.reduce(function (a, x) { return a + x; }, 0) / nums.length).toFixed(4) : null); break;
          case 'min': row.push(nums.length ? Math.min.apply(null, nums) : null); break;
          case 'max': row.push(nums.length ? Math.max.apply(null, nums) : null); break;
        }
      } else {
        // grouping key — same across the group
        row.push(getProp(groupBindings[0], it));
      }
    });
    return row;
  }

  function runQuery(ast, data) {
    if (!data) throw new QueryError('The demo data has not loaded yet.');
    var bindings = bindPattern(ast.pattern, data);
    bindings = applyWhere(bindings, ast.where);

    var items = ast.projection;
    var hasAgg = items.some(function (it) { return it.kind === 'agg'; });
    var columns = items.map(function (it) { return it.col; });
    var rows;

    if (!hasAgg) {
      rows = bindings.map(function (b) {
        return items.map(function (it) {
          if (it.kind === 'node') return b[it.var]; // whole record (RETURN p)
          return getProp(b, it);
        });
      });
    } else {
      var groupItems = items.filter(function (it) { return it.kind === 'ref'; });
      if (groupItems.length === 0) {
        rows = [aggregate(items, bindings)];
      } else {
        var groups = Object.create(null);
        var order = [];
        bindings.forEach(function (b) {
          var key = groupItems.map(function (it) { return JSON.stringify(getProp(b, it)); }).join('');
          if (!groups[key]) { groups[key] = []; order.push(key); }
          groups[key].push(b);
        });
        rows = order.map(function (k) { return aggregate(items, groups[k]); });
      }
    }

    if (ast.order) {
      var colIdx = {};
      columns.forEach(function (c, i) { colIdx[c] = i; });
      ast.order.forEach(function (o) {
        var idx = colIdx[o.col];
        if (idx === undefined) throw new QueryError('ORDER BY "' + o.col + '" is not a returned column.');
        rows.sort(function (r1, r2) {
          var x = r1[idx], y = r2[idx];
          if (x === y) return 0;
          var cmp = (x === null || x === undefined) ? -1 : (y === null || y === undefined) ? 1 : (x < y ? -1 : 1);
          return o.dir === 'DESC' ? -cmp : cmp;
        });
      });
    }

    if (ast.limit !== null && ast.limit !== undefined) rows = rows.slice(0, ast.limit);
    return { columns: columns, rows: rows };
  }

  // ───────────────────────────────────────────────────── seed queries
  // ───────────────────────────────────────────────────── subgraph (for the viz)
  // The matched subgraph: distinct nodes + edges the query's pattern traversed,
  // honoring WHERE. RETURN (p)-[:reports_to]->(m) over a manager → a hub + spokes;
  // RETURN p → a single node. Capped for legibility.
  function subgraph(ast, data, cap) {
    cap = cap || 48;
    var bindings = applyWhere(bindPattern(ast.pattern, data), ast.where);
    var nodes0 = ast.pattern.nodes;
    var rel = ast.pattern.rels[0];
    var map = Object.create(null);
    var edges = [];
    var truncated = false;
    function add(rec, label) {
      if (!rec) return null;
      if (!map[rec.id]) {
        if (Object.keys(map).length >= cap) { truncated = true; return null; }
        map[rec.id] = { id: rec.id, label: label || null, name: rec.display_name || rec.title || rec.id, rec: rec };
      }
      return map[rec.id];
    }
    bindings.forEach(function (b) {
      if (rel) {
        var a = add(b[nodes0[0].var], nodes0[0].label);
        var c = add(b[nodes0[1].var], nodes0[1].label);
        if (a && c) edges.push({ from: a.id, to: c.id, type: rel.type });
      } else {
        add(b[nodes0[0].var], nodes0[0].label);
      }
    });
    var seen = Object.create(null), uedges = [];
    edges.forEach(function (e) {
      var k = e.from + '>' + e.to + ':' + e.type;
      if (!seen[k]) { seen[k] = 1; uedges.push(e); }
    });
    return {
      nodes: Object.keys(map).map(function (k) { return map[k]; }),
      edges: uedges, truncated: truncated, matched: bindings.length
    };
  }

  var SEED_QUERIES = [
    {
      id: 'person-record', title: 'A person — full record', runnable: true,
      note: 'The whole person record for EMP-00001 (Rahul Ahmadi). RETURN p returns the entire node, so you can see every field of the people schema at once — identity, role, org, compensation, and the derived signals.',
      cypher: 'MATCH (p:person)\nWHERE p.id = "EMP-00001"\nRETURN p'
    },
    {
      id: 'person-manager', title: 'Their manager', runnable: true,
      note: 'Follow the reports_to edge (derived from manager_id) from EMP-00001 to their manager, and return that manager’s full record.',
      cypher: 'MATCH (p:person)-[:reports_to]->(m:person)\nWHERE p.id = "EMP-00001"\nRETURN m'
    },
    {
      id: 'person-signals', title: 'Their key signals', runnable: true,
      note: 'Project specific fields of one person — title, level, tenure, comp-ratio, flight-risk, last review. comp_ratio, tenure_years, and flight_risk are derived at projection time, not raw stored facts.',
      cypher: 'MATCH (p:person)\nWHERE p.id = "EMP-00001"\nRETURN p.title, p.level, p.tenure_years, p.comp_ratio, p.flight_risk, p.last_review'
    },
    {
      id: 'person-team', title: 'Their team', runnable: true,
      note: 'The people who share EMP-00001’s manager (EMP-00457) — the team they sit on. Two reports_to edges meeting at the same manager.',
      cypher: 'MATCH (peer:person)-[:reports_to]->(m:person)\nWHERE m.id = "EMP-00457"\nRETURN peer.id, peer.display_name, peer.title'
    },
    {
      id: 'retention-risk', title: 'Retention risk (cohort)', runnable: true,
      note: 'A cohort query: top flight-risk people in Engineering, real flight_risk scores from people.json.',
      cypher: 'MATCH (p:person)\nWHERE p.department = "Engineering"\nRETURN p.id, p.display_name, p.title, p.flight_risk\nORDER BY p.flight_risk DESC\nLIMIT 8'
    },
    {
      id: 'headcount', title: 'Headcount by department', runnable: true,
      note: 'Implicit grouping: count people per department.',
      cypher: 'MATCH (p:person)\nRETURN p.department, count(*) AS headcount\nORDER BY headcount DESC'
    },
    {
      id: 'application-history', title: 'A candidate’s applications', runnable: true,
      note: 'A different node type and the real applied_for edge: a candidate’s applications, with the bitemporal interval. Closed valid_to = withdrawn/rejected.',
      cypher: 'MATCH (c:candidate)-[e:applied_for]->(r:requisition)\nWHERE c.id = "CAND-00000001"\nRETURN r.id, r.title, e.applied_at, e.valid_to'
    },
    {
      id: 'identity-concept', title: 'Identity resolution (concept)', runnable: false,
      note: 'Identity-as-edge resolution runs over the full graph, not the flat projection. Shown for reference; see WP-01 §2 and §5.',
      cypher: '// Concept only — not executable on the static projection.\nMATCH (sr:source_record)-[i:identity]->(p:person)\nWHERE i.confidence >= 0.93\nRETURN p.id, sr.system, i.confidence'
    }
  ];

  // ───────────────────────────────────────────────────── renderer (browser only)
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }
  function fmt(v) {
    if (v === null || v === undefined) return '∅';
    return esc(v);
  }

  // ── syntaxHighlight ────────────────────────────────────────────────────────────
  // Escape-then-colorize: HTML-escape the JSON string first so the span tags are
  // safe, then apply a single-pass regex to wrap token classes around the escaped
  // text. The `&quot;` entity (from esc()) represents the JSON double-quote; we
  // match it in the regex below.
  //
  // Token classes (colors defined in .pg-json CSS rules):
  //   .jk  key strings     — the quoted string immediately before a colon + space
  //   .js  value strings   — all other quoted strings
  //   .jn  numbers and booleans (true/false)
  //   .jz  null
  //   everything else (braces, brackets, colons, commas) is unstyled body text
  //
  // The regex operates on HTML-escaped output where " has become &quot;, so we
  // match the &quot; entity in both the key and value string patterns.
  // Caveat: this is a display-only highlighter, not a JSON parser. It handles
  // the JSON.stringify(obj, null, 2) output format reliably but is not a general
  // JSON syntax highlighter.
  function syntaxHighlight(obj) {
    // Step 1: HTML-escape the formatted JSON string.
    var escaped = esc(JSON.stringify(obj, null, 2));

    // Step 2: single-pass token colorization over the escaped string.
    // Pattern breakdown:
    //   (&quot;[^&]*(?:&amp;[^&]*)*&quot;)\s*:   → key (quoted string before colon)
    //   (&quot;[^&]*(?:&amp;[^&]*)*&quot;)        → value string
    //   (-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)        → number
    //   \b(true|false)\b                           → boolean
    //   \b(null)\b                                 → null
    //
    // The &quot; entity replaces " after HTML escaping. Key strings are
    // specifically those followed by optional whitespace and then a colon.
    // We process key before value so the greedy alternation picks the right class.
    return escaped.replace(
      /(&quot;(?:[^&]|&amp;|&lt;|&gt;)*&quot;)(\s*:)|(&quot;(?:[^&]|&amp;|&lt;|&gt;)*&quot;)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)/g,
      function (match, key, colon, str, num, bool, nul) {
        if (key !== undefined) {
          // key string + the colon that follows it
          return '<span class="jk">' + key + '</span>' + colon;
        }
        if (str !== undefined) {
          return '<span class="js">' + str + '</span>';
        }
        if (num !== undefined) {
          return '<span class="jn">' + num + '</span>';
        }
        if (bool !== undefined) {
          return '<span class="jn">' + bool + '</span>';
        }
        if (nul !== undefined) {
          return '<span class="jz">' + nul + '</span>';
        }
        return match;
      }
    );
  }

  function renderResponse(target, result, queryText) {
    var html = '';
    html += '<div class="pg-resp-code"><div class="pg-resp-h">Query</div><pre>' + esc(queryText) + '</pre></div>';
    if (result instanceof QueryError || (result && result.name === 'QueryError')) {
      html += '<div class="pg-resp-data pg-resp-err"><div class="pg-resp-h">Error</div><pre>' + esc(result.message) + '</pre></div>';
      target.innerHTML = html;
      return;
    }
    var cols = result.columns, rows = result.rows;
    // JSON mode: any returned cell is a whole record (object) — e.g. RETURN p.
    // Show the raw record(s) so the people data format / schema is visible.
    var jsonMode = rows.some(function (r) { return r.some(function (c) { return c && typeof c === 'object'; }); });
    var unit = jsonMode ? (rows.length === 1 ? ' record' : ' records') : (rows.length === 1 ? ' row' : ' rows');
    html += '<div class="pg-resp-data"><div class="pg-resp-h">Response · ' + rows.length + unit + '</div>';
    if (!rows.length) {
      html += '<p class="pg-empty">0 rows — the query ran but matched nothing.</p>';
    } else if (jsonMode) {
      rows.forEach(function (r) {
        var obj;
        if (r.length === 1) obj = r[0];                            // RETURN p → the record itself
        else { obj = {}; cols.forEach(function (c, i) { obj[c] = r[i]; }); } // RETURN p, m → keyed
        // tabindex="0" makes the horizontally-scrollable pre reachable by keyboard
        // (WCAG 2.1.1 Keyboard — scrollable regions must be focusable).
        html += '<pre class="pg-json" tabindex="0" aria-label="JSON record">' + syntaxHighlight(obj) + '</pre>';
      });
    } else {
      html += '<table class="pg-table"><thead><tr>';
      cols.forEach(function (c) { html += '<th>' + esc(c) + '</th>'; });
      html += '</tr></thead><tbody>';
      rows.forEach(function (r) {
        html += '<tr>';
        r.forEach(function (cell) { html += '<td>' + fmt(cell) + '</td>'; });
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';
    target.innerHTML = html;
  }

  // ───────────────────────────────────────────────────── exports
  // ───────────────────────────────────────────────────── graph renderer (browser)
  // Render a matched subgraph as an SVG node-link diagram. Highest-degree node is
  // centered (hub-and-spoke for a manager + reports); a relationship-less match is
  // laid out on a ring. Node colour is by label (styled in CSS: .gv-node--person etc).
  function renderGraph(target, sg) {
    if (!sg || !sg.nodes.length) {
      target.innerHTML = '<p class="pg-empty">No nodes to draw for this query.</p>';
      return;
    }
    function e2(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
    var W = 640, H = 460, cx = W / 2, cy = H / 2;
    var deg = Object.create(null);
    sg.nodes.forEach(function (n) { deg[n.id] = 0; });
    sg.edges.forEach(function (e) { deg[e.from] = (deg[e.from] || 0) + 1; deg[e.to] = (deg[e.to] || 0) + 1; });
    var pos = Object.create(null);
    if (sg.edges.length) {
      var center = sg.nodes.slice().sort(function (a, b) { return (deg[b.id] || 0) - (deg[a.id] || 0); })[0];
      pos[center.id] = { x: cx, y: cy };
      var ring = sg.nodes.filter(function (n) { return n.id !== center.id; });
      var R = Math.min(W, H) / 2 - 80;
      ring.forEach(function (n, i) {
        var ang = (-Math.PI / 2) + (2 * Math.PI * i / Math.max(ring.length, 1));
        pos[n.id] = { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
      });
    } else if (sg.nodes.length === 1) {
      pos[sg.nodes[0].id] = { x: cx, y: cy };
    } else {
      var R2 = Math.min(W, H) / 2 - 70;
      sg.nodes.forEach(function (n, i) {
        var ang = (-Math.PI / 2) + (2 * Math.PI * i / sg.nodes.length);
        pos[n.id] = { x: cx + R2 * Math.cos(ang), y: cy + R2 * Math.sin(ang) };
      });
    }
    var NODE_R = 22;
    // when every edge is the same relationship type, name it ONCE in a prominent
    // chip rather than tagging all N edges; mixed-type graphs label each edge.
    var typeList = Object.keys(sg.edges.reduce(function (m, e) { m[e.type] = 1; return m; }, {}));
    var uniform = typeList.length === 1 && sg.edges.length > 1;
    // arrowhead marker for edge direction
    var svg = '<defs><marker id="gv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="gv-arrowhead" d="M0,0 L10,5 L0,10 z"/></marker></defs>';
    sg.edges.forEach(function (ed) {
      var a = pos[ed.from], b = pos[ed.to];
      if (!a || !b) return;
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len;
      // start at the source node edge, stop at the target node edge so the arrow sits at the boundary
      var ax = a.x + ux * NODE_R, ay = a.y + uy * NODE_R, bx = b.x - ux * NODE_R, by = b.y - uy * NODE_R;
      svg += '<line class="gv-edge" x1="' + ax.toFixed(1) + '" y1="' + ay.toFixed(1) + '" x2="' + bx.toFixed(1) + '" y2="' + by.toFixed(1) + '" marker-end="url(#gv-arrow)"/>';
      if (!uniform) {
        svg += '<text class="gv-edge-label" x="' + (a.x + dx * 0.46).toFixed(1) + '" y="' + (a.y + dy * 0.46).toFixed(1) + '" text-anchor="middle" dy="-3">' + e2(ed.type) + '</text>';
      }
    });
    if (uniform) {
      var rt = typeList[0], cw = rt.length * 7.2 + 34;
      svg += '<g class="gv-rel-chip">'
        + '<rect x="12" y="12" rx="3" width="' + cw.toFixed(0) + '" height="23"/>'
        + '<text x="' + (12 + cw / 2).toFixed(1) + '" y="27.5" text-anchor="middle">' + e2(rt) + ' →</text>'
        + '</g>';
    }
    sg.nodes.forEach(function (n) {
      var p = pos[n.id]; if (!p) return;
      var short = String(n.id).replace(/^(EMP|REQ|CAND)-0*/, '');
      var lbl = n.name || n.id; if (lbl.length > 18) lbl = lbl.slice(0, 17) + '…';
      var title = (n.label ? n.label + ': ' : '') + (n.name || n.id) + (n.rec && n.rec.title ? ' · ' + n.rec.title : '') + ' (' + n.id + ')';
      svg += '<g class="gv-node gv-node--' + (n.label || 'node') + '" transform="translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')">'
        + '<title>' + e2(title) + '</title>'
        + '<circle r="22"/>'
        + '<text class="gv-id" y="4" text-anchor="middle">' + e2(short) + '</text>'
        + '<text class="gv-name" y="40" text-anchor="middle">' + e2(lbl) + '</text>'
        + '</g>';
    });
    var types = {}; sg.edges.forEach(function (e) { types[e.type] = 1; });
    var meta = 'Graph · ' + sg.nodes.length + ' node' + (sg.nodes.length === 1 ? '' : 's')
      + ' · ' + sg.edges.length + ' edge' + (sg.edges.length === 1 ? '' : 's')
      + (Object.keys(types).length ? ' · ' + Object.keys(types).join(', ') : '')
      + (sg.truncated ? ' · showing ' + sg.nodes.length + ' of ' + sg.matched : '');
    target.innerHTML = '<div class="pg-resp-h">' + e2(meta) + '</div>'
      + '<svg class="pg-graph-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + e2(meta) + '">' + svg + '</svg>';
  }

  // ───────────────────────────────────────────────────── format projections
  // Render-time crosswalks (Pillar's mapping spec). NOT stored shapes — these
  // project a person record into standards-conformant forms on demand. The
  // not-mapped fields (flight_risk, comp_*, performance_score, level, etc.) are
  // Stratum-internal analytics and are deliberately omitted from these standards.
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
  var IRI = 'https://graph.tessera.example';
  var GENDER_SCHEMA = { woman: 'https://schema.org/Female', man: 'https://schema.org/Male', nonbinary: 'NonBinary' };
  var GENDER_HROPEN = { woman: { codeValue: 'F', shortName: 'Female' }, man: { codeValue: 'M', shortName: 'Male' }, nonbinary: { codeValue: 'UN', shortName: 'Non-binary' } };
  var EMP_SCHEMA = { full_time: 'FULL_TIME', part_time: 'PART_TIME', contractor: 'CONTRACTOR', intern: 'INTERN' };
  var EMP_SCIM = { full_time: 'Employee', part_time: 'Employee', contractor: 'Contractor', intern: 'Intern' };
  var EMP_HROPEN = { full_time: 'Employee', part_time: 'PartTime', contractor: 'Contractor', intern: 'Intern' };

  function isPersonRecord(rec) {
    return !!(rec && typeof rec === 'object' && 'given_name' in rec && 'department' in rec);
  }

  function toJsonLd(rec, mgr) {
    var o = {
      '@context': { '@vocab': 'https://schema.org/', org: 'http://www.w3.org/ns/org#' },
      '@type': 'Person',
      '@id': IRI + '/people/' + rec.id,
      givenName: rec.given_name, familyName: rec.family_name, name: rec.display_name,
      email: rec.email, jobTitle: rec.title
    };
    if (rec.gender) o.gender = GENDER_SCHEMA[rec.gender] || rec.gender;
    o.worksFor = { '@type': ['Organization', 'org:Organization'], '@id': IRI + '/orgs/' + slug(rec.department + ' ' + rec.team), name: rec.department + ' · ' + rec.team };
    o['org:memberOf'] = { '@type': 'org:Organization', '@id': IRI + '/orgs/' + slug(rec.department) };
    if (rec.manager_id) {
      o['org:reportsTo'] = { '@type': 'Person', '@id': IRI + '/people/' + rec.manager_id };
      if (mgr) { o['org:reportsTo'].name = mgr.display_name; o['org:reportsTo'].jobTitle = mgr.title; }
    }
    if (rec.location || rec.country) {
      o.address = { '@type': 'PostalAddress' };
      if (rec.location) o.address.addressLocality = rec.location;
      if (rec.country) o.address.addressCountry = rec.country;
    }
    if (rec.hire_date) o.startDate = rec.hire_date;
    if (rec.employment_type) o.employmentType = EMP_SCHEMA[rec.employment_type] || rec.employment_type;
    return o;
  }

  function toScim(rec, mgr) {
    var o = {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User', 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'],
      id: rec.id, externalId: rec.id, userName: rec.email,
      name: { givenName: rec.given_name, familyName: rec.family_name, formatted: rec.display_name },
      displayName: rec.display_name, emails: [{ value: rec.email, primary: true }],
      title: rec.title, userType: EMP_SCIM[rec.employment_type] || 'Employee', active: true
    };
    if (rec.location || rec.country) {
      var addr = { type: 'work', primary: true };
      if (rec.location) addr.locality = rec.location;
      if (rec.country) addr.country = rec.country;
      o.addresses = [addr];
    }
    var ent = { employeeNumber: rec.id, department: rec.department, organization: rec.department + ' · ' + rec.team };
    if (rec.manager_id) { ent.manager = { value: rec.manager_id }; if (mgr) ent.manager.displayName = mgr.display_name; }
    o['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'] = ent;
    return o;
  }

  function toHrOpen(rec, mgr) {
    var person = {
      personName: { givenName: rec.given_name, familyName: rec.family_name, formattedName: rec.display_name },
      communication: { email: [{ emailUri: rec.email, useCode: 'Work' }] }
    };
    if (rec.gender) person.gender = GENDER_HROPEN[rec.gender] || { codeValue: 'UN', shortName: rec.gender };
    var wa = {
      jobCode: { codeValue: rec.level, shortName: rec.level }, jobTitle: rec.title,
      hireDate: rec.hire_date, seniorityDate: rec.hire_date,
      organizationalUnit: [
        { nameCode: { codeValue: rec.department, shortName: rec.department }, typeCode: 'Department' },
        { nameCode: { codeValue: rec.team, shortName: rec.team }, typeCode: 'Team' }
      ]
    };
    if (rec.manager_id) { var rt = { workerID: { idValue: rec.manager_id } }; if (mgr) { rt.formattedName = mgr.display_name; rt.positionTitle = mgr.title; } wa.reportsTo = [rt]; }
    return {
      documentID: { idValue: rec.id, schemeAgencyName: 'Tessera' },
      worker: {
        workerID: { idValue: rec.id, schemeAgencyName: 'Tessera' }, person: person,
        workerTypeCode: EMP_HROPEN[rec.employment_type] || 'Employee',
        primaryWorkLocation: { cityName: rec.location, countryCode: rec.country }, workAssignment: wa
      }
    };
  }

  function _cell(v, sep) {
    if (v === null || v === undefined) return '';
    var s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return s.replace(/[\r\n]+/g, ' ');
  }
  function toCsv(columns, rows) {
    function q(v) { var s = _cell(v); return /[",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    return [columns.map(q).join(',')].concat(rows.map(function (r) { return r.map(q).join(','); })).join('\n');
  }
  function toTsv(columns, rows) {
    function t(v) { return _cell(v).replace(/\t/g, ' '); }
    return [columns.map(t).join('\t')].concat(rows.map(function (r) { return r.map(t).join('\t'); })).join('\n');
  }
  function toMarkdown(columns, rows) {
    function m(v) { return _cell(v).replace(/\|/g, '\\|'); }
    var head = '| ' + columns.map(m).join(' | ') + ' |';
    var rule = '| ' + columns.map(function () { return '---'; }).join(' | ') + ' |';
    return [head, rule].concat(rows.map(function (r) { return '| ' + r.map(m).join(' | ') + ' |'; })).join('\n');
  }

  // which formats apply to a result shape
  function availableFormats(result) {
    if (!result || !result.rows || !result.rows.length) return [];
    var obj = null;
    result.rows[0].forEach(function (c) { if (obj === null && c && typeof c === 'object') obj = c; });
    if (obj) {
      return isPersonRecord(obj)
        ? [{ id: 'json', label: 'JSON' }, { id: 'jsonld', label: 'JSON-LD' }, { id: 'scim', label: 'SCIM' }, { id: 'hropen', label: 'HR Open' }]
        : [{ id: 'json', label: 'JSON' }];
    }
    return [{ id: 'table', label: 'Table' }, { id: 'csv', label: 'CSV' }, { id: 'tsv', label: 'TSV' }, { id: 'markdown', label: 'Markdown' }, { id: 'json', label: 'JSON' }];
  }

  // the projected object(s) for a record-producing format, with manager resolved
  function _objectsFor(result, format, data) {
    return result.rows.map(function (r) {
      if (format === 'json') {
        if (r.length === 1 && r[0] && typeof r[0] === 'object') return r[0];
        var o = {}; result.columns.forEach(function (c, i) { o[c] = r[i]; }); return o;
      }
      var rec = null; r.forEach(function (c) { if (rec === null && c && typeof c === 'object') rec = c; });
      if (!rec) return null;
      var mgr = (data && rec.manager_id && data.byId && data.byId.person) ? data.byId.person[rec.manager_id] : null;
      return format === 'jsonld' ? toJsonLd(rec, mgr) : format === 'scim' ? toScim(rec, mgr) : toHrOpen(rec, mgr);
    }).filter(function (x) { return x !== null; });
  }

  // raw text of the current view (for copy-to-clipboard)
  function rawText(result, format, data) {
    if (!result || !result.rows) return '';
    if (format === 'csv') return toCsv(result.columns, result.rows);
    if (format === 'tsv') return toTsv(result.columns, result.rows);
    if (format === 'markdown') return toMarkdown(result.columns, result.rows);
    if (format === 'table') return toCsv(result.columns, result.rows); // copy a table as CSV
    var objs = _objectsFor(result, format, data);
    return JSON.stringify(objs.length === 1 ? objs[0] : objs, null, 2);
  }

  var FORMAT_LABEL = { json: 'JSON', jsonld: 'JSON-LD · schema.org/Person + W3C Org', scim: 'SCIM 2.0 User', hropen: 'HR Open Standards', csv: 'CSV', tsv: 'TSV', markdown: 'Markdown' };

  // render a result in a chosen format (browser)
  function renderAs(target, result, queryText, format, data) {
    if (result instanceof QueryError || (result && result.name === 'QueryError')) { renderResponse(target, result, queryText); return; }
    format = format || (availableFormats(result)[0] || { id: 'table' }).id;
    var html = '<div class="pg-resp-code"><div class="pg-resp-h">Query</div><pre>' + esc(queryText) + '</pre></div>';
    var cols = result.columns, rows = result.rows;
    if (!rows.length) {
      html += '<div class="pg-resp-data"><div class="pg-resp-h">Response · 0 rows</div><p class="pg-empty">0 rows — the query ran but matched nothing.</p></div>';
    } else if (format === 'table') {
      html += '<div class="pg-resp-data"><div class="pg-resp-h">Response · ' + rows.length + (rows.length === 1 ? ' row' : ' rows') + '</div><table class="pg-table"><thead><tr>'
        + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>'
        + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + fmt(c) + '</td>'; }).join('') + '</tr>'; }).join('')
        + '</tbody></table></div>';
    } else if (format === 'csv' || format === 'tsv' || format === 'markdown') {
      var txt = format === 'csv' ? toCsv(cols, rows) : format === 'tsv' ? toTsv(cols, rows) : toMarkdown(cols, rows);
      html += '<div class="pg-resp-data"><div class="pg-resp-h">Response · ' + FORMAT_LABEL[format] + '</div><pre class="pg-export">' + esc(txt) + '</pre></div>';
    } else {
      var objs = _objectsFor(result, format, data);
      var note = (format !== 'json') ? '<p class="pg-fmt-note">Render-time projection — not a stored shape. Stratum-internal signals (flight_risk, comp, performance) are intentionally omitted.</p>' : '';
      html += '<div class="pg-resp-data"><div class="pg-resp-h">Response · ' + FORMAT_LABEL[format] + ' · ' + objs.length + (objs.length === 1 ? ' record' : ' records') + '</div>' + note
        + objs.map(function (o) { return '<pre class="pg-json" tabindex="0" aria-label="' + FORMAT_LABEL[format] + ' record">' + syntaxHighlight(o) + '</pre>'; }).join('') + '</div>';
    }
    target.innerHTML = html;
  }

  var api = {
    QueryError: QueryError,
    subgraph: subgraph,
    renderGraph: renderGraph,
    availableFormats: availableFormats,
    renderAs: renderAs,
    rawText: rawText,
    toJsonLd: toJsonLd,
    toScim: toScim,
    toHrOpen: toHrOpen,
    toCsv: toCsv,
    toTsv: toTsv,
    toMarkdown: toMarkdown,
    isPersonRecord: isPersonRecord,
    buildData: buildData,
    loadFixtures: loadFixtures,
    tokenize: tokenize,
    parseQuery: parseQuery,
    runQuery: runQuery,
    SEED_QUERIES: SEED_QUERIES,
    renderResponse: renderResponse,
    syntaxHighlight: syntaxHighlight,
    EDGES: EDGES,
    LABELS: LABELS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.GraphPlayground = api;
})(typeof window !== 'undefined' ? window : globalThis);
