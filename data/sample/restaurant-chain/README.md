# Fork & Flame — restaurant-chain contextual map (Obsidian vault)

This folder **is** an Obsidian vault. It is a worked sample of the Stratum
*contextual map* (the substrate formerly called the "people graph"): a
20-store, 500-employee casual-dining chain, modeled as the full
HCM-universe entity set.

## How to open

1. Obsidian → *Open folder as vault* → select this `restaurant-chain` folder.
2. Open **[[HCM Universe Map]]** (the map of content).
3. Open the **Graph view** — the node-link picture *is* the contextual map.
   Color groups are configured by entity folder in `.obsidian/graph.json`.

## How it's built

Every note carries YAML **properties** (the entity's attributes) and
wiki-links (its relationships/edges). Two layers:

- `_schema/` — one note per **entity type** (`type-person`, `type-store`,
  `type-agent`, …): the documented HCM-universe contextual map. Each lists the
  type's properties, its edges to other types, and its **governance basis**
  (`consent` for data subjects, `authorization` for institutional entities,
  `delegated_authority` for agents).
- the entity folders (`People`, `Stores`, `Shifts`, …) — the instance data.

## Governance basis (carried on every note)

This sample honors the v6 governance-basis model: a `person` is gated by
**consent**; a `store`/`location`/`position`/`device` by **authorization**; an
`agent` operates under **delegated authority**. The basis is a property on each
note so the contextual map is governance-aware end to end.

## Regenerate

```bash
python3 data/sample/restaurant-chain/_generate.py
```

Deterministic (seed 20260615); rebuilds every note. Hand edits to generated notes
are overwritten — change `_generate.py`, not the output.
