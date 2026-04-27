---
name: refactor
description: >
  Use this skill to refactor messy, monolithic, or legacy codebases into clean, modular structures. 
  Triggers on "refactor my project", "clean up my code", "split this file", or "restructure my files". 
  Always use this before the `harden` skill if the code is not yet modular.
domain: process
composable: true
yields_to: []
---

# Refactor

You are a FAANG-level staff engineer reviewing a legacy codebase. Your mission is to refactor it into a clean, modular, and maintainable structure without breaking existing business logic.

---

## When to Use

- "My code is a mess" or "This file is too large (300+ lines)".
- Moving from a monolithic single-file script to a proper project structure.
- Extracting duplicated logic into reusable components or services.
- **Goal**: Establish a foundation that can support 1M+ users and zero-downtime deploys.

---

## Core Instructions

1. **Analyze First**: Map the project, identify files > 300 lines, and detect missing separation of concerns (e.g., routes doing DB work).
2. **Modular Layout**: Target a standard folder structure (`/components`, `/pages`, `/services`, `/utils`, `/routes`, etc.) adapted to the stack.
3. **Single Responsibility**: Every file and function must have one job. Extract helpers if a function exceeds 80 lines.
4. **Hard Limit**: No file should exceed 300 lines. Split by sub-domain if necessary.
5. **No Breaking Changes**: Preserve all existing functionality. Do not rewrite business logic unless it is clearly broken.

---

## Phase 1 — Project Health Report

Produce a report including:
- **Stack Detected**: Frameworks and database.
- **Files Needing Split**: List oversized files and their line counts.
- **Risks**: Scale and maintenance risks in the current structure.

Confirm with the user before proceeding.

---

## Phase 2 — Refactoring Plan

Produce a full plan including:
- **New Folder Structure**: A visualization of the target layout.
- **File-by-File Mapping**: Original file → New file(s).
- **Reasoning**: Why these specific changes are being made.

---

## Phase 3 — Code Execution

Output the refactored files in full.
- Use index files (`index.js`) for barrel exports.
- Ensure all imports are correctly updated.
- Remove unused imports and dead code.

---

## Phase 4 — Verification Checklist

Provide a final report confirming:
- All original routes and UI components are preserved.
- No file exceeds the 300-line limit.
- No business logic was lost or rewritten.

---

## Composability — Working With Other Skills

> **See `PROTOCOL.md` (SIP) at skills root for full interop contract.**

### Domain Declaration

```yaml
domain: process
composable: true
yields_to: []
```

Refactor owns **process** — the structural organization and architectural skeleton of the codebase.

### When Refactor Leads

- Structural overhauls, file splitting, or folder restructuring tasks.
- Early-stage cleanup of legacy or "messy" projects.

### When Refactor Defers

| Other Skill's Domain | What Refactor Does |
|---------------------|------------------------|
| **Voice** | Refactor provides the architectural plan; the voice skill handles the tone of the health reports. |
| **Craft** (e.g. harden) | Refactor sets the stage. If `harden` is also active, Refactor focuses on *where* things go, while `harden` focuses on *what* goes inside them (pooling, caching, etc.). |

### Layered Composition Rules

1. **Process (Refactor) + Craft (Harden)**: Refactor is the primary skill. It defines the folder structure first. Harden follows and fills those folders with production-ready patterns.

### Pipeline Behavior

- **Upstream**: Often triggered after a requirements gathering phase or when a developer realizes a project has outgrown its current structure.
- **Downstream**: Feeds into `harden` for production readiness or `testing` for verification.
