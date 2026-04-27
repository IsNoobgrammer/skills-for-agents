# Postmortem

Blameless incident documentation. Forces structure so tired brains don't skip the root cause.

---

## When to use this skill

- "Write a postmortem"
- "Incident review"
- "What broke and why"
- "SEV1 report"
- "Document the outage"
- Any production incident, even minor ones — SEV3s reveal patterns SEV1s don't

---

## Commands

| Command | Effect |
|---------|--------|
| `/postmortem` | Full workflow: gather context → generate report → save file |

---

## What it produces

A structured markdown report saved to `postmortem/YYYY-MM-DD-<slug>.md` (auto-gitignored):

- **TL;DR** — One paragraph. What broke, how long, root cause, fix.
- **Timeline** — UTC/IST, precise, no unexplained gaps > 10 min.
- **Root Cause** — What happened + 5 Whys table.
- **Detection** — Time to detect, what worked, what didn't.
- **Response** — Time to resolve, responders, what worked.
- **Lessons** — Went well / went wrong / got lucky (honest).
- **Action Items** — P0/P1/P2 with owners and due dates.

---

## What it controls

Postmortem owns **process** — workflow, template, required sections, review checklist, file structure. The skeleton is sacred.

---

## File structure

```
postmortem/
└── SKILL.md          ← full template + blameless culture rules + composability
```

## Install

Drop the `postmortem/` folder into your agent's skills directory. Auto-triggers on incident-related language.
