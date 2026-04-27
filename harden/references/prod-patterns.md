# Production Hardening Patterns

Drop-in code for each hardening pattern. Adapt to detected stack.

---

## P0 — Connection Pooling

```js
// config/db.js — create ONCE, import everywhere
import { Pool } from 'pg';
import logger from '../utils/logger.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
pool.on('error', (err) => logger.error({ err }, 'DB pool error'));
export default pool;
```

```python
# config/db.py
from sqlalchemy import create_engine
engine = create_engine(
    os.environ["DATABASE_URL"],
    pool_size=20, max_overflow=10,
    pool_timeout=30, pool_recycle=1800,
)
```

---

## P0 — Async Route Wrapper

```js
// utils/asyncRoute.js
export const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

```js
// usage in any route file
router.get('/:id', asyncRoute(controller.getById));
```

---

## P0 — Central Error Handler

```js
// middleware/errorHandler.js
import logger from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  logger.error({ err, path: req.path, method: req.method, status });
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message,
  });
}
// Register LAST in app.js: app.use(errorHandler)
```

---

## P0 — Graceful Shutdown

```js
// server.js — add after server.listen()
async function shutdown(signal) {
  logger.info(`${signal} — shutting down`);
  server.close(async () => {
    await pool.end();
    await redisClient.quit();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000); // force after 10s
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
```

---

## P1 — Cache Layer (Redis)

```js
// utils/cache.js
import { createClient } from 'redis';
import logger from './logger.js';

const client = createClient({ url: process.env.REDIS_URL });
client.on('error', (err) => logger.error({ err }, 'Redis error'));
await client.connect();

export async function getOrSet(key, ttlSeconds, fetchFn) {
  try {
    const cached = await client.get(key);
    if (cached) return JSON.parse(cached);
    const value = await fetchFn();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return value;
  } catch {
    return fetchFn(); // fallback to DB on cache failure
  }
}
export async function invalidate(key) { await client.del(key); }
export { client as redisClient };
```

TTL guide:
- Feature flags / config: `3600` (1 hour)
- User profile: `300` (5 min)
- User session: `900` (15 min)
- Search results: `60` (1 min)

---

## P1 — Rate Limiter

```js
// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' },
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: 'Too many attempts.' },
});

// Apply in routes:
// router.use(defaultLimiter)              ← all routes
// router.post('/login', strictLimiter)    ← auth routes
```

---

## P1 — Circuit Breaker

```js
// utils/circuitBreaker.js
import CircuitBreaker from 'opossum';
import logger from './logger.js';

export function createBreaker(fn, fallback = () => null) {
  const breaker = new CircuitBreaker(fn, {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  });
  breaker.fallback(fallback);
  breaker.on('open',    () => logger.warn(`Circuit open: ${fn.name}`));
  breaker.on('halfOpen',() => logger.info(`Circuit half-open: ${fn.name}`));
  return breaker;
}

// Usage:
// const sendBreaker = createBreaker(sendEmailFn, () => ({ queued: true }));
// await sendBreaker.fire(payload);
```

---

## P2 — Health Check Endpoint

```js
// routes/healthRoutes.js
import { Router } from 'express';
import pool from '../config/db.js';
import { redisClient } from '../utils/cache.js';
import { asyncRoute } from '../utils/asyncRoute.js';

const router = Router();

router.get('/health', asyncRoute(async (req, res) => {
  const [dbOk, cacheOk] = await Promise.allSettled([
    pool.query('SELECT 1'),
    redisClient.ping(),
  ]).then(([db, cache]) => [
    db.status === 'fulfilled',
    cache.status === 'fulfilled',
  ]);

  const status = dbOk && cacheOk ? 200 : 503;
  res.status(status).json({
    status: status === 200 ? 'ok' : 'degraded',
    version: process.env.npm_package_version || 'unknown',
    uptime: Math.floor(process.uptime()),
    db: dbOk ? 'ok' : 'error',
    cache: cacheOk ? 'ok' : 'error',
  });
}));

export default router;
// Register: app.use('/', healthRouter) — before auth middleware
```

---

## P2 — Structured Logger

```js
// utils/logger.js
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' } : undefined,
});
export default logger;

// Replace ALL console.log  → logger.info({ data }, 'message')
// Replace ALL console.error → logger.error({ err }, 'message')
// Replace ALL console.warn  → logger.warn({ data }, 'message')
```

---

## P2 — Env Config

```js
// config/env.js — single source of truth
export const config = {
  port:      parseInt(process.env.PORT || '3000'),
  nodeEnv:   process.env.NODE_ENV || 'development',
  dbUrl:     process.env.DATABASE_URL,
  redisUrl:  process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,
  logLevel:  process.env.LOG_LEVEL || 'info',
};

// Validate required vars at startup
const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}
```

---

## P2 — Feature Flags

```js
// config/flags.js
export const flags = {
  newCheckout:    process.env.FLAG_NEW_CHECKOUT    === 'true',
  aiFeature:      process.env.FLAG_AI_FEATURE      === 'true',
  betaDashboard:  process.env.FLAG_BETA_DASHBOARD  === 'true',
};

// Usage anywhere:
// import { flags } from '../config/flags.js';
// if (flags.newCheckout) { ... } else { legacyPath() }
```

---

## P3 — Frontend Error Boundary (React)

```jsx
// components/ErrorBoundary.jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error(err, info); }
  render() {
    if (this.state.hasError)
      return <div className="error-state">Something went wrong.</div>;
    return this.props.children;
  }
}
// Wrap every page: <ErrorBoundary><PageComponent /></ErrorBoundary>
```

---

## P3 — Debounce Hook (React)

```js
// hooks/useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
// Usage: const query = useDebounce(inputValue, 400);
```
