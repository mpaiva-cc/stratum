#!/usr/bin/env python3
"""
Restaurant-chain contextual-map generator.

Emits an Obsidian vault that IS a contextual map of the HCM universe for a
20-store, 500-employee casual-dining chain ("Fork & Flame"). Every entity is a
note; every relationship is a wikilink, so Obsidian's graph view renders the
contextual map directly.

Two layers:
  _schema/   one note per ENTITY TYPE — the full HCM-universe catalog (the
             "documented contextual map"). Properties, edges, governance basis.
  instances  organization, regions, stores, departments, positions, people,
             shifts, skills, certifications, agents, events, and a sampled long
             tail (time-off, reviews, POS devices, benefits, policies).

Deterministic: seeded RNG, no external dependencies, no network.
Re-runnable: wipes and rebuilds the instance + schema folders each run.

Run:  python3 data/sample/restaurant-chain/_generate.py
"""

import os
import random
import shutil
import datetime
import re
import json

SEED = 20260615
random.seed(SEED)

ROOT = os.path.dirname(os.path.abspath(__file__))
CHAIN = "Fork & Flame"
N_STORES = 20
N_EMPLOYEES = 500
WEEK_START = datetime.date(2026, 6, 8)  # a Monday; the sampled schedule week

# ---------------------------------------------------------------------------
# small helpers
# ---------------------------------------------------------------------------

def slug(s):
    bad = '/\\:*?"<>|'
    out = "".join(("-" if c in bad else c) for c in s).strip().rstrip(".")
    return " ".join(out.split())

def link(title):
    return f"[[{title}]]"

def yaml_value(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, list):
        if not v:
            return "[]"
        return "\n" + "\n".join(f"  - {yaml_scalar(x)}" for x in v)
    return yaml_scalar(v)

def yaml_scalar(v):
    s = str(v)
    # quote anything with yaml-special chars or wikilinks
    if any(ch in s for ch in ':[]{}#&*!|>%@`"\'') or s.startswith("[["):
        return '"' + s.replace('"', '\\"') + '"'
    return s

NODES = []   # [{type,title,id,props,basis}]
EDGES = []   # [{src,verb,dst}]
_WIKILINK = re.compile(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]")

def note(folder, title, frontmatter, body):
    d = os.path.join(VAULT, folder) if folder else VAULT
    os.makedirs(d, exist_ok=True)
    fm = "---\n"
    for k, v in frontmatter.items():
        fm += f"{k}:{' ' if not (isinstance(v, list) and v) else ''}{yaml_value(v)}\n"
    fm += "---\n\n"
    with open(os.path.join(d, slug(title) + ".md"), "w") as f:
        f.write(fm + body.rstrip() + "\n")
    # --- fixture capture: record the node and its frontmatter-link edges
    props = {}
    for k, v in frontmatter.items():
        if isinstance(v, str):
            m = _WIKILINK.findall(v)
            for dst in m:
                EDGES.append({"src": title, "verb": k, "dst": dst})
            props[k] = m if len(m) > 1 else (m[0] if m else v)
        elif isinstance(v, list):
            links = [mm for item in v for mm in _WIKILINK.findall(str(item))]
            for dst in links:
                EDGES.append({"src": title, "verb": k, "dst": dst})
            props[k] = links if links else v
        else:
            props[k] = v
    NODES.append({"type": frontmatter.get("type", "unknown"), "title": title,
                  "id": frontmatter.get("id"), "props": props,
                  "basis": frontmatter.get("basis")})

VAULT = ROOT  # the vault IS this folder

# ---------------------------------------------------------------------------
# 1. ENTITY CATALOG — the full HCM universe (schema notes)
# ---------------------------------------------------------------------------
# Each entry: (type, group, basis, one-line, [properties], [edges as (verb,target)])
ENTITY_CATALOG = [
    # People & identity
    ("person", "People & identity", "consent", "A worker — the data subject at the center of HCM.",
     ["id", "name", "status", "employment_type", "hire_date", "email"],
     [("located_at", "location"), ("works_at", "store"), ("in_department", "department"),
      ("holds", "role"), ("reports_to", "person"), ("certified_in", "certification"),
      ("skilled_in", "skill"), ("assigned_to", "shift"), ("paid_at", "pay_rate")]),
    ("candidate", "People & identity", "consent", "An applicant in the hiring pipeline (pre-hire person).",
     ["id", "name", "stage", "applied_for", "source"],
     [("applied_to", "position"), ("at", "store"), ("screened_by", "agent")]),
    ("agent", "People & identity", "delegated_authority",
     "An autonomous actor. Not a data subject — operates under authority the company extends; lifetime is its policy version, not a tenure.",
     ["id", "kind", "policy_version", "operator", "status"],
     [("operates_under", "policy"), ("acts_on", "store"), ("recorded_in", "employment_event")]),

    # Organization
    ("organization", "Organization", "authorization", "The chain itself — the root org unit.",
     ["id", "name", "founded", "headquarters", "store_count", "headcount"],
     [("contains", "region")]),
    ("region", "Organization", "authorization", "A geographic market grouping of stores (org_unit level).",
     ["id", "name", "director"],
     [("part_of", "organization"), ("contains", "store")]),
    ("department", "Organization", "authorization", "A functional grouping (Kitchen, Front of House, Bar, Management).",
     ["id", "name", "function"],
     [("part_of", "organization"), ("staffs", "position")]),
    ("store", "Organization", "authorization", "A restaurant location as an operating unit (org_unit + a physical location).",
     ["id", "name", "region", "opened", "seats", "headcount"],
     [("part_of", "region"), ("at_location", "location"), ("employs", "person"),
      ("runs", "schedule"), ("operates", "device")]),
    ("position", "Organization", "authorization", "A job template (Line Cook, Server, GM...) with a pay band.",
     ["id", "title", "department", "flsa", "pay_band_low", "pay_band_high", "tipped"],
     [("in_department", "department"), ("requires", "certification"), ("requires", "skill")]),
    ("role", "Organization", "authorization", "An employee holding a position at a store (the instance of employment).",
     ["id", "person", "position", "store", "since"],
     [("of", "person"), ("is", "position"), ("at", "store")]),

    # Place
    ("location", "Place", "authorization",
     "A physical/legal place — jurisdiction, data-residency, badge zone. Distinct from a store's org grouping.",
     ["id", "code", "name", "address", "jurisdiction", "data_residency"],
     [("hosts", "store")]),

    # Scheduling & work
    ("shift", "Scheduling & work", "authorization", "A scheduled work block at a store (daypart, date, crew).",
     ["id", "store", "date", "daypart", "start", "end", "crew_size"],
     [("at", "store"), ("part_of", "schedule"), ("worked_by", "person")]),
    ("schedule", "Scheduling & work", "authorization", "A store's published schedule for a week.",
     ["id", "store", "week_start", "shift_count"],
     [("for", "store"), ("contains", "shift"), ("published_by", "agent")]),
    ("time_off_request", "Scheduling & work", "consent", "A worker's PTO / unavailability request.",
     ["id", "person", "start", "end", "kind", "status"],
     [("by", "person"), ("approved_by", "person")]),

    # Compensation
    ("pay_rate", "Compensation", "consent", "A worker's pay rate (hourly or salary) — sensitive personal datum.",
     ["id", "person", "rate", "unit", "effective"],
     [("of", "person"), ("for", "position")]),
    ("tip_pool", "Compensation", "authorization", "A store's tip-distribution pool for a period.",
     ["id", "store", "period", "amount"],
     [("at", "store"), ("distributes_to", "person")]),
    ("benefit_plan", "Compensation", "authorization", "A benefits offering (health, 401k, meals).",
     ["id", "name", "kind", "eligibility"],
     [("offered_by", "organization"), ("enrolls", "person")]),

    # Skills & compliance
    ("skill", "Skills & compliance", "authorization", "A competency used to staff and develop people.",
     ["id", "name", "category"],
     [("held_by", "person"), ("required_by", "position")]),
    ("certification", "Skills & compliance", "consent",
     "A personal credential (food safety, alcohol service) with an expiry — compliance-bearing.",
     ["id", "name", "authority", "valid_months"],
     [("held_by", "person"), ("required_by", "position")]),
    ("training_record", "Skills & compliance", "consent", "A completed training event for a worker.",
     ["id", "person", "course", "completed"],
     [("of", "person"), ("grants", "certification")]),

    # Performance & lifecycle
    ("performance_review", "Performance & lifecycle", "consent", "A periodic review of a worker.",
     ["id", "person", "period", "rating", "reviewer"],
     [("of", "person"), ("by", "person")]),
    ("employment_event", "Performance & lifecycle", "consent",
     "A lifecycle event (hire, promotion, transfer, termination) — bitemporal.",
     ["id", "person", "kind", "date", "detail"],
     [("of", "person"), ("at", "store")]),
    ("onboarding_task", "Performance & lifecycle", "authorization", "A checklist item in a new hire's onboarding.",
     ["id", "person", "task", "status"],
     [("for", "person")]),

    # Systems & governance
    ("device", "Systems & governance", "authorization", "A POS terminal or tablet at a store (deterministic key).",
     ["id", "asset_tag", "kind", "store"],
     [("at", "store"), ("used_by", "person")]),
    ("policy", "Systems & governance", "authorization", "A governance policy an agent operates under.",
     ["id", "name", "version", "decision_class"],
     [("governs", "agent")]),
    ("consent_grant", "Systems & governance", "consent",
     "A recorded consent — the grantor, scope, purpose, validity. The traversal predicate reads these.",
     ["id", "person", "scope", "purpose", "valid_to"],
     [("granted_by", "person")]),
]

GROUP_ORDER = ["People & identity", "Organization", "Place", "Scheduling & work",
               "Compensation", "Skills & compliance", "Performance & lifecycle",
               "Systems & governance"]

def emit_schema():
    for typ, group, basis, oneline, props, edges in ENTITY_CATALOG:
        fm = {"type": "entity-type", "group": group, "basis": basis}
        body = f"> **{group}** · governance basis: `{basis}`\n\n{oneline}\n\n"
        body += "## Properties\n\n" + "".join(f"- `{p}`\n" for p in props) + "\n"
        body += "## Relationships (edges)\n\n"
        for verb, target in edges:
            body += f"- `{verb}` → {link('type-' + target)}\n"
        body += "\n## Governance\n\n"
        body += {
            "consent": "Edges from this type are gated by **consent** — the data subject grants scope. The traversal predicate refuses paths a purpose token cannot satisfy.",
            "authorization": "An institutional entity — it does not consent. Edges are gated by **authorization** (policy validity), not consent.",
            "delegated_authority": "An actor operating under **delegated authority** the company extends; revisable mid-action via its policy version.",
        }[basis]
        body += f"\n\nSee the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a)."
        note("_schema", "type-" + typ, fm, body)

# ---------------------------------------------------------------------------
# 2. data pools
# ---------------------------------------------------------------------------
FIRST = ("Maria Jose Liam Noah Ava Sofia Mia Aiden Ethan Lucas Mason Amelia Harper "
         "Evelyn Abigail Emily Ella Camila Aria Diego Mateo Santiago Valentina Isabella "
         "Carlos Andres Priya Arjun Rohan Anaya Wei Min Jin Yuki Hana Omar Fatima Layla "
         "Zayd Aaron Bella Caleb Daniela Elena Felix Grace Hassan Ines Jamal Keira Leo "
         "Nadia Oscar Paloma Quinn Rosa Samir Tariq Uma Victor Wanda Ximena Yara Zane "
         "Brianna Connor Destiny Elijah Gabriela Henry Imani Jaden Kayla Logan").split()
LAST = ("Garcia Rodriguez Martinez Hernandez Lopez Gonzalez Perez Sanchez Ramirez Torres "
        "Nguyen Tran Le Pham Chen Wang Liu Kim Park Singh Patel Shah Khan Ali Ahmed "
        "Smith Johnson Williams Brown Jones Miller Davis Wilson Anderson Thomas Taylor "
        "Moore Jackson White Harris Clark Lewis Walker Young Allen King Wright Scott "
        "Okafor Mensah Diallo Abara Costa Silva Santos Rossi Romano Russo Bianchi").split()

REGIONS = [
    ("West", "Dana Whitfield"),
    ("South", "Marcus Bellamy"),
    ("Midwest", "Priya Raman"),
    ("Northeast", "Sofia Castellanos"),
]
# (store city, state, region) — 20 stores
CITIES = [
    ("Austin Domain", "TX", "South"), ("Houston Heights", "TX", "South"),
    ("Dallas Knox", "TX", "South"), ("Atlanta Midtown", "GA", "South"),
    ("Nashville Gulch", "TN", "South"),
    ("Denver LoDo", "CO", "West"), ("Phoenix Scottsdale", "AZ", "West"),
    ("Seattle Ballard", "WA", "West"), ("Portland Pearl", "OR", "West"),
    ("San Diego Gaslamp", "CA", "West"),
    ("Chicago Loop", "IL", "Midwest"), ("Minneapolis Uptown", "MN", "Midwest"),
    ("Columbus Short North", "OH", "Midwest"), ("Kansas City P&L", "MO", "Midwest"),
    ("Detroit Corktown", "MI", "Midwest"),
    ("Boston Seaport", "MA", "Northeast"), ("Brooklyn Williamsburg", "NY", "Northeast"),
    ("Philadelphia Fishtown", "PA", "Northeast"), ("DC Navy Yard", "DC", "Northeast"),
    ("Pittsburgh Strip", "PA", "Northeast"),
]

DEPARTMENTS = [
    ("Kitchen", "Back of house — food production."),
    ("Front of House", "Guest-facing service."),
    ("Bar", "Beverage program."),
    ("Management", "Store leadership."),
]

# position: title, dept, flsa, pay low, pay high, unit, tipped, rank(for reports_to)
POSITIONS = [
    ("General Manager", "Management", "exempt", 62000, 82000, "year", False, 1),
    ("Assistant Manager", "Management", "exempt", 46000, 60000, "year", False, 2),
    ("Shift Lead", "Management", "non-exempt", 19, 25, "hour", False, 3),
    ("Head Chef", "Kitchen", "exempt", 52000, 68000, "year", False, 2),
    ("Line Cook", "Kitchen", "non-exempt", 17, 23, "hour", False, 4),
    ("Prep Cook", "Kitchen", "non-exempt", 15, 18, "hour", False, 5),
    ("Dishwasher", "Kitchen", "non-exempt", 14, 16, "hour", False, 5),
    ("Server", "Front of House", "non-exempt", 9, 15, "hour", True, 4),
    ("Host", "Front of House", "non-exempt", 14, 17, "hour", False, 5),
    ("Busser", "Front of House", "non-exempt", 13, 15, "hour", True, 5),
    ("Expo", "Front of House", "non-exempt", 16, 19, "hour", False, 4),
    ("Bartender", "Bar", "non-exempt", 12, 18, "hour", True, 4),
]

SKILLS = [
    ("Knife Skills", "Kitchen"), ("Grill Station", "Kitchen"), ("Saute Station", "Kitchen"),
    ("POS Proficiency", "Service"), ("Wine & Spirits", "Beverage"),
    ("Guest Recovery", "Service"), ("Inventory & Ordering", "Operations"),
    ("Opening & Closing", "Operations"),
]
CERTS = [
    ("Food Handler", "ANSI", 36), ("ServSafe Manager", "NRA", 60),
    ("TIPS Alcohol Service", "TIPS", 36), ("Allergen Awareness", "ANSI", 36),
    ("First Aid & CPR", "Red Cross", 24),
]
AGENTS = [
    ("Scheduling Agent", "scheduling", "sched-policy-v3", "Builds and publishes store schedules from availability, demand, and labor budget."),
    ("Hiring Agent", "recruiter", "hire-policy-v2", "Screens applicants and routes qualified candidates to store managers."),
    ("Compliance Agent", "compliance", "comply-policy-v4", "Watches certification expiry, minor-labor rules, and break compliance across stores."),
]
BENEFITS = [
    ("Health PPO", "health", "30+ hrs/wk, 60 days"),
    ("401(k) Match", "retirement", "All, after 90 days"),
    ("Shift Meal", "perk", "All staff"),
    ("Tuition Assist", "development", "Salaried + 1yr tenure"),
]

# ---------------------------------------------------------------------------
# 3. generate
# ---------------------------------------------------------------------------
counters = {}
def nid(prefix):
    counters[prefix] = counters.get(prefix, 0) + 1
    return f"{prefix}-{counters[prefix]:04d}"

def d(date):
    return date.isoformat()

emitted = {"schema": 0, "stores": 0, "people": 0, "shifts": 0, "other": 0}

# wipe-and-rebuild: remove generated content, but preserve the generator and the
# hand-authored "system of understanding" app (index.html, app.js, ff-engine.js,
# ff-engine.test.js, CLAUDE.md). The graph fixture is generated, so it is NOT
# preserved here — it gets rebuilt every run.
KEEP = {os.path.basename(__file__), "index.html", "app.js", "ff-engine.js",
        "ff-engine.test.js", "ff-starters.test.js", "ff-roles.js",
        "ff-roles.test.js", "CLAUDE.md"}
for name in os.listdir(VAULT):
    if name in KEEP:
        continue
    p = os.path.join(VAULT, name)
    shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)

# --- organization
org_title = CHAIN
note("Organization", org_title,
     {"type": "organization", "id": "ORG-0001", "name": CHAIN, "founded": 2014,
      "headquarters": "Austin, TX", "store_count": N_STORES, "headcount": N_EMPLOYEES,
      "basis": "authorization"},
     f"The chain. {N_STORES} stores, {N_EMPLOYEES} employees, four regions.\n\n"
     "## Regions\n\n" + "".join(f"- {link(r[0] + ' Region')}\n" for r in REGIONS) +
     "\n## Benefits offered\n\n" + "".join(f"- {link(b[0])}\n" for b in BENEFITS) +
     "\n## Agents\n\n" + "".join(f"- {link(a[0])}\n" for a in AGENTS))

# --- regions
region_titles = {}
for name, director in REGIONS:
    t = f"{name} Region"
    region_titles[name] = t
    stores_here = [c for c in CITIES if c[2] == name]
    note("Regions", t,
         {"type": "region", "id": nid("REG"), "name": name, "director": director,
          "part_of": link(org_title), "basis": "authorization"},
         f"Market region. Director: {director}.\n\n## Part of\n\n- {link(org_title)}\n\n"
         "## Stores\n\n" + "".join(f"- {link('Store ' + f'{CITIES.index(c)+1:02d}' + ' - ' + c[0])}\n" for c in stores_here))

# --- departments
dept_titles = {}
for name, desc in DEPARTMENTS:
    t = f"{name} (Department)"
    dept_titles[name] = t
    note("Departments", t,
         {"type": "department", "id": nid("DEP"), "name": name, "function": name,
          "part_of": link(org_title), "basis": "authorization"},
         f"{desc}\n\n## Positions\n\n" +
         "".join(f"- {link(p[0])}\n" for p in POSITIONS if p[1] == name))

# --- positions
pos_titles = {}
for title, dept, flsa, low, high, unit, tipped, rank in POSITIONS:
    pos_titles[title] = title
    req_certs = []
    if dept in ("Kitchen",) or title in ("Server", "Host", "Expo", "Busser"):
        req_certs.append("Food Handler")
    if title in ("General Manager", "Assistant Manager", "Shift Lead", "Head Chef"):
        req_certs.append("ServSafe Manager")
    if title in ("Bartender", "Server"):
        req_certs.append("TIPS Alcohol Service")
    if dept == "Kitchen":
        req_certs.append("Allergen Awareness")
    note("Positions", title,
         {"type": "position", "id": nid("POS"), "title": title,
          "department": link(dept_titles[dept]), "flsa": flsa,
          "pay_band_low": low, "pay_band_high": high, "pay_unit": unit,
          "tipped": tipped, "basis": "authorization",
          "requires_certifications": [link(c) for c in req_certs]},
         f"Job template. Pay band **{low}-{high}/{unit}**, {flsa}.\n\n"
         f"## Department\n\n- {link(dept_titles[dept])}\n\n"
         f"## Requires\n\n" + "".join(f"- {link(c)}\n" for c in req_certs))

# --- skills & certs & benefits & policies & agents
for name, cat in SKILLS:
    note("Skills", name, {"type": "skill", "id": nid("SKL"), "name": name,
         "category": cat, "basis": "authorization"},
         f"Competency ({cat}).")
for name, auth, months in CERTS:
    note("Certifications", name, {"type": "certification", "id": nid("CRT"),
         "name": name, "authority": auth, "valid_months": months, "basis": "consent"},
         f"Credential issued by {auth}; valid {months} months. Compliance-bearing — the "
         f"{link('Compliance Agent')} watches expiry.")
for name, kind, elig in BENEFITS:
    note("Benefits", name, {"type": "benefit_plan", "id": nid("BEN"), "name": name,
         "kind": kind, "eligibility": elig, "offered_by": link(org_title),
         "basis": "authorization"},
         f"{kind.title()} benefit. Eligibility: {elig}.")
for name, kind, polv, desc in AGENTS:
    polname = f"{name} Policy"
    note("Governance", polname, {"type": "policy", "id": nid("PLC"), "name": polname,
         "version": polv, "decision_class": "Suggest" if kind != "compliance" else "Recommend",
         "governs": link(name), "basis": "authorization"},
         f"Governance policy for {link(name)} (version `{polv}`).")
    note("Agents", name, {"type": "agent", "id": nid("AGT"), "kind": kind,
         "policy_version": polv, "operator": link(org_title), "status": "active",
         "basis": "delegated_authority", "operates_under": link(polname)},
         f"{desc}\n\nAn agent — not a data subject. Operates under "
         f"**delegated authority** ({link(polname)}); its lifetime is the policy version `{polv}`, "
         f"not a tenure.")

# --- locations + stores
store_titles = []
store_meta = []  # (title, region, state)
store_loc = {}   # store_title -> location note title
store_region = {}
for i, (city, state, region) in enumerate(CITIES, start=1):
    code = f"{state}-{i:02d}"
    loc_title = f"{city} ({code})"
    store_title = f"Store {i:02d} - {city}"
    store_titles.append(store_title)
    store_meta.append((store_title, region, state))
    store_loc[store_title] = loc_title
    store_region[store_title] = region
    residency = "us"
    note("Locations", loc_title,
         {"type": "location", "id": nid("LOC"), "code": code, "name": city,
          "address": f"{city}, {state}", "jurisdiction": f"US-{state}",
          "data_residency": residency, "basis": "authorization",
          "hosts": link(store_title)},
         f"Physical/legal place. Jurisdiction **US-{state}**, residency `{residency}`. "
         f"Distinct from the store's org grouping — this note carries the place facts.\n\n"
         f"## Hosts\n\n- {link(store_title)}")

# --- people: distribute 500 across 20 stores (~25 each), build mgmt chains
# target headcount per store
base = N_EMPLOYEES // N_STORES
rema = N_EMPLOYEES - base * N_STORES
store_headcount = [base + (1 if k < rema else 0) for k in range(N_STORES)]
random.shuffle(store_headcount)

# crew composition weights per store (must include 1 GM, etc.)
def store_crew(n):
    crew = ["General Manager", "Assistant Manager", "Head Chef"]
    if n >= 26:
        crew.append("Assistant Manager")
    leads = max(2, n // 9)
    crew += ["Shift Lead"] * leads
    remaining = n - len(crew)
    # distribute remaining across line roles
    weighted = (["Line Cook"] * 5 + ["Prep Cook"] * 2 + ["Dishwasher"] * 2 +
                ["Server"] * 6 + ["Host"] * 1 + ["Busser"] * 2 + ["Expo"] * 1 +
                ["Bartender"] * 2)
    for _ in range(remaining):
        crew.append(random.choice(weighted))
    return crew[:n]

CERT_FOR_POS = {}
for title, dept, flsa, low, high, unit, tipped, rank in POSITIONS:
    cs = []
    if dept == "Kitchen" or title in ("Server", "Host", "Expo", "Busser"):
        cs.append("Food Handler")
    if title in ("General Manager", "Assistant Manager", "Shift Lead", "Head Chef"):
        cs.append("ServSafe Manager")
    if title in ("Bartender", "Server"):
        cs.append("TIPS Alcohol Service")
    if dept == "Kitchen":
        cs.append("Allergen Awareness")
    if title in ("General Manager", "Assistant Manager"):
        cs.append("First Aid & CPR")
    CERT_FOR_POS[title] = cs

SKILL_FOR_DEPT = {
    "Kitchen": ["Knife Skills", "Grill Station", "Saute Station", "Inventory & Ordering"],
    "Front of House": ["POS Proficiency", "Guest Recovery", "Opening & Closing"],
    "Bar": ["Wine & Spirits", "POS Proficiency", "Guest Recovery"],
    "Management": ["Inventory & Ordering", "Opening & Closing", "Guest Recovery"],
}
DEPT_FOR_POS = {p[0]: p[1] for p in POSITIONS}
PAY_FOR_POS = {p[0]: (p[3], p[4], p[5]) for p in POSITIONS}

people_by_store = {}          # store_title -> list of (title, position)
all_people = []               # (title, store_title, position, dept, manager_title placeholder)
emp_n = 0
today = datetime.date(2026, 6, 15)

for si, store_title in enumerate(store_titles):
    n = store_headcount[si]
    crew = store_crew(n)
    # order so managers first (for reports_to wiring)
    crew.sort(key=lambda t: next(p[7] for p in POSITIONS if p[0] == t))
    roster = []
    gm_title = None
    am_titles = []
    lead_titles = []
    for position in crew:
        emp_n += 1
        fn = random.choice(FIRST); ln = random.choice(LAST)
        eid = f"EMP-{emp_n:04d}"
        name = f"{fn} {ln}"
        ptitle = f"{eid} {name}"
        dept = DEPT_FOR_POS[position]
        roster.append((ptitle, position, dept, eid, name))
        if position == "General Manager" and gm_title is None:
            gm_title = ptitle
        elif position == "Assistant Manager":
            am_titles.append(ptitle)
        elif position == "Shift Lead":
            lead_titles.append(ptitle)
    people_by_store[store_title] = roster

    # wire reports_to: GM->region director(implicit), AM->GM, Lead->AM(or GM), staff->Lead(or AM/GM)
    def manager_for(position):
        if position == "General Manager":
            return None
        if position in ("Assistant Manager", "Head Chef"):
            return gm_title
        if position == "Shift Lead":
            return random.choice(am_titles) if am_titles else gm_title
        # line staff
        pool = lead_titles or am_titles or ([gm_title] if gm_title else [])
        return random.choice(pool) if pool else None

    for ptitle, position, dept, eid, name in roster:
        low, high, unit = PAY_FOR_POS[position]
        if unit == "year":
            rate = random.randint(low // 1000, high // 1000) * 1000
        else:
            rate = round(random.uniform(low, high), 2)
        # tenure
        hire = today - datetime.timedelta(days=random.randint(20, 365 * 5))
        status = "active" if random.random() > 0.06 else "on_leave"
        mgr = manager_for(position)
        certs = CERT_FOR_POS.get(position, [])
        skills = random.sample(SKILL_FOR_DEPT.get(dept, ["POS Proficiency"]),
                               k=min(len(SKILL_FOR_DEPT.get(dept, ["x"])), random.randint(1, 3)))
        et = "full_time" if position in ("General Manager", "Assistant Manager", "Head Chef") or random.random() > 0.45 else "part_time"
        fm = {
            "type": "person", "id": eid, "name": name, "status": status,
            "employment_type": et, "hire_date": d(hire),
            "email": f"{name.lower().replace(' ', '.')}@forkandflame.example",
            "works_at": link(store_title),
            "in_department": link(dept_titles[dept]),
            "position": link(position),
            "pay_rate": rate, "pay_unit": unit,
            "reports_to": link(mgr) if mgr else "",
            "certifications": [link(c) for c in certs],
            "skills": [link(s) for s in skills],
            "basis": "consent",
        }
        body = (f"**{position}** at {link(store_title)} · {dept} · since {d(hire)}.\n\n"
                f"## Works at\n\n- {link(store_title)} ({link(dept_titles[dept])})\n\n"
                f"## Position\n\n- {link(position)} — paid {rate}/{unit}\n\n")
        if mgr:
            body += f"## Reports to\n\n- {link(mgr)}\n\n"
        if certs:
            body += "## Certifications\n\n" + "".join(f"- {link(c)}\n" for c in certs) + "\n"
        if skills:
            body += "## Skills\n\n" + "".join(f"- {link(s)}\n" for s in skills) + "\n"
        body += (f"## Lifecycle\n\n- {link(eid + ' - hired')} on {d(hire)}\n")
        note("People", ptitle, fm, body)
        all_people.append((ptitle, store_title, position, dept, eid, name, hire))

        # hire event note
        note("Events", f"{eid} - hired",
             {"type": "employment_event", "id": nid("EVT"), "person": link(ptitle),
              "kind": "hire", "date": d(hire), "store": link(store_title),
              "basis": "consent"},
             f"{link(ptitle)} hired as {position} at {link(store_title)} on {d(hire)}.")

emitted["people"] = emp_n

# --- stores (emitted after people so they can list their roster)
for si, store_title in enumerate(store_titles, start=1):
    roster = people_by_store[store_title]
    region = store_region[store_title]
    loc_title = store_loc[store_title]
    sched_title = f"{store_title} - Week of {d(WEEK_START)}"
    opened = today - datetime.timedelta(days=random.randint(400, 365 * 9))
    fm = {
        "type": "store", "id": nid("STR"), "name": store_title.split(" - ", 1)[1],
        "region": link(f"{region} Region"), "at_location": link(loc_title),
        "part_of": link(f"{region} Region"), "opened": d(opened),
        "seats": random.choice([90, 110, 120, 140, 160, 180]),
        "headcount": len(roster), "basis": "authorization",
        "general_manager": link(next((r[0] for r in roster if r[1] == "General Manager"), "")),
    }
    body = (f"Store in the {link(f'{region} Region')} · {len(roster)} staff.\n\n"
            f"## Location\n\n- {link(loc_title)}\n\n"
            f"## Region\n\n- {link(f'{region} Region')}\n\n"
            f"## Schedule\n\n- {link(sched_title)}\n\n"
            f"## Roster ({len(roster)})\n\n"
            + "".join(f"- {link(r[0])} — {r[1]}\n" for r in roster))
    note("Stores", store_title, fm, body)
    emitted["stores"] += 1

# --- promotions (sample ~ 40 events for tenured staff)
tenured = [p for p in all_people if (today - p[6]).days > 540]
random.shuffle(tenured)
for ptitle, store_title, position, dept, eid, name, hire in tenured[:40]:
    when = hire + datetime.timedelta(days=random.randint(300, 700))
    if when >= today:
        continue
    note("Events", f"{eid} - promotion",
         {"type": "employment_event", "id": nid("EVT"), "person": link(ptitle),
          "kind": "promotion", "date": d(when), "store": link(store_title),
          "basis": "consent"},
         f"{link(ptitle)} promoted within {link(store_title)} on {d(when)}.")

# --- schedules + shifts (one representative week per store)
DAYPARTS = [("AM", "07:00", "15:30"), ("PM", "15:00", "23:30")]
for store_title in store_titles:
    roster = people_by_store[store_title]
    sched_title = f"{store_title} - Week of {d(WEEK_START)}"
    shift_titles = []
    for day in range(7):
        date = WEEK_START + datetime.timedelta(days=day)
        for dp, start, end in DAYPARTS:
            # crew: 6-10 from this store
            k = min(len(roster), random.randint(6, 10))
            crew = random.sample(roster, k)
            sid = nid("SHF")
            shf_title = f"{store_title} {d(date)} {dp}"
            shift_titles.append(shf_title)
            note("Shifts", shf_title,
                 {"type": "shift", "id": sid, "store": link(store_title),
                  "schedule": link(sched_title), "date": d(date), "daypart": dp,
                  "start": start, "end": end, "crew_size": k, "basis": "authorization",
                  "crew": [link(c[0]) for c in crew]},
                 f"{dp} shift at {link(store_title)} on {d(date)} ({start}-{end}).\n\n"
                 f"## Schedule\n\n- {link(sched_title)}\n\n"
                 f"## Crew\n\n" + "".join(f"- {link(c[0])} ({c[1]})\n" for c in crew))
            emitted["shifts"] += 1
    note("Schedules", sched_title,
         {"type": "schedule", "id": nid("SCH"), "store": link(store_title),
          "week_start": d(WEEK_START), "shift_count": len(shift_titles),
          "published_by": link("Scheduling Agent"), "basis": "authorization"},
         f"Week of {d(WEEK_START)} at {link(store_title)} — {len(shift_titles)} shifts, "
         f"published by {link('Scheduling Agent')}.\n\n"
         "## Shifts\n\n" + "".join(f"- {link(s)}\n" for s in shift_titles))

# --- sampled long tail: time-off, reviews, devices, tip pools
sample_people = random.sample(all_people, 25)
for ptitle, store_title, position, dept, eid, name, hire in sample_people:
    start = today + datetime.timedelta(days=random.randint(3, 40))
    note("Time Off", f"{eid} - time off",
         {"type": "time_off_request", "id": nid("TOR"), "person": link(ptitle),
          "start": d(start), "end": d(start + datetime.timedelta(days=random.randint(1, 5))),
          "kind": random.choice(["pto", "sick", "unpaid"]), "status": random.choice(["approved", "pending"]),
          "basis": "consent"},
         f"Time-off request by {link(ptitle)}.")
for ptitle, store_title, position, dept, eid, name, hire in random.sample(all_people, 25):
    note("Reviews", f"{eid} - review",
         {"type": "performance_review", "id": nid("PRV"), "person": link(ptitle),
          "period": "2026-Q1", "rating": random.choice(["exceeds", "meets", "meets", "developing"]),
          "basis": "consent"},
         f"Q1 2026 performance review for {link(ptitle)}.")
for store_title in store_titles:
    for k in range(2):
        note("Devices", f"{store_title} - POS {k+1}",
             {"type": "device", "id": nid("DEV"), "asset_tag": f"POS-{store_titles.index(store_title)+1:02d}-{k+1}",
              "kind": "pos_terminal", "store": link(store_title), "basis": "authorization"},
             f"POS terminal at {link(store_title)}. Deterministic key (asset tag) — never probabilistically merged.")

# --- long-tail entity types instantiated so the whole universe is populated
TIPPED = {"Server", "Busser", "Bartender"}
# candidates (hiring pipeline)
for k in range(15):
    fn = random.choice(FIRST); ln = random.choice(LAST)
    cid = nid("CND"); name = f"{fn} {ln}"
    pos = random.choice([p[0] for p in POSITIONS]); store = random.choice(store_titles)
    note("Candidates", f"{cid} {name}",
         {"type": "candidate", "id": cid, "name": name,
          "stage": random.choice(["applied", "screen", "interview", "offer"]),
          "applied_for": link(pos), "at": link(store),
          "source": random.choice(["referral", "walk-in", "indeed", "careers-site"]),
          "screened_by": link("Hiring Agent"), "basis": "consent"},
         f"Applicant for {link(pos)} at {link(store)}. Screened by {link('Hiring Agent')}.")
# tip pools (one per store, the sampled week)
for store_title in store_titles:
    tipped = [c[0] for c in people_by_store[store_title] if c[1] in TIPPED]
    note("Compensation", f"{store_title} - Tip Pool {d(WEEK_START)}",
         {"type": "tip_pool", "id": nid("TIP"), "store": link(store_title),
          "period": f"Week of {d(WEEK_START)}", "amount": random.randint(1800, 4400),
          "basis": "authorization", "distributes_to": [link(t) for t in tipped[:12]]},
         f"Tip pool for {link(store_title)}, week of {d(WEEK_START)}.\n\n"
         "## Distributed to\n\n" + "".join(f"- {link(t)}\n" for t in tipped[:12]))
# training records
for ptitle, store_title, position, dept, eid, name, hire in random.sample(all_people, 20):
    cert = random.choice([c[0] for c in CERTS])
    when = hire + datetime.timedelta(days=random.randint(5, 60))
    note("Training", f"{eid} - training",
         {"type": "training_record", "id": nid("TRN"), "person": link(ptitle),
          "course": f"{cert} Course", "completed": d(when), "grants": link(cert),
          "basis": "consent"},
         f"{link(ptitle)} completed {cert} Course on {d(when)} → {link(cert)}.")
# onboarding tasks for recent hires
recent = [p for p in all_people if (today - p[6]).days < 75]
for ptitle, store_title, position, dept, eid, name, hire in recent[:18]:
    task = random.choice(["I-9 verification", "Food Handler enrollment", "POS training",
                          "Uniform issue", "Direct deposit setup", "Safety orientation"])
    note("Onboarding", f"{eid} - onboarding",
         {"type": "onboarding_task", "id": nid("ONB"), "person": link(ptitle),
          "task": task, "status": random.choice(["done", "done", "pending"]),
          "basis": "authorization"},
         f"Onboarding task for {link(ptitle)}: {task}.")
# consent grants (the traversal predicate's source).
# Every person gets a baseline grant for ALL FOUR scopes, EXCEPT a deliberate
# minority engineered so each refusal reason is reachable by a realistic query:
#   - declined:  no hr.payroll grant at all            -> reason "no-grant"
#   - expired:   hr.certifications grant past valid_to  -> reason "expired"
#   - revoked:   hr.scheduling grant status=revoked     -> reason "revoked"
# Seeded RNG keeps this deterministic.
SCOPES = ["hr.scheduling", "hr.payroll", "hr.certifications", "hr.employment"]
people_pool = list(all_people)
random.shuffle(people_pool)
declined_payroll = set(p[4] for p in people_pool[:60])              # ~12% no payroll grant
expired_certs    = set(p[4] for p in people_pool[60:100])           # ~8% expired cert grant
revoked_sched    = set(p[4] for p in people_pool[100:130])          # ~6% revoked scheduling grant
past_date = d(today - datetime.timedelta(days=45))

for ptitle, store_title, position, dept, eid, name, hire in all_people:
    for scope in SCOPES:
        if scope == "hr.payroll" and eid in declined_payroll:
            continue  # declined -> grant simply absent
        status, valid_to = "active", "open"
        if scope == "hr.certifications" and eid in expired_certs:
            valid_to = past_date
        if scope == "hr.scheduling" and eid in revoked_sched:
            status = "revoked"
        note("Governance", f"{eid} - consent ({scope})",
             {"type": "consent_grant", "id": nid("CNS"), "person": link(ptitle),
              "scope": scope, "purpose": "store operations", "status": status,
              "valid_to": valid_to, "basis": "consent"},
             f"{link(ptitle)} — scope `{scope}` · status `{status}` · valid_to `{valid_to}`. "
             f"The traversal predicate reads this grant.")

# ---------------------------------------------------------------------------
# 4. schema notes, index, readme, obsidian config
# ---------------------------------------------------------------------------
emit_schema()
emitted["schema"] = len(ENTITY_CATALOG)

# Map of Content
moc = f"# {CHAIN} — HCM Universe Contextual Map\n\n"
moc += (f"A contextual map of a {N_STORES}-store, {N_EMPLOYEES}-employee casual-dining chain. "
        "Every entity is a note; every relationship is a wiki-link. Open the **graph view** "
        "to see the contextual map render.\n\n")
moc += "## The HCM universe (entity types)\n\n"
for group in GROUP_ORDER:
    moc += f"### {group}\n\n"
    for typ, g, basis, oneline, props, edges in ENTITY_CATALOG:
        if g == group:
            moc += f"- {link('type-' + typ)} — {oneline} _(basis: {basis})_\n"
    moc += "\n"
moc += "## Instances\n\n"
moc += f"- {link(CHAIN)} — the organization\n"
moc += "- **Regions** — " + ", ".join(link(r[0] + ' Region') for r in REGIONS) + "\n"
moc += f"- **Stores** ({N_STORES}) — see the `Stores`/`Locations` folders\n"
moc += f"- **People** ({N_EMPLOYEES}) — see the `People` folder\n"
moc += "- **Agents** — " + ", ".join(link(a[0]) for a in AGENTS) + "\n"
moc += ("- **Candidates** (hiring pipeline), **Positions, Departments, Skills, Certifications, "
        "Shifts, Schedules, Events, Reviews, Time Off, Training, Onboarding, Compensation** (tip pools), "
        "**Devices, Benefits, Governance** (policies + consent grants)\n")
note("", "HCM Universe Map", {"type": "index", "chain": CHAIN,
     "stores": N_STORES, "employees": N_EMPLOYEES}, moc)

readme = f"""# {CHAIN} — restaurant-chain contextual map (Obsidian vault)

This folder **is** an Obsidian vault. It is a worked sample of the Stratum
*contextual map* (the substrate formerly called the "people graph"): a
{N_STORES}-store, {N_EMPLOYEES}-employee casual-dining chain, modeled as the full
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

Deterministic (seed {SEED}); rebuilds every note. Hand edits to generated notes
are overwritten — change `_generate.py`, not the output.
"""
with open(os.path.join(VAULT, "README.md"), "w") as f:
    f.write(readme)

# minimal .obsidian config: graph color groups by folder + properties enabled
os.makedirs(os.path.join(VAULT, ".obsidian"), exist_ok=True)
graph_json = """{
  "collapse-filter": true,
  "search": "",
  "showTags": false,
  "showAttachments": false,
  "colorGroups": [
    {"query": "path:People", "color": {"a": 1, "rgb": 5431378}},
    {"query": "path:Stores or path:Locations", "color": {"a": 1, "rgb": 14701138}},
    {"query": "path:Shifts or path:Schedules", "color": {"a": 1, "rgb": 16737843}},
    {"query": "path:Positions or path:Departments", "color": {"a": 1, "rgb": 5025616}},
    {"query": "path:Agents or path:Governance", "color": {"a": 1, "rgb": 11815561}},
    {"query": "path:_schema", "color": {"a": 1, "rgb": 8355711}}
  ],
  "showOrphans": true,
  "scale": 0.7,
  "lineSizeMultiplier": 0.6,
  "nodeSizeMultiplier": 0.55
}
"""
with open(os.path.join(VAULT, ".obsidian", "graph.json"), "w") as f:
    f.write(graph_json)
app_json = '{\n  "alwaysUpdateLinks": true,\n  "propertiesInDocument": "visible",\n  "newLinkFormat": "shortest"\n}\n'
with open(os.path.join(VAULT, ".obsidian", "app.json"), "w") as f:
    f.write(app_json)
with open(os.path.join(VAULT, ".obsidian", "core-plugins.json"), "w") as f:
    f.write('["graph", "backlink", "outgoing-link", "properties-view", "page-preview", "file-explorer", "search"]\n')

# ---------------------------------------------------------------------------
# 5. report
# ---------------------------------------------------------------------------
def count_md():
    n = 0
    for dp, _, files in os.walk(VAULT):
        if ".obsidian" in dp:
            continue
        n += sum(1 for f in files if f.endswith(".md"))
    return n

print("Vault generated at:", VAULT)
print(f"  entity types (schema): {emitted['schema']}")
print(f"  stores:                {len(store_titles)}")
print(f"  employees:             {emitted['people']}")
print(f"  shifts:                {emitted['shifts']}")
print(f"  total .md notes:       {count_md()}")

# ---------------------------------------------------------------------------
# 6. fixture — the served graph the "system of understanding" reads
# ---------------------------------------------------------------------------

# NODES/EDGES are append-only; emit_fixture() is expected to run once per process.
def build_grant_index():
    idx = {}
    for n in NODES:
        if n["type"] != "consent_grant":
            continue
        person = n["props"].get("person")
        if not person:
            continue
        idx.setdefault(person, []).append({
            "scope": n["props"].get("scope"),
            "status": n["props"].get("status", "active"),
            "valid_to": n["props"].get("valid_to", "open"),
        })
    return idx

def emit_fixture():
    meta = {
        "generated": d(today),
        "purposes": {"scheduling": "hr.scheduling", "payroll": "hr.payroll",
                     "compliance": "hr.certifications", "employment": "hr.employment"},
        "gatedProps": {"pay_rate": "hr.payroll", "pay_unit": "hr.payroll"},
        "gatedTargets": {"time_off_request": "hr.scheduling",
                         "certification": "hr.certifications",
                         "training_record": "hr.certifications",
                         "performance_review": "hr.employment",
                         "employment_event": "hr.employment"},
        "gatedEdges": {"distributes_to": "hr.payroll"},
    }
    graph = {"meta": meta, "nodes": NODES, "edges": EDGES, "grants": build_grant_index()}
    payload = json.dumps(graph, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(VAULT, "forkandflame.graph.json"), "w") as f:
        f.write(payload)
    with open(os.path.join(VAULT, "forkandflame.graph.js"), "w") as f:
        f.write("/* generated by _generate.py — do not edit */\n")
        f.write("var FF_GRAPH = " + payload + ";\n")
        f.write("if (typeof module!=='undefined'&&module.exports) module.exports=FF_GRAPH;\n")
        f.write("else window.FF_GRAPH = FF_GRAPH;\n")
    print(f"  fixture:               {len(NODES)} nodes, {len(EDGES)} edges")

emit_fixture()
