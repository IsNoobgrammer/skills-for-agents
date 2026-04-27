# Harden

Production-harden an already clean, modular codebase for scale — **1M+ concurrent users**, **zero-downtime deploys**, **no structural changes**.

---

## When to use this skill

Use when code is **already clean and structured** but missing production patterns:

- "Make this production ready"
- "Add caching to my app"
- "Harden my code for launch"
- "Add rate limiting and error handling"
- "My code is clean but won't handle high traffic"
- "Audit my code for production gaps"
- "Add monitoring / health checks"

> ⚠️ If your code is messy or monolithic, use [`refactor`](../refactor) instead.

---

## What it does

Audits clean code and **adds only missing production patterns** — no renaming, no restructuring, no moving files.

| Phase | What happens |
|-------|-------------|
| **1 — Audit** | Scans every file. Outputs a Production Readiness Report with gaps by priority. |
| **2 — Plan** | Lists exactly which files change and what gets added. Confirms before touching anything. |
| **3 — Harden** | Outputs only modified files in full. Everything else untouched. |
| **4 — Verify** | Confirms all patterns in place + nothing broken. |

---

## Priority tiers

Gaps fixed most-dangerous-first:

### P0 — Will crash under load
- Connection pooling
- Async/non-blocking I/O
- Error boundaries on every route
- Graceful shutdown on SIGTERM

### P1 — Will degrade under load
- Caching layer (Redis)
- Rate limiting (public + auth routes)
- Circuit breaker (external services)
- Request timeouts

### P2 — Needed for safe deploys
- Health check endpoint (`GET /health`)
- Structured logger (replace console.log)
- Env-var config (no hardcoded secrets)
- Feature flags on new code paths
- Stateless sessions (Redis-backed)

### P3 — Frontend hardening
- Error boundaries (React/Vue)
- Loading + error states on async calls
- Debounce on API-triggering inputs
- Lazy loading (routes + images)
- No secrets in frontend bundle

---

## Hard rules

**NEVER**:
- Rename functions, variables, or files
- Move code between files
- Change folder structure
- Rewrite business logic

**ONLY** adds missing patterns on top of existing code.

---

## Stack support

Stack-agnostic. Works with:
- Node.js / Express
- Python / Flask / Django / FastAPI
- React / Vue / plain HTML+JS
- Any SQL or NoSQL database

---

## Invocation modifiers

```
[AUDIT_ONLY]  → Phase 1 report only, no changes
[PHASE:1]     → audit
[PHASE:2]     → plan
[PHASE:3]     → hardened code
[PHASE:4]     → verification
[P0_ONLY]     → fix crash risks only
[P1_ONLY]     → fix performance gaps only
[P2_ONLY]     → fix deploy safety only
```

---

## File structure

```
harden/
├── SKILL.md                      ← main skill instructions
├── README.md                     ← this file
└── references/
    └── prod-patterns.md          ← drop-in code for every hardening pattern
```

---

## Install

Drop the `harden/` folder into your agent's skills directory. Auto-triggers on production-hardening intent.
