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
          var key = groupItems.map(function (it) { return JSON.stringify(getProp(b, it)); }).join('');
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
        html += '<pre class="pg-json">' + esc(JSON.stringify(obj, null, 2)) + '</pre>';
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
  var api = {
    QueryError: QueryError,
    buildData: buildData,
    loadFixtures: loadFixtures,
    tokenize: tokenize,
    parseQuery: parseQuery,
    runQuery: runQuery,
    SEED_QUERIES: SEED_QUERIES,
    renderResponse: renderResponse,
    EDGES: EDGES,
    LABELS: LABELS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.GraphPlayground = api;
})(typeof window !== 'undefined' ? window : globalThis);
