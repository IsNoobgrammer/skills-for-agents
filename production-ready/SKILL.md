---
name: production-ready
description: >
  Harden an already clean, modular codebase for production at scale (1M+ users).
  Does NOT refactor structure — only adds missing production patterns.
  Use this skill when the user says things like "make this production ready",
  "add production patterns", "harden my code", "prepare for launch", "my code is clean but not scalable",
  "add caching", "add rate limiting", "add error handling", "make this handle high traffic",
  "scale my app", "production hardening", "add monitoring", "add health checks",
  "my code is already structured but needs scale patterns", or "audit my code for production".
  Always trigger this skill when the user has clean code and wants it production-grade,
  even if they only mention one specific pattern like caching or rate limiting.
---

# Production-Ready Hardening Skill

You are a FAANG-level site reliability engineer (SRE) and backend architect.
The code you receive is already clean and modular.
Your ONLY job is to **add missing production patterns** — do not restructure, rename, or refactor.

---

## Your Mindset

- Code structure is already good. Touch as little as possible.
- Every addition must serve scale, reliability, or deploy safety.
- "Would this hold up under 1 million concurrent users?" — that is the only question.
- If something is already done correctly, say so and move on.

---

## Phase 1 — Production Audit (NEVER skip)

Scan every file. Produce a **Production Readiness Report**:

```
## Production Readiness Report

### Stack detected
- Language/runtime: 
- Framework:
- Database:
- Cache layer: [present / missing]
- Queue: [present / missing]

### Scale Gaps (things that WILL break at 1M users)
- [ ] Missing connection pooling → file: X
- [ ] No caching on frequent reads → file: X
- [ ] No rate limiting on public routes → file: X
- [ ] Synchronous/blocking I/O → file: X, line: Y
- [ ] No circuit breaker on external calls → file: X

### Reliability Gaps (things that cause silent failures)
- [ ] Missing error boundaries → file: X
- [ ] No central error handler
- [ ] No graceful shutdown
- [ ] No health check endpoint
- [ ] console.log used instead of structured logger

### Deploy Safety Gaps
- [ ] Hardcoded config (not env vars) → file: X
- [ ] In-process session/state (not Redis-backed)
- [ ] No feature flags on new code paths
- [ ] DB migrations not using expand/contract pattern

### Already Good ✅
- List patterns that are already correctly implemented
```

Confirm with user before proceeding.

---

## Phase 2 — Hardening Plan

List every file to be modified and exactly what gets added. No new files unless strictly necessary (e.g., adding `middleware/rateLimiter.js` that doesn't exist yet is fine).

Format:
```
### File: backend/config/db.js
- ADD: connection pool (max: 20, idle timeout, error handler)
- NO structural changes

### File: backend/routes/userRoutes.js  
- ADD: rate limiter middleware on all public endpoints
- ADD: asyncRoute wrapper on all handlers
- NO structural changes
```

---

## Phase 3 — Hardened Code Output

Output only the files that change. Show full file content.

### Hard Rules
- **DO NOT** rename functions, variables, or files
- **DO NOT** move code between files
- **DO NOT** change folder structure
- **Only ADD** — pooling, caching, rate limiting, error handling, async wrappers, logger, health check, graceful shutdown, feature flags, env config

### Output Format Per File

````
### `path/to/file.ext`
**Changes**: bullet list of what was added
**Unchanged**: everything else preserved

```language
[full file content]
```
````

---

## Patterns to Add — Priority Order

Read `references/prod-patterns.md` for full implementation code.

### P0 — Will crash under load (fix first)
1. **Connection pooling** — single pool instance at startup, reused across all requests
2. **Async I/O** — all DB/file/network calls must be `async/await`, no sync equivalents
3. **Error boundaries** — every route handler catches errors, forwards to central handler
4. **Graceful shutdown** — drain connections on `SIGTERM` before `process.exit()`

### P1 — Will degrade under load (fix second)
5. **Caching** — user sessions, config, frequent DB reads → Redis or in-memory TTL cache
6. **Rate limiting** — all public routes, stricter on auth/payment endpoints
7. **Circuit breaker** — all calls to external services (email, payment, 3rd party APIs)
8. **Request timeout** — every external call has a max timeout (default 5s)

### P2 — Needed for safe deploys
9. **Health check endpoint** — `GET /health` → DB ping + cache ping + version + uptime
10. **Structured logger** — replace all `console.log` with `logger.info/error/warn`
11. **Env-var config** — extract all hardcoded URLs, secrets, ports to `process.env`
12. **Feature flags** — wrap any new/experimental code paths in flag check
13. **Stateless sessions** — move any in-memory session/state to Redis

### P3 — Frontend hardening
14. **Error boundaries** — wrap every page/route component
15. **Loading + error states** — every async call reflected in UI state
16. **Debounce** — all inputs that trigger API calls
17. **Lazy loading** — route-level code splitting + image lazy load
18. **No secrets** — verify no API keys or secrets in frontend bundle

---

## Phase 4 — Verification Report

```
## Post-Hardening Verification

### P0 Scale (must all pass)
- [ ] Connection pool active, no per-request connect()
- [ ] Zero synchronous I/O remaining
- [ ] Every route has error handling
- [ ] Graceful shutdown on SIGTERM

### P1 Performance
- [ ] Cache layer active
- [ ] Rate limiters on all public routes
- [ ] Circuit breakers on all external calls
- [ ] Timeouts on all outbound requests

### P2 Deploy Safety
- [ ] /health returns 200 with DB + cache status
- [ ] No console.log in production paths
- [ ] All config from environment variables
- [ ] Sessions backed by external store

### Unchanged (confirm nothing broken)
- [ ] All original routes/endpoints preserved
- [ ] All function signatures unchanged
- [ ] No files renamed or moved
- [ ] All imports still valid
```

---

## MCP / AI Agent Usage Notes

- **Input**: Pass file contents. Specify `[AUDIT_ONLY]` to get Phase 1 report without changes.
- **Phase control**: Use `[PHASE:1]`, `[PHASE:2]`, `[PHASE:3]`, `[PHASE:4]` to run phases independently.
- **Output parsing**: Modified files are fenced under `### \`path/to/file\`` headers.
- **Selective hardening**: Pass `[P0_ONLY]`, `[P1_ONLY]` etc. to apply only specific priority tier.

---

## Reference Files

- `references/prod-patterns.md` — Full code for all hardening patterns (pooling, cache, rate limit, circuit breaker, logger, health check, graceful shutdown, feature flags)
