# Four-product tour pattern — arc-strip

**Status:** Ratified · 2026-06-04  
**Author:** Tessera  
**Applies to:** `/recruiter/tour/`, `/tenure/tour/`, `/tour/` (Console), `/cairn/tour/`

---

## What it is

The arc-strip is a persistent navigation band that runs across the top of every product tour. It shows all four products in canonical sequence, marks the visitor's current position, and provides a direct link to the next chapter. It exists to answer one question a visitor will always have at step N: _where does this fit in the bigger story?_

The strip does not replace each tour's internal navigation — it sits above it, at a lower visual weight than the tour's own headline but above the hero fold.

---

## Canonical sequence

```
Recruiter  →  Tenure  →  Console  →  Cairn
  ch. 1          ch. 2       ch. 3     ch. 4
```

Elena Vega's arc mirrors this order: hired via Recruiter, onboarded via Tenure, analysed via Console, credentialed via Cairn.

---

## Component API (HTML)

```html
<nav class="arc-strip" aria-label="Four-product tour navigation">
  <span class="arc-strip__label">Stratum tour</span>
  <ol class="arc-strip__products">
    <li class="arc-strip__item arc-strip__item--done">
      <a href="/recruiter/tour/">Recruiter</a>
      <span class="arc-strip__ch">ch. 1</span>
    </li>
    <li class="arc-strip__item arc-strip__item--current" aria-current="step">
      <span>Tenure</span>
      <span class="arc-strip__ch">ch. 2</span>
    </li>
    <li class="arc-strip__item">
      <span>Console</span>
      <span class="arc-strip__ch">ch. 3</span>
    </li>
    <li class="arc-strip__item">
      <span>Cairn</span>
      <span class="arc-strip__ch">ch. 4</span>
    </li>
  </ol>
  <a class="arc-strip__next" href="/tour/">Next: Console →</a>
</nav>
```

Rules:
- `aria-current="step"` on the current item only
- `arc-strip__item--done` on all preceding items
- The last item (Cairn) omits `arc-strip__next`
- All link `href` values are root-relative so they work in Jekyll dev and production alike

---

## CSS (tokens only — no new tokens)

```css
.arc-strip {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: color-mix(in srgb, var(--ink) 96%, var(--paper));
  border-bottom: 1px solid color-mix(in srgb, var(--paper) 12%, transparent);
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}

.arc-strip__label {
  color: color-mix(in srgb, var(--paper) 50%, transparent);
  text-transform: uppercase;
  white-space: nowrap;
}

.arc-strip__products {
  display: flex;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
}

.arc-strip__item { color: color-mix(in srgb, var(--paper) 45%, transparent); }
.arc-strip__item a { color: inherit; text-decoration: none; }
.arc-strip__item--done { color: color-mix(in srgb, var(--paper) 65%, transparent); }
.arc-strip__item--current { color: var(--paper); font-weight: 600; }
.arc-strip__item--current a { color: var(--paper); }

.arc-strip__ch {
  margin-left: var(--space-1);
  opacity: 0.55;
}

.arc-strip__next {
  color: var(--ochre);
  text-decoration: none;
  white-space: nowrap;
}
.arc-strip__next:hover { text-decoration: underline; }

@media (prefers-reduced-motion: no-preference) {
  .arc-strip__next { transition: color 120ms ease; }
}

@media (max-width: 600px) {
  .arc-strip__label { display: none; }
  .arc-strip__ch { display: none; }
}
```

---

## Accessibility requirements

- The `<nav>` landmark must carry `aria-label="Four-product tour navigation"` — distinct from any internal tour nav already on the page
- `aria-current="step"` on the current item (not `aria-current="page"` — the visitor is mid-journey, not at a standalone page)
- Focus order: strip items first, then the tour's own skip link, then main content
- Contrast: `--paper` on `color-mix(in srgb, var(--ink) 96%, var(--paper))` background passes AAA at the font size used; ochre `--next` link passes AA (AAA at ≥18px — acceptable at this strip size given the low-stakes navigation role)

---

## Placement in each tour file

Insert immediately after `<body>` opens and before any skip link or hero `<section>`. The skip link `href="#main"` skips over the strip as well as any top chrome.

---

## Deprecations

None. This is a net-new component with no prior pattern to retire.
