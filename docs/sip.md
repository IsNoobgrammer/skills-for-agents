# SIP — Skills Interoperability Protocol

> [**Full Spec**](../PROTOCOL.md) | [**Contributing**](../docs/contributing.md)

The **Skills Interoperability Protocol (SIP)** is the universal contract that lets AI skills work together without breaking each other's output.

---

## Table of Contents

- [Why SIP Exists](#why-sip-exists)
- [The Domain Model](#the-domain-model)
- [Composition Modes](#composition-modes)
- [Precedence Rules](#precedence-rules)
- [SIP vs. Non-SIP](#sip-vs-non-sip)
- [Quick Reference](#quick-reference)

---

## Why SIP Exists

Standard prompt engineering treats instructions as isolated islands. Tell an agent to "be terse" and "write a blog post" — the two instructions fight. One wants detail, the other wants brevity. The result is usually neither.

**SIP solves this by defining Domains.**

A skill does not own the whole conversation. It only owns its domain. When multiple skills are active, each handles its domain and stays out of the others.

> **Core rule**: A skill owns its **domain**. It does not own the **conversation**.

---

## The Domain Model

Every skill declares exactly one domain in its frontmatter. Domains never overlap.

| Domain | Controls | Example Skills |
|--------|----------|----------------|
| **`voice`** | Tone, vocabulary, personality, emotional register | `blogger` |
| **`density`** | Token count, verbosity, compression level | `caveman`, `compress` |
| **`craft`** | Visual design, UI/UX, code quality of frontend output | `painter`, `harden` |
<<<<<<< HEAD
| **`process`** | Workflow steps, templates, structured output format | `postmortem`, `skill-creator`, `refactor`, `memory`, `ml-engine` |
| **`content`** | The actual substance being written about | `documenter`, `researcher`, `learn` |
=======
| **`process`** | Workflow steps, templates, structured output format | `postmortem`, `skill-creator`, `refactor` |
| **`content`** | The actual substance being written about | *(user's request)* |
>>>>>>> b0d0bac43d0066abae6528bd81e66a7493c57cbc

**Rule**: If two skills share a domain, the user's most recent invocation wins. If ambiguous, ask.

### Domain Declaration

Every `SKILL.md` starts with frontmatter:

```yaml
---
name: my-skill
description: >
  What this skill does. Specific triggers. (Must be < 1000 characters)
domain: voice          ← exactly one of the above
composable: true
yields_to: [process]   ← domains this skill defers to
---
```

- `domain` — must be exactly one SIP domain type
- `composable` — `true` unless the skill genuinely cannot share output space (rare)
- `yields_to` — domains this skill lets win when they conflict

---

## Composition Modes

When multiple skills are invoked, they compose in one of four modes.

### 1. Pipeline — Sequential

One skill's output feeds into the next. Order matters.

```
User: "Write a postmortem, then compress it"
Flow: postmortem → generates report → compress → shrinks the report
```

**Signal words**: "then", "after that", "once done", "now compress it"

### 2. Layered — Simultaneous

Multiple skills apply to the same output at once, each handling its domain.

```
User: "Write a blog post in caveman mode"
Flow: blogger handles voice + content structure
      caveman handles density
      Both apply to the same output
```

**Signal words**: "in X mode", "using X", "with X", simultaneous invocation

### 3. Handoff — Delegated

One skill recognizes it needs another skill's capability and explicitly calls for it.

```
postmortem: "This incident involved a UI regression.
            Invoking painter for the visual audit section."
```

### 4. Advisory — Consult

A skill references another skill's principles without fully activating it.

```
blogger: "Writing a technical blog about UI decisions.
         References painter's heuristics for accuracy,
         but voice stays in blogger's domain."
```

---

## Precedence Rules

When skills conflict, resolve with this hierarchy:

| Priority | Rule | Example |
|----------|------|---------|
| **1. Safety/Accuracy** | Always wins. No skill can override this. | If caveman compression would make a security warning ambiguous, expand it. |
| **2. User's explicit instruction** | "Write this in caveman mode" means caveman density wins. | `caveman` overrides `blogger`'s default verbosity. |
| **3. Domain owner** | Each skill is authoritative in its domain. | Voice conflict → voice skill wins. Density conflict → density skill wins. |
| **4. Most recently invoked** | If two skills share a domain and no explicit priority, the last one wins. | `/caveman` after `/compress` → caveman density wins for live responses. |
| **5. Specificity** | A narrow-scope skill beats a broad-scope skill in the overlap area. | `compress` (files) vs `caveman` (live) → different scopes, no conflict. |

---

## SIP vs. Non-SIP

| Feature | SIP Skills | Non-SIP / Generic Skills |
|---------|------------|--------------------------|
| **Composition** | Works alongside any other skill (Layered or Pipeline) | Usually conflicts or overrides previous instructions |
| **Domain Ownership** | Explicitly declares what it controls (`voice`, `density`, etc.) | Implicitly tries to control everything |
| **Standardization** | Follows strict frontmatter and section requirements | Random structure, hard to validate |
| **Precedence** | Knows when to lead and when to defer | Silent failures or "prompt leakage" |
| **Validation** | Automatically audited by `sip-validator.js` | Hard to test for consistency |
| **Future-proofing** | New skills integrate automatically | Existing skills often break when new instructions are added |

---

## Quick Reference

| If you want... | Invoke... | Domain | Composes with... |
|----------------|-----------|--------|------------------|
| Terse responses | `/caveman` | density | `blogger`, `painter`, any process skill |
| Compress files | `/compress [path]` | density | `postmortem`, `skill-creator` |
| Write in a voice | `/blog [mode]` | voice | `caveman`, `postmortem` |
| Design / fix UI | `/painter [command]` | craft | `blogger` (advisory), `harden` |
| Document an incident | `/postmortem` | process | `blogger`, `compress` |
| Refactor code | `/refactor` | process | `harden` (harden runs after refactor) |
| Harden for scale | `/harden` | craft | `refactor` (refactor runs before harden) |
| Create a skill | `/create-skill` | process | any voice or density skill |
<<<<<<< HEAD
| Document code/APIs | `document this` | content | `researcher`, `blogger` |
| Web research | `research X` | content | `documenter`, `ml-engine` |
| Study & Learning | `/learn` | content | `blogger`, `caveman` |
| Persist context | Startup (mandatory) | process | any skill |
| ML Research | `/ml` | process | `researcher` |
=======
>>>>>>> b0d0bac43d0066abae6528bd81e66a7493c57cbc

> See the full technical specification in [`PROTOCOL.md`](../PROTOCOL.md) for the complete contract, anti-patterns, and conflict resolution matrix.
