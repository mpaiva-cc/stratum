'use strict';
(function () {
  var db = window.FFEngine.buildDb(window.FF_GRAPH);
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g,
    function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' })[c]; }); }
  function escAttr(s) { return String(s == null ? '' : s).replace(/[&<>"]/g,
    function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]; }); }

  // Render a value: if it is a person's title, make it a profile link; otherwise plain text.
  function personLink(title) {
    var n = db.nodesByTitle[title];
    if (n && n.type === 'person')
      return '<button type="button" class="namelink" data-person="' + escAttr(title) + '">'
        + esc(title) + '</button>';
    return esc(title);
  }

  var ROLES = window.FFRoles.ROLES;
  var ALL_SCOPES = window.FFRoles.ALL_SCOPES;
  var SCOPE_LABEL = { 'hr.scheduling': 'scheduling', 'hr.payroll': 'compensation',
    'hr.certifications': 'compliance', 'hr.employment': 'employment' };

  // Active viewing identity: a fixed persona, or a dynamic "impersonate this employee" role.
  var impersonated = null;
  function currentRole() {
    if (impersonated && $('role').value === '__imp') return impersonated;
    return ROLES[$('role').value];
  }

  // Impersonate a specific employee: self-service view (directory company-wide, like all
  // roles; sensitive = their own data, plus their reports' if they manage anyone).
  function setImpersonation(title) {
    var n = db.nodesByTitle[title];
    if (!n || n.type !== 'person') return;
    var id = n.props.id || title.split(' ')[0];
    var reports = (db.rev['reports_to'] && db.rev['reports_to'][title]) || [];
    var store = (n.props.works_at || '').replace(/ - .*/, '');
    impersonated = {
      id: '__imp', label: (n.props.name || title), anchor: id,
      anchorDesc: (n.props.position || 'employee') + (store ? ' · ' + store : ''),
      population: reports.length ? { type: 'subtree', value: id } : { type: 'self', value: id },
      scopes: ALL_SCOPES.slice()
    };
    var sel = $('role'), opt = sel.querySelector('option[value="__imp"]');
    if (!opt) { opt = document.createElement('option'); opt.value = '__imp'; sel.appendChild(opt); }
    opt.textContent = 'Impersonating: ' + impersonated.label;
    sel.value = '__imp';
    renderPermPanel();
    var pop = window.FFEngine.computePopulation(impersonated, db);
    var seen = pop.all ? db.nodesByType.person.length : pop.set.size;
    $('status').textContent = 'Now impersonating ' + impersonated.label
      + ' — sees sensitive data for ' + seen + (seen > 1 ? ' people (self + reports)' : ' (self only)')
      + '. Ask a question.';
  }

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
    var anchorHtml = anchorTitle
      ? (personLink(anchorTitle) + ' (' + esc(role.anchorDesc) + ')')
      : esc(role.anchorDesc);
    var html = '<strong>Viewing as ' + esc(role.label) + '</strong> — ' + anchorHtml;
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
    // Column set = union of keys, dropping columns that are empty for EVERY row
    // (e.g. dotted neighbour fields the engine can't project). null = redacted, kept.
    var keep = function (v) {
      return !(v === undefined || v === '' || (Array.isArray(v) && v.length === 0));
    };
    var seenCols = {}, cols = [];
    shown.forEach(function (r) { Object.keys(r).forEach(function (k) {
      if (!(k in seenCols)) { seenCols[k] = true; cols.push(k); } }); });
    cols = cols.filter(function (c) { return shown.some(function (r) { return keep(r[c]); }); });
    var cell = function (v) {
      if (v === null) return '<td class="redacted">redacted</td>';
      if (v === undefined || v === '') return '<td>—</td>';
      if (Array.isArray(v)) {
        if (!v.length) return '<td>—</td>';
        return '<td><ul class="cells">' + v.slice(0, 12).map(function (x) {
          return '<li>' + personLink(x) + '</li>'; }).join('')
          + (v.length > 12 ? '<li class="muted">+' + (v.length - 12) + ' more</li>' : '')
          + '</ul></td>';
      }
      return '<td>' + personLink(v) + '</td>';
    };
    html += '<table><caption>Result — ' + result.rows.length + ' row' +
            (result.rows.length === 1 ? '' : 's') +
            (result.rows.length > 50 ? ' (showing first 50)' : '') + '</caption>';
    if (cols.length) {
      html += '<thead><tr>' + cols.map(function (c) {
        return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead>';
    }
    html += '<tbody>';
    shown.forEach(function (r) {
      html += '<tr>' + cols.map(function (c) { return cell(r[c]); }).join('') + '</tr>';
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
        + 'to" = reports_to ("' + (vp.reports_to || '') + '"). '
        + 'For SCHEDULE questions ("which days/shifts do I work", "my schedule", "am I working '
        + 'Friday"): anchor from:"shift" so each shift is its OWN row — '
        + '{from:"shift", filters:[{field:"crew", op:"contains", value:"' + vt + '"}], '
        + 'select:["date","daypart","start","end","store"]}. (The sampled week is '
        + '2026-06-08 to 2026-06-14.)';
    } else {
      viewer = 'You are an org-wide viewer (role ' + (role ? role.label : 'none')
        + '); there is no single "me".';
    }
    return [
      'You translate an HCM question into ONE run_query tool call over a graph.',
      viewer,
      'Node types: ' + Object.keys(db.nodesByType).join(', ') + '.',
      'Edge directory (fromType -> {verb: toType}): ' + JSON.stringify(edgeDirectory(db)) + '.',
      'SELECT only lists fields of the FROM node type. A traverse hop returns the related',
      'nodes’ titles under its "as" name — you CANNOT select sub-fields of a neighbour',
      '(no dotted names like "shifts.date"). To show a record’s own fields as columns,',
      'anchor FROM that record type instead of traversing to it.',
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

  var SCOPE_TO_PURPOSE = { 'hr.scheduling': 'scheduling', 'hr.payroll': 'payroll',
    'hr.certifications': 'compliance', 'hr.employment': 'employment' };

  async function narrate(question, spec, result, purpose, key) {
    // Summarise WHICH fields were withheld and how to unlock them (distinct by field+reason).
    var withheld = {}, seen = {};
    result.trace.forEach(function (t) {
      var k = (t.field || '?') + '|' + t.reason;
      if (seen[k]) return; seen[k] = 1;
      withheld[t.field || '?'] = { reason: t.reason, layer: t.layer,
        unlock_purpose: (t.reason === 'out-of-purpose' && t.scope) ? SCOPE_TO_PURPOSE[t.scope] : null };
    });
    var facts = { rows: result.rows.slice(0, 80), refusals: result.trace.length, withheld: withheld };
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key,
        'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 600,
        system: 'Answer the question in 1-3 sentences using ONLY these engine results. '
          + 'Never invent numbers. The active purpose is "' + purpose + '". '
          + 'IMPORTANT: a null field that appears in "withheld" was BLOCKED by governance — '
          + 'it is NOT missing or absent; never say the record "does not contain" it. '
          + 'Explain it was withheld and why: for reason "out-of-purpose" tell the user to set '
          + 'the Purpose selector to the field\'s unlock_purpose (e.g. switch Purpose to '
          + '"payroll" to see pay); for "role-restricted" say their role isn\'t permitted that '
          + 'data class; for "no-grant"/"revoked"/"expired" say the person hasn\'t granted '
          + '(or revoked/expired) consent; for "out-of-population" say it\'s outside who they may see.',
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

  $('role').addEventListener('change', function () {
    if ($('role').value !== '__imp') {
      impersonated = null;
      var o = $('role').querySelector('option[value="__imp"]');
      if (o) o.remove();
    }
    renderPermPanel();
  });
  renderPermPanel();
  loadKey();

  // ── Person profile drawer (governance-aware: same gates as the rest of the app) ──
  var drawerReturnFocus = null;

  function fieldRow(dt, ddHtml) { return '<dt>' + esc(dt) + '</dt><dd>' + ddHtml + '</dd>'; }

  // Render a sensitive value through the engine gate so the drawer matches the panel exactly.
  function gatedRow(label, subjectTitle, scope, rawVal, role, purpose, pop) {
    var v = window.FFEngine.readField(subjectTitle, scope, db, purpose, role, pop);
    if (v.ok) return fieldRow(label, esc(rawVal == null || rawVal === '' ? '—' : rawVal));
    return fieldRow(label, '<span class="hiddenval">hidden — ' + esc(v.layer) + ': '
      + esc(v.reason) + '</span>');
  }

  function buildProfile(node) {
    var p = node.props || {};
    var html = '<h2 id="drawerName">' + esc(p.name || node.title) + '</h2>';
    html += '<p class="muted">' + esc(node.type) + (node.id ? ' · ' + esc(node.id) : '') + '</p>';
    if (node.type !== 'person') {
      html += '<dl>';
      Object.keys(p).forEach(function (k) {
        if (Array.isArray(p[k])) html += fieldRow(k, p[k].map(personLink).join(', '));
        else html += fieldRow(k, personLink(p[k]));
      });
      return html + '</dl>';
    }
    html += '<p><button type="button" class="btn imp-btn" data-person="' + escAttr(node.title)
      + '">Impersonate ' + esc(p.name || node.title) + '</button></p>';
    var role = currentRole(), purpose = $('purpose').value;
    var pop = window.FFEngine.computePopulation(role, db);
    // Directory (always visible)
    html += '<dl>';
    html += fieldRow('Status', esc((p.status || '—') + (p.status_reason ? ' (' + p.status_reason + ')' : '')));
    html += fieldRow('Position', esc(p.position || '—'));
    html += fieldRow('Store', esc(p.works_at || '—'));
    html += fieldRow('Department', esc(p.in_department || '—'));
    html += fieldRow('Employment', esc(p.employment_type || '—'));
    html += fieldRow('Hired', esc(p.hire_date || '—'));
    html += fieldRow('Reports to', p.reports_to ? personLink(p.reports_to) : '—');
    html += '</dl>';
    if (p.skills && p.skills.length)
      html += '<div class="sect"><strong>Skills</strong> <span class="muted">(directory)</span><div>'
        + p.skills.map(esc).join(' · ') + '</div></div>';
    var reports = (db.rev['reports_to'] && db.rev['reports_to'][node.title]) || [];
    if (reports.length)
      html += '<div class="sect"><strong>Direct reports (' + reports.length + ')</strong><div>'
        + reports.slice(0, 12).map(personLink).join('<br>')
        + (reports.length > 12 ? '<br>+' + (reports.length - 12) + ' more' : '') + '</div></div>';
    // Sensitive sections — gated identically to the engine
    html += '<div class="sect"><strong>Compensation</strong><dl>'
      + gatedRow('Pay', node.title, 'hr.payroll',
          (p.pay_rate != null ? p.pay_rate + ' / ' + (p.pay_unit || '') : '—'), role, purpose, pop)
      + '</dl></div>';
    html += '<div class="sect"><strong>Compliance</strong><dl>'
      + gatedRow('Certifications', node.title, 'hr.certifications',
          (p.certifications && p.certifications.length ? p.certifications.join(', ') : 'none'),
          role, purpose, pop)
      + '</dl></div>';
    return html;
  }

  function openDrawer(title, trigger) {
    var node = db.nodesByTitle[title];
    if (!node) return;
    if ($('drawer').hidden) drawerReturnFocus = trigger || document.activeElement;
    $('drawerBody').innerHTML = buildProfile(node);
    $('drawerBackdrop').hidden = false;
    $('drawer').hidden = false;
    $('drawerClose').focus();
  }
  function closeDrawer() {
    $('drawer').hidden = true;
    $('drawerBackdrop').hidden = true;
    if (drawerReturnFocus && drawerReturnFocus.focus) drawerReturnFocus.focus();
  }
  $('drawerClose').addEventListener('click', closeDrawer);
  $('drawerBackdrop').addEventListener('click', closeDrawer);
  $('drawer').addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeDrawer(); return; }
    if (e.key !== 'Tab') return;
    var f = $('drawer').querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('click', function (e) {
    var imp = e.target.closest && e.target.closest('.imp-btn');
    if (imp && imp.getAttribute('data-person')) {
      e.preventDefault(); setImpersonation(imp.getAttribute('data-person')); closeDrawer(); return;
    }
    var b = e.target.closest && e.target.closest('.namelink');
    if (b && b.getAttribute('data-person')) { e.preventDefault(); openDrawer(b.getAttribute('data-person'), b); }
  });

  window.FFApp = { db: db, renderResult: renderResult, esc: esc, personLink: personLink,
                   openDrawer: openDrawer, closeDrawer: closeDrawer, setImpersonation: setImpersonation,
                   edgeDirectory: edgeDirectory, systemPrompt: systemPrompt,
                   validateSpec: validateSpec, SPEC_TOOL: SPEC_TOOL, narrate: narrate,
                   translateValid: translateValid, currentRole: currentRole,
                   renderPermPanel: renderPermPanel, getKey: getKey,
                   updateKeyBadge: updateKeyBadge, runAsk: runAsk };
})();
