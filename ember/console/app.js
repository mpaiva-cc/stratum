/* ============================================================
   Stratum · Ember — Console (prototype)
   Vanilla JS SPA. Synthetic data. No build step, no framework.
   Mirrors the /recruiter/console architecture (state + switchView +
   render* per view). Built to the corrected PLN-2026-004:
   no per-search credits, agent-proposes (no rule-builder), and it
   includes the two v1 gaps added from evaluation feedback —
   operator permissions and deliverability.
   ============================================================ */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

  /* ── state ── */
  const state = { view: 'pools', role: 'sourcer' };
  const local = { previewed: false, sent: false, redisOpen: false, proposed: false, cand: 'dana', revoked: {}, rankResults: null, agentRan: false,
    alerts: [
      { id:'a-488', req:'REQ-2026-0488', title:'Sr Platform Engineer',     dept:'Engineering',     opened:'just now',  matches:3, unread:true },
      { id:'a-471', req:'REQ-2026-0471', title:'Data Engineer',            dept:'Data',            opened:'2h ago',    matches:5, unread:true },
      { id:'a-466', req:'REQ-2026-0466', title:'Site Reliability Engineer', dept:'Infrastructure',  opened:'yesterday', matches:2, unread:false },
    ],
    subs: { 'Platform Engineering': true, 'Backend': true, 'Data': true, 'Clinical team': false },
  };

  /* ── data: Cordova's pool (same cast as the tour) ── */
  const POOL = [
    { id:'elena',  initials:'EV', name:'Elena Vega',   role:'Sr Platform Engineer',         last:'Final round · Nov 2024',
      consent:{ scope:'role-outreach', juris:'US', valid:true }, dedup:null, matched:true,  status:'warm',
      redis:{ score:'0.91', why:'final round Nov 2024 · consented · skills match' },
      held:{ since:'2024-11', contact:'2026-02', resume:'v2024-10', note:'Backend/Platform · reached final round' } },
    { id:'marcus', initials:'MB', name:'Marcus Bell',  role:'Backend Engineer',             last:'Final round · Mar 2025',
      consent:{ scope:'role-outreach', juris:'US', valid:true }, dedup:'same node across job change (Acme → Northwind)', matched:false, status:'warm',
      redis:{ score:'0.84', why:'adjacent role + consented · now at Northwind' },
      held:{ since:'2025-03', contact:'2025-11', resume:'v2025-02', note:'Backend · final round, role closed' } },
    { id:'renata', initials:'RS', name:'Renata Silva', role:'Backend Engineer',             last:'Referral · 2025',
      consent:{ scope:'role-outreach', juris:'US', valid:true }, dedup:'referral + past applicant → 1 node (was 2)', matched:false, status:'warm',
      redis:{ score:'0.80', why:'referral signal + skills · consented' },
      held:{ since:'2025-06', contact:'2026-01', resume:'v2025-06', note:'Referral by employee + prior applicant' } },
    { id:'dana',   initials:'DO', name:'Dana Okafor',  role:'Backend · declined 2024 (role filled)', last:'Past applicant · 2024',
      consent:{ scope:'stay-in-touch', juris:'US', valid:true }, dedup:null, matched:false, status:'in pool',
      redis:null,
      held:{ since:'2024-08', contact:'2026-02', resume:'v2024-07', note:'Backend, 2024 · declined: role filled' } },
    { id:'tomas',  initials:'TV', name:'Tomas Vrba',   role:'Platform Engineer · Munich',   last:'Event check-in · 2025',
      consent:{ scope:'event-followup', juris:'EU', valid:false }, dedup:null, matched:false, status:'in pool',
      redis:null, block:'consent: event-followup/EU ⊅ role-outreach/US',
      held:{ since:'2025-09', contact:'2025-09', resume:'—', note:'Event check-in, Munich · event follow-up only' } },
  ];
  const byId = (id) => POOL.find(p => p.id === id);
  const CAMPAIGN = { audience: ['elena','marcus','renata','tomas'], purpose:'Role outreach · Platform · Q3' };

  /* ── roles / operator permissions ── */
  const ROLES = {
    sourcer:  { name:'Sourcer',           av:'DC', who:'Devin Cho',  can:{ view:1, campaign:1, rediscover:1, export:1, permissions:0 } },
    clinical: { name:'Clinical Recruiter',av:'JM', who:'Jess Monroe',can:{ view:1, campaign:0, rediscover:0, export:0, permissions:0 } },
    admin:    { name:'Admin',             av:'AB', who:'Aisha Bhatt',can:{ view:1, campaign:1, rediscover:1, export:1, permissions:1 } },
  };
  const can = (a) => !!ROLES[state.role].can[a];

  /* ── chrome helpers ── */
  function toast(msg, kind) {
    const t = $('#toast');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.innerHTML = msg;
    requestAnimationFrame(() => t.classList.add('is-show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('is-show'), 3200);
  }
  /* ── agent presence: the AI made visible ── */
  function setAgent(st, msg) {
    const el = $('#agent-status'); if (!el) return;
    el.dataset.state = st;
    const l = $('#agent-status-label'); if (l) l.textContent = st === 'working' ? ('Ember · ' + msg + '…') : 'Ember agent · ready';
  }
  function thinkingHTML(msg) {
    return `<div class="thinking"><span class="agent-chip"><span class="spark">✦</span> Ember</span><span class="thinking-msg">${esc(msg)}<span class="dots"><i></i><i></i><i></i></span></span></div>`;
  }
  // Show a brief "agent is working" beat in `slot`, then run `done` (which renders the result).
  function agentWork(msg, slot, done, delay) {
    setAgent('working', msg);
    if (slot) slot.innerHTML = `<div class="card"><div class="card-pad">${thinkingHTML(msg)}</div></div>`;
    setTimeout(() => { setAgent('idle'); done(); }, delay || 720);
  }
  const SPARK = '<span class="agent-chip"><span class="spark">✦</span> Ember</span>';

  // Stream text into an element token-by-token, like a model generating. Reduced-motion → instant.
  function streamText(el, text, opts) {
    opts = opts || {};
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return new Promise((resolve) => {
      if (!el) { resolve(); return; }
      if (reduce) { el.textContent = text; resolve(); return; }
      el.textContent = ''; el.classList.add('streaming');
      const toks = text.match(/\S+\s*|\s+/g) || [text];
      let i = 0; const speed = opts.speed || 22;
      const step = () => {
        if (i >= toks.length) { el.classList.remove('streaming'); resolve(); return; }
        el.textContent += toks[i++];
        setTimeout(step, speed);
      };
      setTimeout(step, speed);
    });
  }
  async function streamLines(container, lines, opts) {
    if (!container) return;
    for (const line of lines) {
      const d = document.createElement('div'); d.className = 'stream-line';
      container.appendChild(d);
      await streamText(d, line, opts);
    }
  }

  function updateRt() {
    const el = $('.rt-stamp'); if (!el) return;
    const t0 = new Date(el.getAttribute('data-t0')).getTime();
    const now = Date.now();
    const days = Math.floor((now - t0) / 86400000);
    const tt = $('#rt-time'); if (tt) tt.textContent = 'T+' + days + 'd';
    const iso = $('#rt-iso'); if (iso) iso.textContent = new Date(now).toISOString().slice(0, 10);
  }
  function updateUser() {
    const r = ROLES[state.role];
    $('#user-avatar').textContent = r.av;
    $('#user-name').childNodes[0].nodeValue = r.who;
    $('#user-role').textContent = '· ' + r.name;
  }

  /* ── consent badge ── */
  function consentBadge(p) {
    if (p.consent.valid) return `<span class="badge ok">consent ✓ ${esc(p.consent.scope)} · ${esc(p.consent.juris)}</span>`;
    return `<span class="badge block">${esc(p.consent.scope)} · ${esc(p.consent.juris)}</span>`;
  }

  /* ════════════════════════ VIEWS ════════════════════════ */

  function poolsHTML() {
    const rows = POOL.map(p => `
      <tr class="row-link" data-cand="${p.id}">
        <td><div class="cell-name">${esc(p.name)}</div><div class="cell-sub">${esc(p.role)}</div></td>
        <td>${esc(p.last)}</td>
        <td>${p.dedup ? `<span class="badge info">${esc(p.dedup)}</span>` : '<span class="cell-sub">—</span>'}</td>
        <td>${consentBadge(p)}</td>
        <td>${p.matched ? '<span class="badge warm">matched · REQ-0488</span>' : `<span class="badge muted">${esc(p.status)}</span>`}</td>
      </tr>`).join('');
    return `
      <div class="view-head">
        <div class="view-rail">Pools · live query</div>
        <h2 class="view-h">A pool is a <em>live query</em>, not a list.</h2>
        <p class="view-dek">Identities are reconciled continuously across Cordova's ATS, HRIS, and directory (entity resolution at <strong>τ = 0.93</strong>). Most of a pool is people who are <strong>not in any requisition</strong> today — that's the ordinary, honest state.</p>
        <div class="chip-row">
          <span class="chip live">Final-round Platform / Backend · last 18mo</span>
          <span class="chip accent">1,240 people · 38 final-round</span>
          <span class="chip">0 stale snapshots</span>
          <span class="chip">search &amp; dedup · free · no credits</span>
          <span class="agent-chip"><span class="spark">✦</span> Ember resolving live</span>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">Members · identity-resolved</span><span class="card-title">click a row → candidate view</span></div>
        <div class="card-pad" style="padding-top:.4rem;padding-bottom:.4rem">
          <table class="tbl">
            <thead><tr><th>Person</th><th>Last touch</th><th>Identity</th><th>Consent</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }
  function afterPools() {
    $$('#view .row-link').forEach(tr => tr.addEventListener('click', () => {
      local.cand = tr.dataset.cand; state.view = 'candidate'; render();
    }));
  }

  function nurtureHTML() {
    const locked = !can('campaign');
    let right;
    if (!local.previewed) {
      right = `<div class="card"><div class="card-pad"><div class="empty">Preview the traversal to see the per-edge consent check.<br>A send can only cross an edge whose consent covers the campaign's purpose &amp; jurisdiction.</div></div></div>`;
    } else {
      const edges = CAMPAIGN.audience.map(id => {
        const p = byId(id);
        const ok = p.consent.valid;
        const st = local.sent ? (ok ? '<span class="st" style="color:var(--moss-deep)">sent</span>' : '<span class="st" style="color:var(--plum)">held</span>')
                              : (ok ? '<span class="st" style="color:var(--ink-mute)">queued</span>' : '<span class="st" style="color:var(--plum)">blocked</span>');
        const mk = local.sent && ok ? 'sent' : (ok ? 'ok' : 'block');
        const sym = local.sent && ok ? '✓' : (ok ? '✓' : '⊘');
        return `
          <li class="edge ${ok ? '' : 'is-blocked'}">
            <span class="mk ${mk}">${sym}</span>
            <span><span class="who">${esc(p.name)}</span><span class="meta">${ok ? `edge: ${esc(p.consent.scope)} · ${esc(p.consent.juris)} · valid` : esc(p.block || (p.consent.scope + '/' + p.consent.juris + ' ⊅ role-outreach/US'))}${ok ? '' : ' · cannot send'}</span></span>
            ${st}
          </li>`;
      }).join('');
      right = `
        <div class="card"><div class="card-pad">
          <div class="traversal-meta"><span><b>Purpose</b> ${esc(CAMPAIGN.purpose)}</span><span><b>Reach</b> 4 nodes</span></div>
          <ul class="edge-list">${edges}</ul>
          <div class="probe-gate">consent-validity probe <span class="badge ok">pass</span> · gates the campaign before a message leaves</div>
          <div class="logline">
            <p style="margin-bottom:.4rem">${SPARK} <span style="color:var(--ink-3-aaa)">agent log</span></p>
            <p><span class="ts">traverse</span> expand campaign(purpose=role-outreach, juris=US) across pool edges</p>
            <p><span class="blk">stop</span> edge Vrba: consent=event-followup/EU ⊅ role-outreach/US · traversal cannot cross · 0 side effects</p>
            ${local.sent ? '<p><span class="ts">send</span> 3 valid sends dispatched · 1 held at edge</p>' : '<p><span class="ts">propose</span> 3 valid sends staged · send is a human action</p>'}
          </div>
        </div></div>`;
    }
    return `
      <div class="view-head">
        <div class="view-rail">Nurture · consent-native</div>
        <h2 class="view-h">Consent is an <em>edge</em>, not a checkbox.</h2>
        <p class="view-dek">A campaign is a graph traversal. A send with no consent edge covering its purpose and jurisdiction is <strong>structurally impossible</strong> — not blocked by a policy the agent was told to obey.</p>
      </div>
      <div class="split">
        <div class="card"><div class="card-pad">
          <div class="field"><label>Campaign</label><input type="text" id="camp-name" value="Platform Q3 · re-warm"${locked ? ' readonly' : ''}></div>
          <div class="field"><label>Audience</label><div class="readonly-chip">Final-round Platform/Backend pool · 4 in scope for this preview</div></div>
          <div class="field"><label>Purpose</label><div class="readonly-chip">${esc(CAMPAIGN.purpose)} · jurisdiction US</div></div>
          <div class="field"><label>Message · drafted by ${SPARK}</label><textarea id="camp-copy"${locked ? ' readonly' : ''}>When we last spoke the timing wasn't right. A role just opened that looks a lot more like the work you said you wanted — no pressure, want the details?</textarea></div>
          <div class="agent-hint"><span><span class="ah-tag">✦ Ember proposes</span> the audience and the copy — you review and send. <strong>No campaign rules to set up</strong>; there is no rule-builder to configure.</span></div>
          <div class="field"><label>Deliverability</label><div class="field-note">Sending domain <b>talent.cordova.example</b> · SPF/DKIM/DMARC ✓ · 2,000/day · <b>not routed through your Outlook</b></div></div>
          <div class="field"><label>Usage</label><div class="field-note">Metered only on <b>consented conversations</b> and <b>rediscovery-influenced hires</b> — no per-seat, <b>no per-search credits</b>, internal candidates never charged.</div></div>
          <div class="btn-row">
            <button class="btn ghost" id="btn-preview">Preview traversal</button>
            <button class="btn accent ${(!local.previewed || local.sent || locked) ? 'is-disabled' : ''}" id="btn-send" ${(!local.previewed || local.sent || locked) ? 'disabled' : ''}>${local.sent ? 'Sent · 3 of 4' : 'Send 3 queued'}</button>
            ${locked ? '<span class="perm-note">view-only — campaigns are restricted to sourcers &amp; admins</span>' : ''}
          </div>
        </div></div>
        <div id="nurture-result" style="min-width:0">${right}</div>
      </div>`;
  }
  function afterNurture() {
    const pv = $('#btn-preview'); if (pv) pv.addEventListener('click', () => {
      local.sent = false;
      agentWork('evaluating consent edges', $('#nurture-result'), () => { local.previewed = true; render(); toast('Traversal previewed · <span class="tk">1 send blocked at the consent edge</span>', 'block'); });
    });
    const sd = $('#btn-send'); if (sd && !sd.disabled) sd.addEventListener('click', () => { local.sent = true; render(); toast('3 consented sends dispatched · <span class="tk">Tomas Vrba held at the edge</span>'); });
  }

  /* ── Agent run · the consent-bounded tool-use loop (Phase 2) ── */
  function agentRunHTML() {
    const live = !!(window.EmberAgent && EmberAgent.hasKey());
    const locked = !can('campaign');
    const model = (window.EmberAgent && EmberAgent.MODEL) || 'claude-opus-4-8';
    const roster = POOL.map(p => `
      <li class="ar-cand">
        <span class="ar-name">${esc(p.name)}</span>
        <span class="ar-role">${esc(p.role)}</span>
        ${consentBadge(p)}
      </li>`).join('');
    let panel;
    if (!live) {
      panel = `<div class="card"><div class="card-pad"><div class="empty">Connect an Anthropic key (<b>Connect AI</b>, top right) to run the live agent.<br>The agent is given the pool and two tools — it stages outreach for the candidates it <em>can</em>, and the consent plane refuses the rest. Without a key this surface stays idle — there is no scripted stand-in for the loop; the refusal has to be real to mean anything.</div></div></div>`;
    } else if (locked) {
      panel = `<div class="card"><div class="card-pad"><div class="empty">Running the agent is a sourcer/admin action. You are signed in view-only.<br>Switch the role (top right) to <b>Sourcer</b> or <b>Admin</b> to run it.</div></div></div>`;
    } else {
      panel = `
        <div class="card"><div class="card-pad">
          <div class="ar-tools">
            <div class="ar-tool"><span class="ar-tool-k">tool</span> <code>check_consent</code><span class="ar-tool-d">read-only · returns the consent scope on file</span></div>
            <div class="ar-tool"><span class="ar-tool-k">tool</span> <code>stage_send</code><span class="ar-tool-d">guarded · <b>returns <code>is_error</code></b> for any send consent does not cover</span></div>
          </div>
          <div class="btn-row">
            <button class="btn accent" id="btn-run-agent">Run the nurture agent →</button>
            <span class="perm-note" style="color:var(--ink-mute)">${esc(model)} · stages only · a human approves every send</span>
          </div>
          <div class="run-log" id="run-log" aria-live="polite"></div>
        </div></div>`;
    }
    return `
      <div class="view-head">
        <div class="view-rail">Agent run · consent-bounded tool use</div>
        <h2 class="view-h">The agent works the whole pool — and the consent plane <em>refuses</em> what it must.</h2>
        <p class="view-dek">This is the live agentic loop. ${esc(model)} is handed the pool and two tools and told to stage outreach for <strong>every</strong> candidate — no pre-filtering. It has no authority to send: <code>stage_send</code> is a guarded tool that returns <code>is_error</code> for anyone whose consent does not cover role-outreach in the US. You watch the refusals fire in the run log — and the agent adapt. <strong>Two</strong> edges it cannot cross, failing two different ways: Dana Okafor (<em>stay-in-touch</em> — wrong scope) and Tomas Vrba (<em>event-followup / EU</em> — wrong jurisdiction).</p>
      </div>
      <div class="split ar-split">
        <div class="card"><div class="card-pad">
          <div class="field"><label>Pool · ${POOL.length} candidates · purpose role-outreach / US</label>
            <ul class="ar-roster">${roster}</ul>
          </div>
          <div class="agent-hint"><span><span class="ah-tag">✦ the moat, made provable</span> the consent edge is enforced at the <strong>tool boundary</strong>, not by asking the model nicely. Watch <code>stage_send</code> refuse Dana <em>and</em> Tomas — consent fails two ways (wrong scope, wrong jurisdiction) and the plane catches both.</span></div>
        </div></div>
        <div style="min-width:0">${panel}</div>
      </div>`;
  }
  function afterAgentRun() {
    const btn = $('#btn-run-agent'); if (!btn || btn.disabled) return;
    btn.addEventListener('click', async () => {
      const log = $('#run-log'); if (!log) return;
      log.innerHTML = '';
      btn.disabled = true; btn.classList.add('is-disabled'); btn.textContent = 'Working the pool…';
      setAgent('working', 'working the pool · ' + EmberAgent.MODEL);
      const append = (html) => {
        const wrap = document.createElement('div'); wrap.innerHTML = html.trim();
        const node = wrap.firstElementChild; if (node) { log.appendChild(node); node.scrollIntoView({ block: 'nearest' }); }
      };
      const restore = () => { setAgent('idle'); btn.disabled = false; btn.classList.remove('is-disabled'); btn.textContent = 'Run again →'; local.agentRan = true; };
      try {
        await EmberAgent.runNurtureAgent(POOL, (ev) => {
          if (ev.type === 'round') {
            if (ev.text) append(`<div class="run-think"><span class="rt-k">round ${ev.round} · ${esc(EmberAgent.MODEL)}</span> ${esc(ev.text)}</div>`);
          } else if (ev.type === 'tool') {
            if (ev.name === 'check_consent') {
              const r = ev.result || {};
              append(`<div class="run-tool"><span class="rt-meta">check_consent</span> <b>${esc(ev.input.candidate_id)}</b> → ${r.covers ? '<span class="ok">covers role-outreach/US</span>' : '<span class="blk">does not cover</span>'} <span class="rt-dim">(${esc(r.consent_scope || '?')} · ${esc(r.jurisdiction || '?')})</span></div>`);
            } else if (ev.name === 'stage_send') {
              const r = ev.result || {};
              if (r.is_error) append(`<div class="run-tool is-blocked"><span class="rt-meta">stage_send</span> <span class="blk">⊘ refused at the consent edge</span> — ${esc(r.content)}</div>`);
              else append(`<div class="run-tool"><span class="rt-meta">stage_send</span> <span class="ok">✓ staged</span> — ${esc(r.content)}</div>`);
            }
          } else if (ev.type === 'done') {
            append(`<div class="run-summary"><b>Run complete.</b> ${ev.staged.length} staged · ${ev.blocked.length} refused at the consent edge${ev.capped ? ' · stopped at the 5-round cap' : ''}. Nothing was sent — staging awaits a human.${ev.text ? `<div class="run-final">${esc(ev.text)}</div>` : ''}</div>`);
            restore();
          }
        });
      } catch (err) {
        append(`<div class="run-tool is-blocked">Live run failed — ${esc(String((err && err.message) || err))}. Check the key (Connect AI, top right) or your network.</div>`);
        restore();
      }
    });
  }

  function rediscoveryHTML() {
    if (!local.redisOpen) {
      return `
        <div class="view-head">
          <div class="view-rail">Rediscovery · lifecycle-triggered</div>
          <h2 class="view-h">The role you just posted <em>already has people</em> who said yes.</h2>
          <p class="view-dek">Rediscovery isn't a search you remember to run — it's triggered by the lifecycle event itself. Open a requisition and watch the graph surface the warm, consented people who fit.</p>
        </div>
        <div class="trigger-card">
          <div><div class="tc-k">Requisition · ready to open</div><div class="tc-v">REQ-2026-0488 · Sr Platform Engineer</div></div>
          <button class="btn accent ${can('rediscover') ? '' : 'is-disabled'}" id="btn-openreq" ${can('rediscover') ? '' : 'disabled'}>Open the requisition →</button>
        </div>
        ${can('rediscover') ? '' : '<p class="perm-note" style="margin-top:1rem">view-only — triggering rediscovery is restricted to sourcers &amp; admins</p>'}
        <div id="redis-result"></div>`;
    }
    const rr = local.rankResults;
    let order = ['elena','marcus','renata'];
    if (rr) order = order.slice().sort((a, b) => ((rr[b] && rr[b].score) || 0) - ((rr[a] && rr[a].score) || 0));
    const cards = order.map(id => {
      const p = byId(id);
      const live = rr && rr[id];
      const score = live ? Number(live.score).toFixed(2) : p.redis.score;
      const why = live ? live.reason : p.redis.why;
      return `
        <div class="match-card">
          <div class="mc-score">${esc(score)}<span>match</span></div>
          <div><div class="mc-name">${esc(p.name)}${live ? ` <span class="live-tag">${esc(EmberAgent.MODEL)} · re-ranked</span>` : ''}</div><div class="mc-why"><b>why:</b> ${esc(why)}</div></div>
          <button class="btn ghost btn-propose ${can('campaign') ? '' : 'is-disabled'}" data-id="${id}" ${can('campaign') ? '' : 'disabled'}>Propose outreach</button>
        </div>`;
    }).join('');
    return `
      <div class="view-head">
        <div class="view-rail">Rediscovery · REQ-2026-0488 opened</div>
        <h2 class="view-h">Three warm, consented matches — <em>cited, never scored</em>.</h2>
        <p class="view-dek">The nurture-fairness probe runs before any list is proposed. Every match shows <strong>why this person</strong> — attested reasoning, never a black-box score.</p>
        <div class="chip-row"><span class="agent-chip"><span class="spark">✦</span> surfaced by Ember</span><span class="chip"><span class="badge ok" style="border:0;padding:0">nurture-fairness probe · pass</span></span><span class="chip accent">3 rediscovered</span><span class="chip">rediscovery · free · pay only on influenced hires</span></div>
      </div>
      <p class="redis-flag">The role you just posted already has <em>three people</em> who said yes to staying in touch.</p>
      ${cards}
      <div id="propose-slot"></div>`;
  }
  function afterRediscovery() {
    const ob = $('#btn-openreq'); if (ob && !ob.disabled) ob.addEventListener('click', async () => {
      const slot = $('#redis-result');
      const finishOpen = () => {
        local.redisOpen = true; const rc = $('#ri-count-redis'); if (rc) rc.textContent = '3';
        const al = local.alerts.find(x => x.id === 'a-488'); if (al) al.unread = false; // the team's alert for this req is now seen
        render(); toast('REQ-2026-0488 opened · <span class="tk">subscribed teams notified · 3 consented matches</span>');
      };
      // ── LIVE path: a real Opus re-rank of the warm pool, grounded + cited ──
      if (window.EmberAgent && EmberAgent.hasKey()) {
        slot.innerHTML = `<div class="card"><div class="card-pad">${thinkingHTML('re-ranking the warm pool live · ' + EmberAgent.MODEL)}</div></div>`;
        setAgent('working', 're-ranking · ' + EmberAgent.MODEL);
        try {
          const cands = ['elena','marcus','renata'].map(byId);
          const rankings = await EmberAgent.rankCandidates(cands, { id:'REQ-2026-0488', title:'Senior Platform Engineer', dept:'Engineering' });
          local.rankResults = {}; rankings.forEach(r => { local.rankResults[r.candidate_id] = r; });
        } catch (err) {
          local.rankResults = null;
          toast('Live re-rank failed — <span class="tk">scripted scores shown</span>', 'block');
        }
        setAgent('idle'); finishOpen(); return;
      }
      agentWork('searching the graph for warm, consented matches', slot, finishOpen);
    });
    $$('#view .btn-propose').forEach(b => { if (!b.disabled) b.addEventListener('click', async () => {
      const p = byId(b.dataset.id);
      const first = p.name.split(' ')[0];
      const slot = $('#propose-slot');

      // ── LIVE path: a real Claude call, grounded + cited, streamed ──
      if (window.EmberAgent && EmberAgent.hasKey()) {
        slot.innerHTML = `
          <div class="draft">
            <div class="draft-eyebrow" id="draft-eyebrow">${SPARK} <span class="live-tag">${esc(EmberAgent.MODEL)} · live</span> · reasoning about ${esc(p.name)} · REQ-2026-0488</div>
            <div class="agent-stream streaming" id="agent-stream"></div>
            <div class="btn-row" id="draft-actions" style="display:none"><button class="btn accent" id="btn-redis-send">Send</button><span class="perm-note" style="color:var(--ink-mute)">handoff to Recruiter on reply (chapter 1)</span></div>
          </div>`;
        slot.scrollIntoView({ block: 'nearest' });
        setAgent('working', 'reasoning · ' + EmberAgent.MODEL);
        const out = $('#agent-stream');
        try {
          const full = await EmberAgent.rankWithRationale(
            p,
            { id: 'REQ-2026-0488', title: 'Senior Platform Engineer', dept: 'Engineering' },
            'Devin',
            (t) => { out.textContent += t; });
          out.classList.remove('streaming');
          out.innerHTML = esc(full).replace(/\n?DRAFT:\s*/, '\n\n<span class="draft-label">Draft</span> ');
          setAgent('idle');
          const eb = $('#draft-eyebrow'); if (eb) eb.innerHTML = `${SPARK} <span class="live-tag">${esc(EmberAgent.MODEL)} · live</span> · cited rationale + draft · for ${esc(p.name)}`;
          const da = $('#draft-actions'); if (da) da.style.display = '';
          const sb = $('#btn-redis-send'); if (sb) sb.addEventListener('click', () => toast('Outreach sent to ' + esc(p.name) + ' · <span class="tk">warm inbound → Recruiter</span>'));
        } catch (err) {
          out.classList.remove('streaming');
          out.innerHTML = `<span class="perm-note" style="color:var(--plum)">Live call failed — ${esc(String((err && err.message) || err))}. Check the key (Connect AI, top right) or your network.</span>`;
          setAgent('idle');
        }
        return;
      }

      // ── scripted fallback (no key connected) ──
      slot.innerHTML = `
        <div class="draft">
          <div class="draft-eyebrow" id="draft-eyebrow">${SPARK} reasoning · ${esc(p.name)} · REQ-2026-0488</div>
          <div class="rationale" id="rationale"></div>
          <p class="draft-msg" id="draft-msg"></p>
          <div class="btn-row" id="draft-actions" style="display:none"><button class="btn accent" id="btn-redis-send">Send</button><span class="perm-note" style="color:var(--ink-mute)">handoff to Recruiter on reply (chapter 1)</span></div>
        </div>`;
      slot.scrollIntoView({ block: 'nearest' });
      setAgent('working', 'reasoning about ' + esc(first));
      await streamLines($('#rationale'), [
        'Why ' + first + ' for this requisition:',
        '· ' + p.redis.why + ' (' + p.redis.score + ' match)',
        '· consent valid for role-outreach in ' + p.consent.juris + ' — the send can cross this edge',
        '· nurture-fairness probe passed — no protected-class proxy in the ranking',
      ], { speed: 16 });
      setAgent('working', 'drafting outreach');
      const eb = $('#draft-eyebrow'); if (eb) eb.innerHTML = `${SPARK} cited outreach draft · for ${esc(p.name)} · review &amp; send`;
      await streamText($('#draft-msg'), first + " — when we last spoke the Platform role wasn't the right time. One just opened that looks a lot more like the work you wanted. No pressure — want the details?", { speed: 24 });
      setAgent('idle');
      const da = $('#draft-actions'); if (da) da.style.display = '';
      const sb = $('#btn-redis-send'); if (sb) sb.addEventListener('click', () => toast('Outreach sent to ' + esc(p.name) + ' · <span class="tk">warm inbound → Recruiter</span>'));
    }); });
  }

  function candidateHTML() {
    const p = byId(local.cand);
    const revoked = !!local.revoked[p.id];
    const stand = p.matched ? 'Matched to an open role'
      : (p.id === 'tomas' ? 'In the talent community (event follow-up only)' : 'Not currently matched to an open role');
    const picker = POOL.map(x => `<button data-cand="${x.id}" class="${x.id === p.id ? 'is-active' : ''}">${esc(x.name)}</button>`).join('');
    return `
      <div class="view-head">
        <div class="view-rail">Candidate view · the anti-ghosting surface</div>
        <h2 class="view-h">A <em>straight answer</em> — even when the answer is nothing.</h2>
        <p class="view-dek">The decision-explanation layer turned outward. No manufactured "you're a top match," no fake urgency — honest status, the data held, and one-click revoke.</p>
      </div>
      <div class="cand-picker">${picker}</div>
      <div class="cand-shell">
        <div class="cand-card">
          <div class="cand-bar"><span>stratum / c / cordova · ${esc(p.name)}</span><span>Candidate view</span></div>
          <div class="cand-body">
            <div class="cand-sec"><div class="lab">Where you stand</div><div class="big">${revoked ? 'Consent revoked' : esc(stand)}</div>
              <div class="cand-honest">${revoked ? 'You have been removed from all outreach. We hold nothing you have not chosen to leave.' : (p.matched ? 'A role opened that fits — a recruiter will reach out.' : 'In Cordova\'s talent community since ' + esc(p.held.since) + ' · you opted to stay in touch · last contact ' + esc(p.held.contact) + '.')}</div>
            </div>
            <div class="cand-sec"><div class="lab">What Cordova holds about you</div>
              <div class="cand-row"><span class="k">Résumé</span><span>${revoked ? '— (deleted)' : 'on file · ' + esc(p.held.resume)}</span></div>
              <div class="cand-row"><span class="k">History</span><span>${esc(p.held.note)}</span></div>
              <div class="cand-row"><span class="k">Consent</span><span>${revoked ? '<span class="badge muted">revoked</span>' : esc(p.consent.scope) + ' · ' + esc(p.consent.juris) + ' <span class="badge ok" style="border:0;padding:0">active</span>'}</span></div>
              <div class="cand-row"><span class="k">Used for</span><span>${revoked ? 'nothing' : 'rediscovery when a fitting role opens — nothing else'}</span></div>
            </div>
            <div class="cand-sec"><div class="lab">Your controls · honored at the data layer</div>
              <div class="cand-controls">
                <button class="btn ghost" ${revoked ? 'disabled' : ''} id="btn-revoke">${revoked ? 'Revoked' : 'Revoke consent'}</button>
                <button class="btn ghost" id="btn-download">Download my data</button>
              </div>
              <div class="cand-honest" style="font-size:.9rem;margin-top:.7rem">No urgency. No score. Just where you actually stand.</div>
            </div>
          </div>
        </div>
      </div>`;
  }
  function afterCandidate() {
    $$('#view .cand-picker button').forEach(b => b.addEventListener('click', () => { local.cand = b.dataset.cand; render(); }));
    const rv = $('#btn-revoke'); if (rv && !rv.disabled) rv.addEventListener('click', () => {
      local.revoked[local.cand] = true; render(); toast('Consent revoked · <span class="tk">removed from every future traversal, at the data layer</span>', 'block');
    });
    const dl = $('#btn-download'); if (dl) dl.addEventListener('click', () => toast('Data export prepared · <span class="tk">honest by default</span>'));
  }

  function deliverabilityHTML() {
    return `
      <div class="view-head">
        <div class="view-rail">Deliverability · sending infrastructure</div>
        <h2 class="view-h"><em>Compliant</em> is not the same as <em>deliverable</em>.</h2>
        <p class="view-dek">The consent edge decides what <strong>may</strong> be sent. This decides that what is sent <strong>arrives</strong> — added to v1 from evaluation feedback (the 500-emails-then-spam ceiling a recruiter's own mailbox hits).</p>
      </div>
      <div class="deliv-grid">
        <div class="stat"><div class="stat-k">Sending domain</div><div class="stat-v" style="font-size:1.15rem">talent.cordova<span style="color:var(--ink-mute)">.example</span></div><div class="stat-sub">dedicated · not your Outlook mailbox</div></div>
        <div class="stat"><div class="stat-k">Daily capacity</div><div class="stat-v">2,000</div><div class="stat-sub">412 sent today · rate-shaped</div></div>
        <div class="stat"><div class="stat-k">Domain reputation</div><div class="stat-v">warming</div><div class="bar"><span style="width:78%"></span></div><div class="stat-sub">78% · warmup in progress</div></div>
        <div class="stat"><div class="stat-k">Spam-flag rate</div><div class="stat-v">0.2<span style="font-size:1rem">%</span></div><div class="stat-sub">vs ~12% via shared mailbox</div></div>
      </div>
      <div class="card" style="margin-top:1.4rem"><div class="card-pad">
        <span class="card-title">Authentication &amp; routing</span>
        <ul class="auth-list">
          <li><span>SPF</span><span class="badge ok">pass</span></li>
          <li><span>DKIM</span><span class="badge ok">signed</span></li>
          <li><span>DMARC</span><span class="badge ok">p=quarantine · aligned</span></li>
          <li><span>Dedicated IP pool · reputation warmup</span><span class="badge ok">on</span></li>
          <li><span>Volume relayed through a recruiter's personal Outlook</span><span class="badge block">never</span></li>
        </ul>
      </div></div>`;
  }

  function permissionsHTML() {
    const caps = [['view','View pools &amp; candidates'],['campaign','Create / run campaigns'],['rediscover','Trigger rediscovery'],['export','Export'],['permissions','Manage permissions']];
    const roles = ['sourcer','clinical','admin'];
    const head = roles.map(r => `<th class="rolehead ${r === state.role ? 'is-current' : ''}">${esc(ROLES[r].name)}</th>`).join('');
    const rows = caps.map(([cap, label]) => `
      <tr><td>${label}</td>${roles.map(r => `<td class="${r === state.role ? 'is-current' : ''}">${ROLES[r].can[cap] ? '<span class="yes">✓</span>' : '<span class="no">—</span>'}</td>`).join('')}</tr>`).join('');
    return `
      <div class="view-head">
        <div class="view-rail">Permissions · operator RBAC</div>
        <h2 class="view-h">Who can run a campaign — <em>and who can't</em>.</h2>
        <p class="view-dek">Role-based access for the humans who run Ember, not only the agents. The same Decide / Recommend / Read-only governance, turned toward operators. <strong>Most Cordova recruiters are clinical-side and are view-only by default.</strong> Switch the role (top-right) to see the controls enable and disable across the console.</p>
      </div>
      <div class="card"><div class="card-pad">
        <table class="matrix">
          <thead><tr><th>Capability</th>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div></div>
      <p class="field-note" style="margin-top:1rem;font-size:11px">Signed in as <b>${esc(ROLES[state.role].who)}</b> · ${esc(ROLES[state.role].name)}. The highlighted column is the active role.</p>`;
  }

  function alertsHTML() {
    const canEdit = can('campaign'); // managing subscriptions is a sourcer/admin action
    const subs = Object.entries(local.subs).map(([team, on]) =>
      `<button class="sub ${on ? 'is-on' : ''}" data-team="${esc(team)}" ${canEdit ? '' : 'disabled'}>${on ? '✓' : '+'} ${esc(team)}</button>`).join('');
    const feed = local.alerts.map(a => `
      <div class="alert-item ${a.unread ? 'is-unread' : ''}">
        <span class="ai-dot"></span>
        <div class="ai-body">
          <div class="ai-title">${esc(a.title)} <span class="ai-req">${esc(a.req)}</span></div>
          <div class="ai-meta">${esc(a.dept)} · opened ${esc(a.opened)} · ${a.unread ? '<b>new</b>' : 'read'}</div>
        </div>
        <div class="ai-right"><span class="badge warm">${a.matches} warm in pool</span><button class="btn ghost ai-view" data-id="${esc(a.id)}">View rediscovery →</button></div>
      </div>`).join('');
    return `
      <div class="view-head">
        <div class="view-rail">Alerts · new openings</div>
        <h2 class="view-h">New openings, <em>the moment they post</em>.</h2>
        <p class="view-dek">No more waiting on a report every couple of weeks. When a requisition opens, the subscribed team is notified — and Ember says how many warm, consented people are <strong>already in your pool</strong> for it. (The rediscovery angle is what keeps this an Ember surface, not a generic ATS broadcast.)</p>
      </div>
      <div class="card"><div class="card-head"><span class="card-title">Notify these teams</span><span class="card-title">${canEdit ? 'click to toggle' : 'view-only'}</span></div>
        <div class="card-pad"><div class="chip-row">${subs}</div>${canEdit ? '' : '<div class="perm-note" style="margin-top:.6rem">view-only — subscriptions are managed by sourcers &amp; admins</div>'}</div>
      </div>
      <div class="card" style="margin-top:1.2rem"><div class="card-head"><span class="card-title">Recent openings</span><button class="btn ghost" id="mark-read" style="font-size:10px;padding:.4rem .7rem">Mark all read</button></div>
        <div class="card-pad" style="padding-top:.2rem;padding-bottom:.2rem">${feed || '<div class="empty">No new openings.</div>'}</div>
      </div>`;
  }
  function afterAlerts() {
    $$('#view .sub').forEach(b => { if (!b.disabled) b.addEventListener('click', () => { local.subs[b.dataset.team] = !local.subs[b.dataset.team]; render(); toast((local.subs[b.dataset.team] ? 'Subscribed · ' : 'Unsubscribed · ') + '<span class="tk">' + esc(b.dataset.team) + '</span>'); }); });
    const mr = $('#mark-read'); if (mr) mr.addEventListener('click', () => { local.alerts.forEach(a => a.unread = false); render(); toast('All alerts marked read'); });
    $$('#view .ai-view').forEach(b => b.addEventListener('click', () => {
      const a = local.alerts.find(x => x.id === b.dataset.id); if (a) a.unread = false;
      local.redisOpen = true; state.view = 'rediscovery'; render();
    }));
  }

  /* ── router ── */
  const VIEWS = {
    pools:          { html: poolsHTML,          after: afterPools },
    nurture:        { html: nurtureHTML,        after: afterNurture },
    agent:          { html: agentRunHTML,       after: afterAgentRun },
    rediscovery:    { html: rediscoveryHTML,    after: afterRediscovery },
    alerts:         { html: alertsHTML,         after: afterAlerts },
    candidate:      { html: candidateHTML,      after: afterCandidate },
    deliverability: { html: deliverabilityHTML, after: null },
    permissions:    { html: permissionsHTML,    after: null },
  };
  function render() {
    const v = VIEWS[state.view] || VIEWS.pools;
    $('#view').innerHTML = v.html();
    if (v.after) v.after();
    $$('.rail-item').forEach(b => b.classList.toggle('is-active', b.dataset.view === state.view));
    const ac = $('#ri-count-alerts');
    if (ac) { const u = local.alerts.filter(a => a.unread).length; ac.textContent = u; ac.classList.toggle('ri-count--accent', u > 0); }
    const rail = $('#rail'); if (rail) rail.classList.remove('is-open');
  }

  /* ── init ── */
  function initNav() {
    $$('.rail-item').forEach(b => b.addEventListener('click', () => { state.view = b.dataset.view; render(); }));
    const h = $('#hamburger'); if (h) h.addEventListener('click', () => $('#rail').classList.toggle('is-open'));
  }
  function initRole() {
    const sel = $('#role-select'); if (!sel) return;
    sel.addEventListener('change', () => {
      state.role = sel.value; updateUser(); render();
      toast('Now acting as <span class="tk">' + esc(ROLES[state.role].name) + '</span>');
    });
  }
  function initKey() {
    const btn = $('#key-btn'); if (!btn) return;
    const paint = () => {
      const live = window.EmberAgent && EmberAgent.hasKey();
      btn.textContent = live ? 'AI · live' : 'Connect AI';
      btn.classList.toggle('is-live', live);
      btn.title = live
        ? 'Anthropic key connected (this tab only). Rediscovery runs live on ' + EmberAgent.MODEL + '. Click to disconnect.'
        : 'Connect your Anthropic API key to run rediscovery live on Opus 4.8 (stored only in this tab). Without it, the console plays a scripted preview.';
    };
    btn.addEventListener('click', () => {
      if (window.EmberAgent && EmberAgent.hasKey()) {
        if (window.confirm('Disconnect the Anthropic key from this tab?')) { EmberAgent.clearKey(); toast('Disconnected · <span class="tk">back to scripted preview</span>'); }
      } else if (window.EmberAgent) {
        const k = window.prompt('Paste your Anthropic API key (sk-ant-…).\n\nStored only in this browser tab (sessionStorage), used to call Claude directly for live rediscovery. Not sent anywhere else.');
        if (k && k.trim()) { EmberAgent.setKey(k.trim()); toast('Connected · <span class="tk">rediscovery now runs live on ' + esc(EmberAgent.MODEL) + '</span>'); }
      }
      paint();
    });
    paint();
  }
  function boot() {
    updateRt(); setInterval(updateRt, 60000);
    initNav(); initRole(); initKey(); updateUser(); render();
    const lb = $('#loadbar'); if (lb) { lb.style.width = '100%'; setTimeout(() => lb.classList.add('is-done'), 500); }
  }
  boot();
})();
