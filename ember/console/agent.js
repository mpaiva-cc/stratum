/* ============================================================
   Stratum Ember · Console — live agent (Phase 1: real reasoning)
   BYO Anthropic key, in-browser, streaming rank-with-rationale.

   The key is stored only in sessionStorage (this browser tab) and used to
   call the Anthropic Messages API directly from the page
   (anthropic-dangerous-direct-browser-access). This is the same BYO-key
   pattern echo.js uses for premium TTS. No key → the console falls back to
   its scripted preview. This is a prototype on synthetic data.

   Model: claude-opus-4-8. The agent is given ONLY the candidate's real graph
   facts and instructed to cite them and invent nothing — grounding is the
   point, not theater.
   ============================================================ */
window.EmberAgent = (() => {
  'use strict';
  const STORE = 'ember_anthropic_key';
  const get = () => { try { return sessionStorage.getItem(STORE) || ''; } catch (e) { return ''; } };
  const set = (k) => { try { sessionStorage.setItem(STORE, k); } catch (e) {} };
  const clear = () => { try { sessionStorage.removeItem(STORE); } catch (e) {} };
  const hasKey = () => !!get();
  const MODEL = 'claude-opus-4-8';
  const API = 'https://api.anthropic.com/v1/messages';
  const headers = () => ({
    'content-type': 'application/json',
    'x-api-key': get(),
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  });

  // Shared SSE streaming transport. Streams text via onToken(chunk); resolves to the full text. Throws on HTTP error.
  async function streamMessages(body, onToken) {
    const res = await fetch(API, { method: 'POST', headers: headers(), body: JSON.stringify(Object.assign({ stream: true }, body)) });
    if (!res.ok || !res.body) {
      let detail = String(res.status);
      try { detail = (await res.text()).slice(0, 300); } catch (e) {}
      throw new Error('Anthropic ' + res.status + ' · ' + detail);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '', full = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
        if (line.indexOf('data:') !== 0) continue;          // skip "event:" and blank lines
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        let ev; try { ev = JSON.parse(data); } catch (e) { continue; } // ignore ping etc.
        if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') {
          full += ev.delta.text;
          if (onToken) onToken(ev.delta.text);
        }
      }
    }
    return full;
  }

  const SYSTEM = [
    'You are the rediscovery agent inside Stratum Ember, an AI-first candidate-relationship product.',
    'Given a warm, previously-engaged candidate and a newly opened requisition, assess fit and draft a short re-engagement note.',
    'Rules:',
    '- Ground every claim ONLY in the candidate facts provided. Never invent employers, skills, dates, titles, or outcomes that are not given.',
    '- Cite the specific facts you rely on inline, in brackets, e.g. [final round, Nov 2024].',
    '- Give reasons a recruiter can defend. No black-box score-talk, no fake urgency, no flattery.',
    '- Respect consent: if the consent scope does not cover role outreach in the jurisdiction, say so plainly and do NOT write a draft.',
    '- Be concise: 2-4 sentences of rationale.',
    'Output plain text: the rationale, then a line that begins exactly with "DRAFT:" followed by a 2-3 sentence note from the recruiter (first name only).'
  ].join('\n');

  function userPrompt(c, req, recruiter) {
    const h = c.held || {};
    return [
      `Requisition: ${req.title} (${req.id}), ${req.dept}.`,
      'Candidate facts (the only facts you may use):',
      `- Name: ${c.name}`,
      `- Current/last role: ${c.role}`,
      `- Last touch: ${c.last}`,
      `- Consent: scope=${c.consent.scope}, jurisdiction=${c.consent.juris}, valid_for_role_outreach=${c.consent.valid}`,
      `- Identity: ${c.dedup || 'single resolved identity'}`,
      `- History: ${h.note || '—'} (in community since ${h.since || '?'}, last contact ${h.contact || '?'})`,
      `Recruiter first name: ${recruiter || 'the recruiter'}.`,
      'Assess fit for this requisition, cite the facts, and draft the note per the rules.'
    ].join('\n');
  }

  // Streams text via onToken(chunk); resolves to the full text. Throws on HTTP error.
  async function rankWithRationale(c, req, recruiter, onToken) {
    return streamMessages({
      model: MODEL, max_tokens: 700, system: SYSTEM,
      messages: [{ role: 'user', content: userPrompt(c, req, recruiter) }],
    }, onToken);
  }

  // non-streaming single call → the full message JSON
  async function callOnce(body) {
    const res = await fetch(API, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) {
      let detail = String(res.status);
      try { detail = (await res.text()).slice(0, 300); } catch (e) {}
      throw new Error('Anthropic ' + res.status + ' · ' + detail);
    }
    return res.json();
  }

  // ── Phase 2a: real model re-rank (structured output) ──
  async function rankCandidates(cands, req) {
    const schema = {
      type: 'object', additionalProperties: false, required: ['rankings'],
      properties: { rankings: { type: 'array', items: {
        type: 'object', additionalProperties: false, required: ['candidate_id', 'score', 'reason'],
        properties: { candidate_id: { type: 'string' }, score: { type: 'number' }, reason: { type: 'string' } },
      } } },
    };
    const facts = cands.map(c => `- id=${c.id} | ${c.name} | ${c.role} | last: ${c.last} | consent: ${c.consent.scope}/${c.consent.juris} valid_role_outreach=${c.consent.valid} | ${c.dedup || 'single identity'} | ${c.held ? c.held.note : ''}`).join('\n');
    const msg = await callOnce({
      model: MODEL, max_tokens: 900,
      system: 'You rank candidates for a requisition inside Stratum Ember. Score each 0.0–1.0 on genuine fit, grounded ONLY in the facts given; never invent. The reason must be one sentence citing the specific facts in brackets, e.g. [final round, Nov 2024]. Output JSON only.',
      messages: [{ role: 'user', content: `Requisition: ${req.title} (${req.id}), ${req.dept}.\nCandidates:\n${facts}\n\nReturn a ranking (highest fit first) with a score and a one-sentence cited reason for each candidate_id.` }],
      output_config: { format: { type: 'json_schema', schema } },
    });
    const text = (msg.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return JSON.parse(text).rankings;
  }

  // ── Phase 2b: the consent invariant — pure functions, the harness for the tool-use loop ──
  const coversRoleOutreachUS = (c) => c.consent.scope === 'role-outreach' && c.consent.juris === 'US';
  function checkConsent(pool, input) {
    const c = pool.find(x => x.id === input.candidate_id);
    if (!c) return { error: 'unknown candidate' };
    return { candidate: c.name, consent_scope: c.consent.scope, jurisdiction: c.consent.juris, purpose: input.purpose || 'role-outreach', covers: coversRoleOutreachUS(c) };
  }
  function stageSend(pool, input) {
    const c = pool.find(x => x.id === input.candidate_id);
    if (!c) return { is_error: true, content: 'unknown candidate' };
    if (!coversRoleOutreachUS(c)) {
      return { is_error: true, content: `BLOCKED at the consent edge: ${c.name} has consent ${c.consent.scope}/${c.consent.juris}, which does not cover role-outreach/US. The nurture traversal cannot cross this edge; nothing was staged.` };
    }
    return { staged: true, candidate: c.name, content: `Staged a send for ${c.name} (role-outreach/US consent valid) — awaiting human approval.` };
  }

  // ── Phase 2b: the agentic loop (non-streaming rounds, capped) ──
  async function runNurtureAgent(pool, cb) {
    const tools = [
      { name: 'check_consent', description: 'Check a candidate’s consent edge. Returns the consent scope on file and whether it covers the given purpose and jurisdiction. Read-only.',
        input_schema: { type: 'object', properties: { candidate_id: { type: 'string' }, purpose: { type: 'string' }, jurisdiction: { type: 'string' } }, required: ['candidate_id', 'purpose', 'jurisdiction'] } },
      { name: 'stage_send', description: 'Stage an outreach message to a candidate for human approval. Does NOT send. The consent plane refuses (returns is_error) for any send the candidate has not consented to for role-outreach in their jurisdiction.',
        input_schema: { type: 'object', properties: { candidate_id: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['candidate_id', 'body'] } },
    ];
    const roster = pool.map(c => `- id=${c.id} · ${c.name} · ${c.role}`).join('\n');
    const system = 'You are Ember’s autonomous nurture agent. You work a talent pool for a re-warm campaign: purpose=role-outreach, jurisdiction=US. Attempt to stage a send for EVERY candidate in the pool — do not pre-filter or skip anyone on your own judgement. The consent plane enforces consent: it will refuse (return is_error) any send it cannot make, and you must respect that refusal and move on. You stage sends only; a human approves and sends. Keep notes short and honest — no fake urgency. When you have attempted every candidate, stop and give a one-paragraph summary of who is staged and who was blocked and why. Be concise between tool calls.';
    const messages = [{ role: 'user', content: `Pool (${pool.length} candidates):\n${roster}\n\nWork the whole pool now: for each candidate, draft a short note and stage_send it. Use check_consent if you want to confirm or explain a result. Remember: attempt all — the consent plane will block what it must.` }];
    const staged = [], blocked = [];
    for (let round = 1; round <= 5; round++) {
      const msg = await callOnce({ model: MODEL, max_tokens: 1200, system, tools, messages });
      const text = (msg.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
      const toolUses = (msg.content || []).filter(b => b.type === 'tool_use');
      if (cb) cb({ type: 'round', round, text, toolUses, stop: msg.stop_reason });
      if (msg.stop_reason !== 'tool_use') { if (cb) cb({ type: 'done', round, text, staged, blocked, capped: false }); return { staged, blocked, final: text }; }
      const results = [];
      for (const tu of toolUses) {
        let result;
        if (tu.name === 'check_consent') result = checkConsent(pool, tu.input);
        else if (tu.name === 'stage_send') { result = stageSend(pool, tu.input); if (result.is_error) blocked.push({ id: tu.input.candidate_id, reason: result.content }); else staged.push({ id: tu.input.candidate_id, name: result.candidate }); }
        else result = { error: 'unknown tool' };
        if (cb) cb({ type: 'tool', name: tu.name, input: tu.input, result });
        const tr = { type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(result) };
        if (result.is_error) tr.is_error = true;
        results.push(tr);
      }
      messages.push({ role: 'assistant', content: msg.content });
      messages.push({ role: 'user', content: results });
    }
    if (cb) cb({ type: 'done', round: 5, staged, blocked, capped: true });
    return { staged, blocked, capped: true };
  }

  // ── Phase 3: candidate-facing Q&A, grounded to ONE person's facts ──
  // The complete fact set for a single candidate — this is ALL the model may use.
  // Never pass the pool: a privacy surface must not answer about anyone but the asker.
  function candidateFacts(c, revoked) {
    if (revoked) return [
      `- Name: ${c.name}`,
      '- Consent: REVOKED by this person.',
      '- Data held: nothing. Résumé deleted, history deleted.',
      '- Status: removed from all outreach and from every future traversal.',
      '- Used for: nothing.',
    ].join('\n');
    const h = c.held || {};
    const stand = c.matched ? 'Matched to an open role; a recruiter will reach out.'
      : (c.consent.valid ? 'Not currently matched to any open role; in the talent community.'
                         : 'In the talent community for event follow-up only; not matched to any role.');
    return [
      `- Name: ${c.name}`,
      `- Current/last role on file: ${c.role}`,
      `- Status: ${stand}`,
      `- In Cordova's talent community since: ${h.since || '—'}`,
      `- Last contact: ${h.contact || '—'}`,
      `- Résumé on file: ${h.resume || '—'}`,
      `- History note: ${h.note || '—'}`,
      `- Consent: scope=${c.consent.scope}, jurisdiction=${c.consent.juris}, valid_for_role_outreach=${c.consent.valid}`,
      `- Used for: ${c.consent.valid ? 'rediscovery when a fitting role opens — nothing else' : 'event follow-up only'}`,
      '- No interview scores, ratings, ranked comparisons, panel feedback, or hiring decisions are on file for this person.',
    ].join('\n');
  }

  const QA_SYSTEM = [
    'You are the candidate-facing transparency surface inside Stratum Ember. A person is asking about THEIR OWN data, held by Cordova Manufacturing.',
    'You are given the COMPLETE set of facts on file for this one person. Answer ONLY from these facts.',
    'Rules:',
    '- Cite the specific facts you rely on, briefly.',
    '- If the answer is not in the facts, say so plainly — e.g. "Cordova does not hold that" / "that is not on file." NEVER invent interview scores, feedback, rankings, timelines, employers, or outcomes.',
    '- Never promise a job, an interview, a callback, or any outcome. If asked "will I get the job?", say honestly that you cannot promise that, and state what the status actually is.',
    '- No urgency, no flattery, no score-talk, no "top match."',
    '- If consent is revoked, the only honest answer is that nothing is held and the person has been removed from all outreach.',
    '- Be brief and direct: a straight answer, even when the answer is nothing. 1–4 sentences.',
  ].join('\n');

  // Streamed candidate answer, grounded to exactly one person.
  async function answerCandidate(c, revoked, question, onToken) {
    return streamMessages({
      model: MODEL, max_tokens: 500, system: QA_SYSTEM,
      messages: [{ role: 'user', content: `Facts on file for ${c.name} (the only facts you may use):\n${candidateFacts(c, revoked)}\n\nThe person asks: "${question}"\n\nAnswer them directly, grounded only in these facts.` }],
    }, onToken);
  }

  // ── Phase 3: the grounding probe — the proof the Q&A surface can't fabricate ──
  // Q&A grounding is prompt-enforced (a model CAN violate a prompt), unlike Phase 2's
  // consent edge which is code-enforced. So we check it: given the ground-truth facts
  // and an answer, the judge flags any claim the facts do not support. It can go RED.
  async function groundingProbe(factsText, answerText) {
    const schema = {
      type: 'object', additionalProperties: false, required: ['grounded', 'verdict', 'unsupported_claims'],
      properties: {
        grounded: { type: 'boolean' },
        verdict: { type: 'string' },
        unsupported_claims: { type: 'array', items: { type: 'string' } },
      },
    };
    const msg = await callOnce({
      model: MODEL, max_tokens: 700,
      system: 'You are a strict grounding auditor. You receive a SET OF FACTS and an ANSWER a system gave to a person about their own data. Decide whether the answer asserts anything NOT entailed by the facts. List every unsupported claim — fabricated scores, ratings, panel feedback, promised outcomes, timelines, employers, anything the facts do not state. grounded=true ONLY if every assertion in the answer is supported by the facts; a promise of a job/interview/outcome the facts do not guarantee is unsupported. Be concise and literal.',
      messages: [{ role: 'user', content: `FACTS:\n${factsText}\n\nANSWER:\n${answerText}\n\nReturn grounded, a one-line verdict, and the list of unsupported claims (empty if fully grounded).` }],
      output_config: { format: { type: 'json_schema', schema } },
    });
    const text = (msg.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return JSON.parse(text);
  }

  return { hasKey, getKey: get, setKey: set, clearKey: clear, rankWithRationale, rankCandidates, runNurtureAgent, checkConsent, stageSend, candidateFacts, answerCandidate, groundingProbe, MODEL };
})();
