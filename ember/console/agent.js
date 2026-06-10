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
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': get(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        stream: true,
        system: SYSTEM,
        messages: [{ role: 'user', content: userPrompt(c, req, recruiter) }],
      }),
    });
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

  return { hasKey, getKey: get, setKey: set, clearKey: clear, rankWithRationale, MODEL };
})();
