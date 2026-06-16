'use strict';
(function () {
  var db = window.FFEngine.buildDb(window.FF_GRAPH);
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g,
    function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' })[c]; }); }

  var ROLES = window.FFRoles.ROLES;
  var ALL_SCOPES = window.FFRoles.ALL_SCOPES;
  var SCOPE_LABEL = { 'hr.scheduling': 'scheduling', 'hr.payroll': 'compensation',
    'hr.certifications': 'compliance', 'hr.employment': 'employment' };

  function currentRole() { return ROLES[$('role').value]; }

  function renderPermPanel() {
    var role = currentRole();
    var pop = window.FFEngine.computePopulation(role, db);
    var total = db.nodesByType.person.length;
    var seen = pop.all ? total : pop.set.size;
    var sens = role.scopes.map(function (s) { return SCOPE_LABEL[s]; });
    var hidden = ALL_SCOPES.filter(function (s) { return role.scopes.indexOf(s) === -1; })
      .map(function (s) { return SCOPE_LABEL[s]; });
    var who = pop.all ? 'everyone (' + total + ')'
      : (role.population.type === 'self' ? 'just yourself (1)' : 'your population (' + seen + ' of ' + total + ')');
    var anchorTitle = role.anchor ? (db.idToTitle[role.anchor] || role.anchor) : null;
    var anchor = anchorTitle ? (anchorTitle + ' (' + role.anchorDesc + ')') : role.anchorDesc;
    var html = '<strong>Viewing as ' + esc(role.label) + '</strong> — ' + esc(anchor);
    html += '<br><strong>Sees:</strong> directory for <strong>everyone (' + total + ')</strong>';
    if (sens.length) html += '; ' + sens.map(esc).join(' · ') + ' for <strong>' + esc(who) + '</strong>';
    var bits = [];
    if (hidden.length) bits.push(hidden.map(esc).join(' · ') + ' (not permitted for this role)');
    if (!pop.all && sens.length) bits.push('sensitive data for everyone outside your population (' + (total - seen) + ')');
    html += '<br><span class="redacted"><strong>Hidden:</strong> ' + (bits.length ? bits.join(' · ') : 'nothing') + '</span>';
    $('permpanel').innerHTML = html;
  }

  function renderResult(spec, result, narrative) {
    var html = '';
    if (narrative) html += '<div class="panel"><p>' + esc(narrative) + '</p></div>';
    html += '<div class="panel">';
    var shown = result.rows.slice(0, 50);
    var cols = shown.length ? Object.keys(shown[0]) : [];
    html += '<table><caption>Result — ' + result.rows.length + ' row' +
            (result.rows.length === 1 ? '' : 's') +
            (result.rows.length > 50 ? ' (showing first 50)' : '') + '</caption>';
    if (cols.length) {
      html += '<thead><tr>' + cols.map(function (c) {
        return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead>';
    }
    html += '<tbody>';
    shown.forEach(function (r) {
      html += '<tr>' + Object.keys(r).map(function (k) {
        var v = r[k];
        if (v === null) return '<td class="redacted">redacted</td>';
        if (Array.isArray(v)) v = v.length;
        return '<td>' + esc(v) + '</td>';
      }).join('') + '</tr>';
    });
    html += '</tbody></table></div>';
    if (result.trace.length) {
      var groups = { access: {}, consent: {} };
      result.trace.forEach(function (t) {
        var layer = t.layer || 'consent';
        var key = t.reason + (t.field && t.field !== '(record)' && t.scope ? ' (' + t.field + ')' : '');
        groups[layer][key] = (groups[layer][key] || 0) + 1;
      });
      html += '<div class="panel trace"><strong>Governance trace</strong>';
      ['access', 'consent'].forEach(function (layer) {
        var keys = Object.keys(groups[layer]);
        if (!keys.length) return;
        html += '<div><em>' + layer + '</em><ul>' + keys.map(function (k) {
          return '<li><span class="badge">' + esc(k) + '</span> ' + groups[layer][k] + ' refusal(s)</li>';
        }).join('') + '</ul></div>';
      });
      html += '</div>';
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

  function systemPrompt(db, purpose, role) {
    var viewer;
    if (role && role.anchor) {
      var vt = db.idToTitle[role.anchor] || role.anchor;
      var vp = (db.nodesByTitle[vt] && db.nodesByTitle[vt].props) || {};
      viewer = 'You are answering AS this employee: ' + vt + ' (id ' + role.anchor + ', '
        + role.anchorDesc + '). First-person words ("I", "me", "my") refer to THIS person — '
        + 'filter by their id: {from:"person", filters:[{field:"id", op:"eq", value:"'
        + role.anchor + '"}], ...}. '
        + 'Your directory context: works_at="' + (vp.works_at || '') + '", in_department="'
        + (vp.in_department || '') + '", position="' + (vp.position || '') + '", reports_to="'
        + (vp.reports_to || '') + '". So "my team" / "my store" = {from:"person", filters:['
        + '{field:"works_at", op:"eq", value:"' + (vp.works_at || '') + '"}]}; "my department" '
        + 'filters in_department="' + (vp.in_department || '') + '"; "my manager / who do I report '
        + 'to" = reports_to ("' + (vp.reports_to || '') + '").';
    } else {
      viewer = 'You are an org-wide viewer (role ' + (role ? role.label : 'none')
        + '); there is no single "me".';
    }
    return [
      'You translate an HCM question into ONE run_query tool call over a graph.',
      viewer,
      'Node types: ' + Object.keys(db.nodesByType).join(', ') + '.',
      'Edge directory (fromType -> {verb: toType}): ' + JSON.stringify(edgeDirectory(db)) + '.',
      'Person props you may filter/select: title, name, status, employment_type,',
      'hire_date, position, works_at, in_department, reports_to, skills, pay_rate, pay_unit.',
      'reports_to / works_at / in_department / position are DIRECTORY fields on the person’s',
      'own record (directory is visible for everyone): for "who do I report to / who is my',
      'manager" select reports_to (or traverse reports_to direction:"out"); for "where do I',
      'work" select works_at.',
      'pay_rate has a companion pay_unit (year vs hour) — do NOT average pay_rate across mixed',
      'units; restrict to one position (e.g. Server) or note the caveat. Reverse traversals use',
      'direction:"in" on the verb that points at the person (e.g. time_off_request/',
      'performance_review/employment_event link a person via verb "person").',
      'The active purpose is "' + purpose + '". Do NOT try to bypass governance;',
      'the engine enforces it. Always answer with exactly one run_query tool call.'
    ].join(' ');
  }

  async function translate(question, db, purpose, key, role) {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key,
        'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024,
        system: systemPrompt(db, purpose, role), tools: [SPEC_TOOL],
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

  async function translateValid(question, db, purpose, key, role) {
    for (var attempt = 0; attempt < 2; attempt++) {
      try { return validateSpec(await translate(question, db, purpose, key, role), db); }
      catch (e) { if (attempt === 1) throw e; }
    }
  }

  // ── API key: stored in sessionStorage, surfaced through a key icon + existence badge ──
  var KEY_STORAGE = 'ff_anthropic_key';
  function getKey() { return ($('key').value || '').trim(); }

  function updateKeyBadge() {
    var has = !!getKey();
    $('keybtn').setAttribute('data-haskey', has ? 'yes' : 'no');
    $('keystate').textContent = has
      ? 'API key saved. Activate to edit or clear.'
      : 'API key not set. Activate to add one.';
  }
  function loadKey() {
    try { $('key').value = window.sessionStorage.getItem(KEY_STORAGE) || ''; } catch (e) {}
    updateKeyBadge();
  }
  function saveKey() {
    try { window.sessionStorage.setItem(KEY_STORAGE, getKey()); } catch (e) {}
    updateKeyBadge(); closeKeyPop();
    $('status').textContent = getKey() ? 'API key saved in this browser.' : 'API key empty.';
  }
  function clearKey() {
    try { window.sessionStorage.removeItem(KEY_STORAGE); } catch (e) {}
    $('key').value = ''; updateKeyBadge();
    $('status').textContent = 'API key cleared.';
  }
  function openKeyPop() {
    $('keypop').hidden = false; $('keybtn').setAttribute('aria-expanded', 'true');
    $('key').focus();
  }
  function closeKeyPop(returnFocus) {
    $('keypop').hidden = true; $('keybtn').setAttribute('aria-expanded', 'false');
    if (returnFocus) $('keybtn').focus();
  }
  $('keybtn').addEventListener('click', function () {
    if ($('keypop').hidden) openKeyPop(); else closeKeyPop(true);
  });
  $('keysave').addEventListener('click', saveKey);
  $('keyclear').addEventListener('click', clearKey);
  $('keypop').addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.stopPropagation(); closeKeyPop(true); }
  });
  document.addEventListener('click', function (e) {
    var wrap = $('keybtn').parentNode;
    if (!$('keypop').hidden && !wrap.contains(e.target)) closeKeyPop(false);
  });

  async function runAsk() {
    var purpose = $('purpose').value, key = getKey(), question = $('q').value.trim();
    if (!key) { $('status').textContent = 'Add your Anthropic API key first (the 🔑 button).'; openKeyPop(); return; }
    if (!question) { $('status').textContent = 'Type a question.'; $('q').focus(); return; }
    $('status').textContent = 'Translating…';
    try {
      var spec = await translateValid(question, db, purpose, key, currentRole());
      var result = window.FFEngine.runSpec(spec, db, purpose, currentRole());
      $('status').textContent = 'Answering…';
      var narrative = await narrate(question, spec, result, purpose, key);
      renderResult(spec, result, narrative);
      $('status').textContent = '';
    } catch (e) { $('status').textContent = String(e.message); }
  }
  $('qform').addEventListener('submit', function (e) { e.preventDefault(); runAsk(); });

  $('role').addEventListener('change', renderPermPanel);
  renderPermPanel();
  loadKey();

  window.FFApp = { db: db, renderResult: renderResult, esc: esc,
                   edgeDirectory: edgeDirectory, systemPrompt: systemPrompt,
                   validateSpec: validateSpec, SPEC_TOOL: SPEC_TOOL, narrate: narrate,
                   translateValid: translateValid, currentRole: currentRole,
                   renderPermPanel: renderPermPanel, getKey: getKey,
                   updateKeyBadge: updateKeyBadge, runAsk: runAsk };
})();
