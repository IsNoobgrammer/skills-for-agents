# Refactor

Refactor messy, monolithic, or legacy codebases into clean, modular, production-ready structure — capable of handling **1M+ concurrent users** with **zero-downtime deployments**.

---

## When to use this skill

Use when code is **messy, large, or unstructured**:

- "Refactor my project"
- "My file has 3000 lines, help me split it"
- "Clean up my codebase"
- "Restructure my backend"
- "My code is a monolith"
- Sharing a single large file that does everything

> ⚠️ If your code is already clean and modular, use [`harden`](../harden) instead.

---

## What it does

Four strict phases:

| Phase | What happens |
|-------|-------------|
| **1 — Analyze** | Maps every file, finds scale risks, duplicate logic, missing patterns. Outputs a Project Health Report. |
| **2 — Plan** | Full new folder structure + file-by-file breakdown before touching any code. |
| **3 — Code** | Outputs every new/modified file in full with all production patterns baked in. |
| **4 — Verify** | Self-checks functionality, scale readiness, and deploy safety. |

---

## Production patterns included

Every refactored codebase gets:

- ✅ Connection pooling (no per-request DB connections)
- ✅ Redis caching layer
- ✅ Rate limiting on all public routes
- ✅ Async/await everywhere (zero blocking I/O)
- ✅ Central error handler + async route wrapper
- ✅ Circuit breaker for external services
- ✅ Graceful shutdown on SIGTERM
- ✅ Health check endpoint (`GET /health`)
- ✅ Structured logger (replaces console.log)
- ✅ Env-var config (no hardcoded values)
- ✅ Feature flags for zero-downtime releases
- ✅ Blue-green deploy ready (stateless services)
- ✅ Expand/contract DB migration pattern

---

## File size enforcement

- **Hard limit: 300 lines per file**
- Functions over 80 lines get extracted
- Every file has a single responsibility
- Future changes touch ≤ 2 files per feature

---

## Target folder structure

```
/project-root
  /frontend
    /components
    /pages
    /styles
      base.css
      layout.css
      components.css
    /utils
      api.js
      auth.js
      ui.js
      helpers.js
  /backend
    /routes
    /services
    /models
    /middleware
    /utils
    /config
```

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
[PHASE:1]   → run audit only
[PHASE:2]   → generate plan only
[PHASE:3]   → output code only
[PHASE:4]   → run verification only
```

For large codebases, pass one module at a time per phase to stay within context limits.

---

## File structure

```
refactor/
├── SKILL.md                      ← main skill instructions
├── README.md                     ← this file
└── references/
    ├── scale-patterns.md         ← pooling, caching, rate limiting, circuit breaker, graceful shutdown
    └── zero-downtime.md          ← blue-green, feature flags, expand/contract migrations
```

---

## Install

Drop the `refactor/` folder into your agent's skills directory. Auto-triggers on refactoring intent.
