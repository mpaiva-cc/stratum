'use strict';
(function () {
  var db = window.FFEngine.buildDb(window.FF_GRAPH);
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g,
    function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' })[c]; }); }

  function renderResult(spec, result, narrative) {
    var html = '';
    if (narrative) html += '<div class="panel"><p>' + esc(narrative) + '</p></div>';
    html += '<div class="panel"><strong>Result (' + result.rows.length + ' rows)</strong><table><tbody>';
    result.rows.slice(0, 50).forEach(function (r) {
      html += '<tr>' + Object.keys(r).map(function (k) {
        var v = r[k];
        if (v === null) return '<td class="redacted">redacted</td>';
        if (Array.isArray(v)) v = v.length;
        return '<td>' + esc(v) + '</td>';
      }).join('') + '</tr>';
    });
    html += '</tbody></table></div>';
    if (result.trace.length) {
      var byReason = {};
      result.trace.forEach(function (t) { byReason[t.reason] = (byReason[t.reason] || 0) + 1; });
      html += '<div class="panel trace"><strong>Governance trace</strong><ul>';
      Object.keys(byReason).forEach(function (reason) {
        html += '<li><span class="badge">' + esc(reason) + '</span> ' + byReason[reason] + ' refusal(s)</li>';
      });
      html += '</ul></div>';
    }
    html += '<div class="panel"><strong>Query that ran</strong><div class="spec">' +
            esc(JSON.stringify(spec, null, 2)) + '</div></div>';
    html += '<div class="panel"><strong>Based on ' + result.citations.length + ' notes</strong></div>';
    $('answer').innerHTML = html;
  }

  // Build the edge directory from the fixture so the LLM only references real edges.
  function edgeDirectory(db) {
    var byType = {};
    db.graph.edges.forEach(function (e) {
      var src = db.nodesByTitle[e.src], dst = db.nodesByTitle[e.dst];
      if (!src || !dst) return;
      byType[src.type] = byType[src.type] || {};
      byType[src.type][e.verb] = dst.type;
    });
    return byType;
  }

  var SPEC_TOOL = {
    name: 'run_query',
    description: 'Emit a traversal spec to run against the Fork & Flame contextual map.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'anchor node type, e.g. person, store' },
        filters: { type: 'array', items: { type: 'object', properties: {
          field: { type: 'string' }, op: { type: 'string',
            enum: ['eq','neq','in','contains','gt','lt','exists'] },
          value: {} }, required: ['field','op'] } },
        traverse: { type: 'array', items: { type: 'object', properties: {
          to: { type: 'string' }, on: { type: 'string' },
          direction: { type: 'string', enum: ['in','out'] }, as: { type: 'string' },
          filters: { type: 'array' } }, required: ['to','on','direction'] } },
        require: { type: 'array', items: { type: 'string' } },
        select: { type: 'array', items: { type: 'string' } },
        aggregate: { type: 'object', properties: {
          op: { type: 'string', enum: ['count','avg','sum','min','max'] },
          field: { type: 'string' }, groupBy: { type: 'string' } }, required: ['op'] }
      },
      required: ['from']
    }
  };

  function systemPrompt(db, purpose) {
    return [
      'You translate an HCM question into ONE run_query tool call over a graph.',
      'Node types: ' + Object.keys(db.nodesByType).join(', ') + '.',
      'Edge directory (fromType -> {verb: toType}): ' + JSON.stringify(edgeDirectory(db)) + '.',
      'Person props you may filter/select: title, name, status, employment_type,',
      'hire_date, position, works_at, in_department, reports_to, skills, pay_rate, pay_unit.',
      'pay_rate has a companion pay_unit (year vs hour) — do NOT average pay_rate across mixed',
      'units; restrict to one position (e.g. Server) or note the caveat. Reverse traversals use',
      'direction:"in" on the verb that points at the person (e.g. time_off_request/',
      'performance_review/employment_event link a person via verb "person").',
      'The active purpose is "' + purpose + '". Do NOT try to bypass governance;',
      'the engine enforces it. Always answer with exactly one run_query tool call.'
    ].join(' ');
  }

  async function translate(question, db, purpose, key) {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key,
        'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024,
        system: systemPrompt(db, purpose), tools: [SPEC_TOOL],
        tool_choice: { type: 'tool', name: 'run_query' },
        messages: [{ role: 'user', content: question }] })
    });
    if (!res.ok) throw new Error('translate failed: ' + res.status + ' ' + (await res.text()));
    var data = await res.json();
    var tool = (data.content || []).find(function (b) { return b.type === 'tool_use'; });
    if (!tool) throw new Error('model did not emit a query');
    return tool.input;
  }

  function validateSpec(spec, db) {
    if (!spec || typeof spec.from !== 'string' || !db.nodesByType[spec.from])
      throw new Error('invalid "from": ' + (spec && spec.from));
    return spec;
  }

  async function narrate(question, spec, result, purpose, key) {
    var facts = { rows: result.rows.slice(0, 80),
                  refusals: result.trace.length,
                  refusal_reasons: result.trace.reduce(function (a, t) {
                    a[t.reason] = (a[t.reason] || 0) + 1; return a; }, {}) };
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key,
        'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 600,
        system: 'Answer the question in 1-3 sentences using ONLY these engine results. '
          + 'Never invent numbers. If refusals occurred, state that some records were '
          + 'withheld under the "' + purpose + '" purpose and why.',
        messages: [{ role: 'user', content: 'Q: ' + question + '\nRESULTS: ' + JSON.stringify(facts) }] })
    });
    if (!res.ok) throw new Error('narrate failed: ' + res.status);
    var data = await res.json();
    var block = (data.content || []).find(function (b) { return b.type === 'text'; });
    return block ? block.text : '';
  }

  $('ask').addEventListener('click', async function () {
    var purpose = $('purpose').value, key = $('key').value.trim(), question = $('q').value.trim();
    if (!key) { $('status').textContent = 'enter an API key'; return; }
    if (!question) { $('status').textContent = 'type a question'; return; }
    $('status').textContent = 'translating…';
    try {
      var spec = validateSpec(await translate(question, db, purpose, key), db);
      var result = window.FFEngine.runSpec(spec, db, purpose);
      $('status').textContent = 'answering…';
      var narrative = await narrate(question, spec, result, purpose, key);
      renderResult(spec, result, narrative);
      $('status').textContent = '';
    } catch (e) { $('status').textContent = String(e.message); }
  });

  window.FFApp = { db: db, renderResult: renderResult, esc: esc,
                   edgeDirectory: edgeDirectory, systemPrompt: systemPrompt,
                   validateSpec: validateSpec, SPEC_TOOL: SPEC_TOOL, narrate: narrate };
})();
