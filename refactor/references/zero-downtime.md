# Zero-Downtime Deployment Patterns

Guide for shipping code updates without stopping production or causing errors for users.

---

## Core Principle: Surgical Commits

Every file has one responsibility → every change touches the fewest possible files.

```
❌ Monolith change: edit server.js (3000 lines) → entire app redeploys → risk is everywhere
✅ Modular change: edit services/paymentService.js (120 lines) → only payment logic ships
```

**File size is a deployment safety feature.** Files under 300 lines mean:
- Small, reviewable PRs
- Low blast radius per deploy
- Easy rollback (revert one file)

---

## 1. Blue-Green Deployment Setup

Two identical environments. Traffic switches between them instantly.

```
Load Balancer
     │
     ├──► BLUE  (current live, v1.0)
     └──► GREEN (new version, v1.1) ← deploy here first
```

### Requirements your code must satisfy:

**Stateless services** — instances can be killed and replaced at any time:
```js
// ❌ Bad — state stored in-process
const activeSessions = new Map();  // dies when instance restarts

// ✅ Good — state in external store
import { getSession, setSession } from '../utils/cache.js';
```

**Env-var config** — same binary, different config per environment:
```js
// config/env.js
export const config = {
  port:        process.env.PORT         || 3000,
  dbUrl:       process.env.DATABASE_URL,
  redisUrl:    process.env.REDIS_URL,
  jwtSecret:   process.env.JWT_SECRET,
  logLevel:    process.env.LOG_LEVEL    || 'info',
  nodeEnv:     process.env.NODE_ENV     || 'development',
};
```

**No hardcoded environment checks** in business logic:
```js
// ❌ Bad
if (process.env.NODE_ENV === 'production') { ... }  // scattered everywhere

// ✅ Good — use feature flags or config values instead
if (config.enablePayments) { ... }
```

### Blue-Green Checklist
- [ ] All session/state stored in Redis or DB (not memory)
- [ ] All config from environment variables
- [ ] Health check endpoint responds within 200ms
- [ ] Graceful shutdown drains connections (see scale-patterns.md §7)
- [ ] New instance passes health check BEFORE traffic switches

---

## 2. Rolling Deploy Pattern

Instances replaced one at a time. No full cutover needed.

```
Deploy v1.1 to instance 1 → health check passes → remove from rotation → replace → add back
Deploy v1.1 to instance 2 → repeat
```

### Your code must be backward-compatible during the rollout window:

Old (v1.0) and new (v1.1) instances run simultaneously for a few minutes.

```js
// ❌ Bad — v1.1 sends a field that v1.0 doesn't understand
// This causes errors while both versions are live

// ✅ Good — v1.1 adds optional fields, never removes required ones
// Old instances ignore unknown fields, new instances use them
```

**Rule**: Never remove or rename an API field or DB column in the same deploy that adds new behaviour.
Use the Expand/Contract pattern (see §4).

---

## 3. Feature Flags

Ship code dark. Activate without a deploy.

```js
// config/flags.js
export const flags = {
  newCheckoutFlow:   process.env.FLAG_NEW_CHECKOUT   === 'true',
  aiRecommendations: process.env.FLAG_AI_RECOMMEND   === 'true',
  betaDashboard:     process.env.FLAG_BETA_DASHBOARD === 'true',
};
```

### Usage pattern
```js
// services/checkoutService.js
import { flags } from '../config/flags.js';

export async function processCheckout(cart, user) {
  if (flags.newCheckoutFlow) {
    return newCheckoutHandler(cart, user);   // new path — ships dark
  }
  return legacyCheckoutHandler(cart, user);  // old path — stays live
}
```

### Rules
- New features ALWAYS ship behind a flag first
- Old code path stays intact until flag is 100% rolled out and stable
- Flags are env vars → activate via config change, no redeploy needed
- Delete the flag + old code path in a follow-up PR once stable

---

## 4. Expand/Contract DB Migration Pattern

Safe schema changes that work while old and new code run simultaneously.

### Phase 1 — EXPAND (safe to deploy with old code running)
```sql
-- Add new column as nullable (old code ignores it, new code uses it)
ALTER TABLE users ADD COLUMN display_name VARCHAR(100);

-- Add new index without locking (use CONCURRENTLY in Postgres)
CREATE INDEX CONCURRENTLY idx_users_display_name ON users(display_name);
```

### Phase 2 — MIGRATE (backfill data, run as background job)
```sql
-- Backfill existing rows (run in batches, not one giant UPDATE)
UPDATE users SET display_name = full_name WHERE display_name IS NULL LIMIT 1000;
```

### Phase 3 — CONTRACT (only after old code is fully retired)
```sql
-- Now safe to remove the old column
ALTER TABLE users DROP COLUMN full_name;
```

### Migration File Rules
```
migrations/
  001_add_display_name.sql       ← expand
  002_backfill_display_name.sql  ← migrate (run as job, not auto)
  003_drop_full_name.sql         ← contract (separate PR, weeks later)
```

**Never do in a single deploy**:
- `DROP COLUMN` while old code still reads that column
- `RENAME COLUMN` (breaks old code immediately)
- Add `NOT NULL` constraint without a default (blocks inserts from old code)
- Remove an API endpoint that old frontend code still calls

---

## 5. Deployment Safety Checklist

Run this before every deploy:

```
## Pre-Deploy Checklist

### Code
- [ ] All files under 300 lines
- [ ] No hardcoded config values
- [ ] New features behind feature flags
- [ ] No console.log in production code
- [ ] All async functions have error handling

### Database
- [ ] Migrations are additive only (expand, not contract)
- [ ] No RENAME or DROP in this deploy
- [ ] Large migrations run in batches

### Compatibility
- [ ] API response shape unchanged (only additive)
- [ ] Old + new instances can run simultaneously
- [ ] No breaking changes to shared interfaces

### Infrastructure
- [ ] /health endpoint returns 200
- [ ] Graceful shutdown tested
- [ ] Env vars set in target environment
- [ ] Rollback plan documented (which commit to revert to)
```

---

## 6. Rollback Strategy

Every deploy must have a clear rollback path.

```
Deploy fails → revert to previous Git tag → redeploy previous image
```

Your code structure makes rollback safe when:
- Services are stateless (no in-memory data lost on restart)
- DB migrations are expand-only (old code works on new schema)
- Feature flags are off by default (new code ships inert)

**Golden rule**: If you can't answer "how do I undo this deploy in 2 minutes?" — do not ship.
