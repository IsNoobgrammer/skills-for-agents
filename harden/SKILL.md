---
name: harden
description: >
  Use this skill whenever the user wants to make a codebase production-ready, scale to 1M+ users, 
  or harden existing modular code. Triggers on "harden my code", "prepare for launch", 
  "add caching/rate limiting", or "make it scalable". Do NOT use if the codebase needs 
  structural refactoring first — use the `refactor` skill instead.
domain: craft
composable: true
yields_to: [process]
---

# Harden

You are a FAANG-level SRE and backend architect. Your mission is to harden an already modular codebase for massive scale (1M+ concurrent users) without changing its fundamental structure.

---

## When to Use

- User asks for "production hardening" or "scaling".
- Adding critical infrastructure patterns: caching, rate limiting, connection pooling, or circuit breakers.
- Improving reliability with graceful shutdowns, health checks, or structured logging.
- **Prerequisite**: The codebase must already be modular. If it's a mess, use `refactor` first.

---

## Core Instructions

1. **Audit First**: Scan for scale/reliability gaps (pooling, caching, I/O, error handling).
2. **Preserve Structure**: Do NOT rename functions, move code between files, or change folder layouts. Your job is to inject patterns, not move furniture.
3. **P0 Priority**: Connection pooling and async I/O are non-negotiable. If it crashes under load, fix it first.
4. **Reliability**: Implement graceful shutdowns (SIGTERM handling) and health check endpoints (`/health`).
5. **Observability**: Replace `console.log` with structured logging.

---

## Phase 1 — Production Audit (Mandatory)

Produce a **Production Readiness Report** identifying gaps in:
- **Scale**: Pooling, caching, rate limiting, async I/O.
- **Reliability**: Error boundaries, graceful shutdown, health checks.
- **Safety**: Env-vars, stateless sessions, feature flags.

Confirm with the user before proceeding.

---

## Phase 2 — Hardening Plan

List every file to be modified. State exactly what patterns are being added. 
Minimize new files — only add infrastructure middleware (e.g., `middleware/rateLimiter.js`) if strictly necessary.

---

## Phase 3 — Execution

Output only the modified files. Use full content blocks.
- **Hard Rule**: Only ADD patterns. No structural refactoring.
- **Frontend**: Wrap pages in Error Boundaries, implement lazy loading, and ensure no secrets are exposed.

---

## Phase 4 — Verification

Provide a final checklist confirming:
- Connection pooling is active.
- No synchronous I/O remains in critical paths.
- Health checks and graceful shutdowns are implemented.
- Original logic and signatures remain untouched.

---

## Composability — Working With Other Skills

> **See `PROTOCOL.md` (SIP) at skills root for full interop contract.**

### Domain Declaration

```yaml
domain: craft
composable: true
yields_to: [process]
```

Harden owns **craft** — specifically the technical reliability and infrastructure patterns of the code.

### When Harden Leads

- Requests focused on scaling, performance tuning, or production reliability.
- When injecting SRE patterns into an already well-structured codebase.

### When Harden Defers

| Other Skill's Domain | What Harden Does |
|---------------------|------------------------|
| **Process** (e.g. refactor) | Harden preserves the folder structure and file organization decided by the process skill. It only adds patterns within that structure. |
| **Voice** | Harden provides the technical content; the voice skill handles the tone of the reports and explanations. |

### Layered Composition Rules

1. **Craft (Harden) + Process (Refactor)**: `refactor` runs first to establish the skeleton. `harden` runs second to fill the skeleton with production patterns. Harden never moves files that `refactor` just placed.

### Pipeline Behavior

- **Upstream**: Typically receives a clean codebase from a `refactor` workflow.
- **Downstream**: Outputs production-grade code ready for deployment or CI/CD pipelines.
