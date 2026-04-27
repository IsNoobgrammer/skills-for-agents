# Skill Creator

Meta-skill. Builds, audits, and improves other skills. Ensures every skill is SIP-compliant from day one.

---

## When to use this skill

- "Create a new skill"
- "Turn this workflow into a skill"
- "Audit my skill"
- "Improve this skill"
- "Make this skill composable"
- "I keep doing this manually" ← skill signal

---

## Commands

| Command | Effect |
|---------|--------|
| `/create-skill` | Interview → draft → audit cycle for a new skill |

---

## What it does

1. **Capture intent** — What domain? When should it trigger? What does it yield to?
2. **Write the skill** — Frontmatter + imperative instructions + examples + composability section
3. **SIP compliance** — Validates domain declaration, `yields_to`, required sections, anti-patterns
4. **Review & iterate** — Mental testing, user feedback, refinement

---

## Reference files

| File | Purpose |
|------|---------|
| `anatomy.md` | SKILL.md structure, frontmatter rules, size guidelines |
| `evaluation.md` | Scoring framework for comparing skill versions |
| `improvement-guide.md` | Iteration philosophy: generalize, keep lean, explain why |

---

## What it controls

Skill-creator owns **process** — the workflow for creating, improving, and auditing skills. It does NOT generate design rules (that's `painter`) or voice tone (that's `blogger`).

---

## File structure

```
skill-creator/
├── SKILL.md              ← creation pipeline + anti-patterns + audit checklist
├── anatomy.md            ← SKILL.md structural rules
├── evaluation.md         ← skill quality scoring
└── improvement-guide.md  ← iteration philosophy
```

## Install

Drop the `skill-creator/` folder into your agent's skills directory. Auto-triggers on skill-building requests.
