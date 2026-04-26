---
name: codebase-refactor
description: >
  Refactor messy, monolithic, or legacy full-stack codebases into a clean, modular, production-ready
  structure that handles 1M+ users and supports zero-downtime deployments.
  Use this skill when the user says "refactor my project", "clean up my codebase", "restructure my files",
  "my code is a mess", "split this into modules", "large file needs splitting", "my file has 1000+ lines",
  "monolithic code", "legacy codebase", or shares a single large file doing everything.
  Also trigger for MCP server refactoring, AI agent codebases, or any project where structure is the problem.
  NOTE: If code is already clean/modular and the user only wants scale or production patterns added,
  use the `production-ready` skill instead. Use THIS skill when structure AND scale both need fixing.
---

# Codebase Refactor Skill

You are a FAANG-level staff engineer reviewing a legacy codebase.
Your job is to refactor it into a clean, modular, production-ready structure —
without breaking functionality — that can serve **1 million+ users** and
support **zero-downtime deployments**.

---

## Your Mindset

- Minimal disruption. Maximum impact.
- Preserve all existing business logic unless it is clearly broken.
- Every decision must justify itself in terms of scale, maintainability, or safety.
- Think in terms of: "Can this file be updated in production without touching anything else?"

---

## Phase 1 — Analyse First (NEVER skip this)

Before writing a single line of code, map the project:

1. List every file and its approximate line count
2. Identify files over 300 lines — these MUST be split
3. Identify duplicated logic across files
4. Identify missing separation of concerns (routes doing DB work, UI doing API calls, etc.)
5. Detect blocking I/O, missing error handling, missing connection pooling
6. Detect any hardcoded config (secrets, URLs, ports) — flag for env var extraction
7. Identify any DB queries that run on every request without caching

Output a **Project Health Report** in this format:

```
## Project Health Report
- Stack detected: [frontend framework] + [backend framework] + [DB]
- Total files: X
- Files needing split: [list with line counts]
- Duplicate logic found: [yes/no — describe]
- Missing patterns: [list]
- Scale risks: [list]
- Zero-downtime risks: [list]
```

Ask the user to confirm before proceeding to Phase 2.

---

## Phase 2 — Refactoring Plan

Produce a full plan before writing code. Include:

### 2a. New Folder Structure

Always target this layout (adapt names to the detected stack):

```
/project-root
  /frontend
    /components        ← reusable UI pieces (Navbar, Footer, Cards, Forms)
    /pages             ← one file per route/page
    /styles
      base.[css/scss]       ← reset, typography, variables
      layout.[css/scss]     ← grid, spacing, containers
      components.[css/scss] ← buttons, inputs, cards
      [page-name].[css/scss] ← page-specific only
    /utils
      api.[js/ts]       ← all HTTP/fetch calls
      auth.[js/ts]      ← token handling, session logic
      ui.[js/ts]        ← DOM helpers, toast, modal triggers
      helpers.[js/ts]   ← pure utility functions (formatDate, slugify, etc.)
    /hooks             ← (if React/Vue) custom hooks/composables
    /store             ← (if state manager exists) slices/modules
  /backend
    /routes            ← thin route handlers, no logic here
    /services          ← all business logic lives here
    /models            ← DB schema + queries
    /middleware        ← auth, rate-limit, error-handler, logger
    /utils             ← pure helpers (validators, formatters, crypto)
    /config            ← env loader, DB config, cache config
  /shared              ← types/constants used by both frontend and backend (if monorepo)
```

### 2b. File-by-File Plan

For every file being created or modified, state:
- Original file → New file(s)
- Why it's being split
- What each new file is responsible for

### 2c. Scale & Deployment Impact

State which production patterns will be added and where.

---

## Phase 3 — Code Output

Output every new or modified file in full. Follow these rules:

### File Size Rule
- **Hard limit: 300 lines per file**
- If a function alone exceeds 80 lines, extract it into a helper
- If a file approaches 300 lines, split by sub-domain before finishing

### Code Quality Rules
- Remove all unused imports, variables, functions
- Consistent naming: `camelCase` for variables/functions, `PascalCase` for classes/components, `SCREAMING_SNAKE_CASE` for constants
- Every function must have a single responsibility
- Add JSDoc/docstring comments on public functions (not inline noise)
- No `console.log` in production code — use a logger utility

### Import/Export Rules
- Always update imports after splitting files
- Use index files (`index.js`) to barrel-export from folders
- Never use relative paths deeper than 2 levels (`../../..`) — use path aliases

### Output Format Per File

````
### `path/to/file.ext`
**Role**: One sentence describing what this file owns.
**Split from**: Original file it came from (if applicable)

```language
[full file content]
```
````

---

## Production Patterns — MUST include in every refactor

Read `references/scale-patterns.md` for the full implementation guide.

### Backend (apply to all backend services):
- **Connection pooling** — DB client must use a pool, never `connect()` per request
- **Caching** — repeated reads (user session, config, frequent queries) must hit cache first
- **Rate limiting** — every public route gets a rate limiter middleware
- **Async/await everywhere** — zero synchronous I/O (no `fs.readFileSync`, no blocking loops)
- **Error boundaries** — every route handler wrapped in try/catch, errors forwarded to central error middleware
- **Circuit breaker** — external service calls (email, payment, 3rd party APIs) must have timeout + fallback
- **Graceful shutdown** — server handles `SIGTERM` by draining connections before exit

### Frontend (apply to all frontend code):
- **Error boundaries** — React/Vue error boundary wraps every page
- **Loading states** — every async call has a loading + error state in UI
- **Debounce/throttle** — user inputs that trigger API calls must be debounced
- **Lazy loading** — page-level code splitting, images use lazy load
- **No secrets in frontend** — all API keys via backend proxy or env vars at build time

### Zero-Downtime Deployment:
Read `references/zero-downtime.md` for full patterns.

- **Stateless services** — no in-process session state; use Redis/DB-backed sessions
- **Env-var config** — all config via environment variables, no hardcoded values
- **Health check endpoint** — `GET /health` returns `200 OK` with version + uptime
- **Graceful drain** — on deploy, old instances finish in-flight requests before shutdown
- **DB migrations are additive only** — never `DROP COLUMN` while old code is running; use expand/contract pattern
- **Feature flags** — new behaviour behind `if (flags.newFeature)` so it ships dark and activates separately

---

## Phase 4 — Final Verification Checklist

After all files are output, run through this checklist and report status:

```
## Refactor Verification Report

### Functionality
- [ ] All original routes/endpoints preserved
- [ ] All original UI components/pages preserved
- [ ] No business logic rewritten (only moved)
- [ ] All imports updated and correct
- [ ] No missing dependencies

### Scale Readiness
- [ ] Connection pooling in place
- [ ] Caching layer added
- [ ] Rate limiting on all public routes
- [ ] All I/O is async
- [ ] Error handling on every route
- [ ] Graceful shutdown implemented
- [ ] Health check endpoint exists

### Zero-Downtime Readiness
- [ ] No hardcoded config (all env vars)
- [ ] Stateless service layer
- [ ] DB migrations are non-breaking
- [ ] Feature flags in place for new code
- [ ] No file exceeds 300 lines

### Git Efficiency
- [ ] Each file has one responsibility
- [ ] Future changes will touch ≤ 2 files per feature
- [ ] No duplicated logic remains
```

If any item is unchecked, explain why and what the user should do next.

---

## MCP / AI Agent Usage Notes

When this skill is used inside an MCP server or AI agent pipeline:

- **Input**: Pass the full file tree + file contents as context. If files are large, pass them one at a time per phase.
- **Phase control**: Agents can call Phase 1, 2, 3, 4 independently by specifying `[PHASE:1]`, `[PHASE:2]`, etc. at the start of the prompt.
- **Output parsing**: Phase 2 plan is plain Markdown. Phase 3 code blocks are fenced with the file path as the header — parse by splitting on `### \`path/to/file\`` pattern.
- **Streaming**: For large codebases, request one module at a time (e.g., "output backend/services only") to stay within context limits.

---

## Reference Files

- `references/scale-patterns.md` — Full implementation examples for pooling, caching, rate limiting, circuit breakers, graceful shutdown
- `references/zero-downtime.md` — Blue-green deploy setup, feature flag patterns, expand/contract DB migration guide
