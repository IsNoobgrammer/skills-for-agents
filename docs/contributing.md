# Contributing Guide

> [**SIP Overview**](sip.md) | [**PROTOCOL.md**](../PROTOCOL.md) | [**Bots**](bots.md)

Add a new skill or improve an existing one. The fastest path is `skill-creator`. The thorough path is reading this guide, then using `skill-creator`.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Step-by-Step Workflow](#step-by-step-workflow)
- [SKILL.md Anatomy](#skillmd-anatomy)
- [Naming & Conventions](#naming--conventions)
- [Validation](#validation)
- [PR Checklist](#pr-checklist)
- [Common Pitfalls](#common-pitfalls)

---

## Quick Start

```
/create-skill
"I want a skill that does X"
```

`skill-creator` interviews you → drafts the skill → audits it. Done.

---

## Prerequisites

Before writing a skill, understand:

1. **Domains** — Your skill must own exactly one domain. See [SIP Overview](sip.md#the-domain-model).
2. **Composition** — Your skill will run alongside others. It must preserve structures it didn't create. See [PROTOCOL.md §4](../PROTOCOL.md).
3. **Frontmatter** — The YAML header is the activation mechanism. Get it right or the skill won't trigger.

---

## Step-by-Step Workflow

### 1. Capture Intent

Answer these five questions. If you can't answer one, the skill isn't ready.

| Question | Why It Matters |
|----------|----------------|
| **What does this skill do?** One sentence. | If you need two sentences, split it into two skills. |
| **What domain?** | Must be exactly one: `voice`, `density`, `craft`, `process`, `content`, `analysis`, `testing`. |
| **When should it trigger?** | List phrases, contexts, patterns. Under-triggering is worse than over-triggering. |
| **What does it yield to?** | When another domain conflicts, who wins? Be specific. |
| **What are the boundaries?** | What does this skill explicitly NOT do? Hard edges prevent scope creep. |

### 2. Write the Skill

Create a new directory `your-skill-name/` and add `SKILL.md`.

**Required structure:**

```markdown
---
name: your-skill-name
description: >
  # NOTE: Must be LESS than 1000 characters total.
  What this skill does. When to use it. Include trigger phrases.
  Be pushy: "Use this whenever the user mentions X, wants Y, or is working with Z."
domain: [domain]
composable: true
yields_to: [list, of, domains]
---

# Skill Title

[1–2 sentence identity statement.]

---

## When to Use

[Bullet list of activation scenarios. Be generous.]

---

## Core Instructions

[The heart of the skill. Imperative voice. Explain WHY, not just WHAT.]

---

## [Domain-Specific Sections]

[Patterns, rules, references, anti-patterns, checklists.]

---

## Boundaries

[What this skill does NOT do.]

---

## Composability — Working With Other Skills

> See PROTOCOL.md (SIP) for full interop contract.

### Domain Declaration

```yaml
domain: [domain]
composable: true
yields_to: [...]
```

[Skill name] owns **[domain]** — [one sentence on what it controls].

### When [Skill Name] Leads

- [Scenario 1]
- [Scenario 2]

### When [Skill Name] Defers

| Other Skill's Domain | What [Skill Name] Does |
|---------------------|------------------------|
| **[Domain]** | [Concrete: what it preserves, what it hands off] |

### Layered Composition Rules

1. **[Domain] + [Other domain]**: [Who handles what, boundary line]

### Pipeline Behavior

- **Upstream**: [How it handles pre-processed input]
- **Downstream**: [What downstream skills should expect]

### Conflict Signal

> `⚠️ [Domain] conflict: [what's conflicting]. [Resolution].`
```

### 3. Validate

Run the local validator before opening a PR:

```bash
node scripts/sip-validator.js your-skill-name/
```

It checks:
- Frontmatter: `name`, `domain`, `composable`, `yields_to` present and valid
- Required sections: "When to Use", "Core Instructions", "Composability"
- Size: 50–500 lines. Too short = vague. Too long = split into reference files.

### 4. Test Mentally

Pick 3 realistic user prompts. Walk through how your skill would handle them alongside other active skills. Identify gaps.

### 5. Submit

1. Create a new branch.
2. Add your skill directory.
3. Run the validator. Fix any issues.
4. Open a Pull Request.

The PR reviewer bot will audit your skill for SIP compliance, clarity, and efficiency.

---

## SKILL.md Anatomy

### Frontmatter Rules

- `name` — must match the folder name exactly
- `description` — the most important field. Determines activation. Must be < 1000 characters. Make it pushy and specific.
- `domain` — exactly one SIP domain type
- `composable` — default `true`. Set `false` only with justification.
- `yields_to` — requires real judgment. See [PROTOCOL.md §3](../PROTOCOL.md).

### Size Guidelines

| Skill Type | SKILL.md Lines | Sections |
|-----------|---------------|----------|
| **Focused** (single pattern) | 50–150 | Core + Composability |
| **Standard** (workflow/domain) | 150–350 | Full structure |
| **Comprehensive** (knowledge base) | 350–500 | Full + reference files |

Past 500 lines? Extract deep content into `references/` and point to it.

### Progressive Disclosure

Put the most common instructions in `SKILL.md`. Put deep-dive details in `references/`. Add clear pointers:

```markdown
> See references/advanced-patterns.md for edge cases.
```

---

## Naming & Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Folder name | lowercase-with-hyphens | `code-reviewer`, `sql-expert` |
| Skill file | `SKILL.md` (exact case) | `code-reviewer/SKILL.md` |
| Reference files | `references/*.md` | `references/edge-cases.md` |
| Trigger phrases | Natural language variants | "compress this", "shrink file", "reduce tokens" |

---

## PR Checklist

- [ ] `name` matches folder name
- [ ] `description` includes specific trigger phrases and is < 1000 chars
- [ ] `domain` is exactly one valid SIP domain
- [ ] `composable: true` (or justified `false`)
- [ ] `yields_to` is thoughtfully chosen
- [ ] "When to Use" section exists
- [ ] "Core Instructions" section exists
- [ ] "Composability" section exists with Domain Declaration, When Leads, When Defers, Layered Rules, Pipeline Behavior, Conflict Signal
- [ ] Under 500 lines or uses reference files
- [ ] `node scripts/sip-validator.js <folder>` passes

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| **The Vague Skill** — "Make the code better." | Be specific. What does "better" mean? Pick one dimension and give concrete steps. |
| **The Dictator** — "ALWAYS do X. NEVER do Y." | Explain reasoning. `Use X because Y` beats `ALWAYS use X`. |
| **The Novel** — 2000-line SKILL.md | Extract to `references/`. SKILL.md is the router, not the encyclopedia. |
| **The Island** — No composability section | Every skill composes. Even primary skills need to know how to behave when density or voice skills are active. |
| **The Copycat** — Same domain as existing skill | Differentiate scope or make one yield to the other. |
| **The Overfit** — Works for 3 test cases only | Generalize from examples. Explain the principle, not just the pattern. |

---

> [!TIP]
> Use `/painter shape` if you need help designing the documentation structure or visual hierarchy for your skill's README and reference files.
