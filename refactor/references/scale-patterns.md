# Scale Patterns Reference

Implementation guide for production patterns that support 1M+ users.
Stack-agnostic — adapt the pattern to the detected language/framework.

---

## 1. Connection Pooling

### Node.js / PostgreSQL (pg)
```js
// config/db.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                  // max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected DB pool error', err);
});

export default pool;
```

### Python / SQLAlchemy
```python
# config/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(
    os.environ["DATABASE_URL"],
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
```

**Rule**: The pool is created ONCE at startup. Never import and call `connect()` inside a request handler.

---

## 2. Caching Layer

### Node.js / Redis
```js
// utils/cache.js
import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });
client.on('error', (err) => logger.error('Redis error', err));
await client.connect();

export async function getOrSet(key, ttlSeconds, fetchFn) {
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);
  const value = await fetchFn();
  await client.setEx(key, ttlSeconds, JSON.stringify(value));
  return value;
}

export async function invalidate(key) {
  await client.del(key);
}
```

### Usage in a service
```js
// services/userService.js
import { getOrSet } from '../utils/cache.js';

export async function getUserById(id) {
  return getOrSet(`user:${id}`, 300, () => db.query(
    'SELECT * FROM users WHERE id = $1', [id]
  ));
}
```

**Rule**: Cache TTL must match the staleness tolerance of the data.
User sessions: 15–30 min. Config/feature flags: 60 min. User profiles: 5 min.

---

## 3. Rate Limiting

### Node.js / Express (express-rate-limit)
```js
// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,   // stricter for login/signup
  message: { error: 'Too many auth attempts.' },
});
```

### Apply in routes
```js
// routes/authRoutes.js
import { authLimiter } from '../middleware/rateLimiter.js';
router.post('/login', authLimiter, authController.login);
router.post('/signup', authLimiter, authController.signup);
```

**Rule**: Public routes get `defaultLimiter`. Auth/payment routes get a stricter limiter.

---

## 4. Async / Non-Blocking I/O

### Pattern: Never block the event loop
```js
// ❌ Bad — blocks the thread
const data = fs.readFileSync('./config.json');

// ✅ Good — non-blocking
const data = await fs.promises.readFile('./config.json', 'utf8');
```

```js
// ❌ Bad — sequential when parallel is possible
const user = await getUser(id);
const orders = await getOrders(id);

// ✅ Good — parallel
const [user, orders] = await Promise.all([getUser(id), getOrders(id)]);
```

**Rule**: Any function that does I/O must be `async`. Use `Promise.all` for independent operations.

---

## 5. Error Boundaries

### Central error middleware (Express)
```js
// middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  logger.error({ err, path: req.path, method: req.method });

  // Never leak stack traces to clients
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message,
  });
}
```

### Route wrapper (avoids try/catch on every handler)
```js
// utils/asyncRoute.js
export const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

### Usage
```js
// routes/userRoutes.js
import { asyncRoute } from '../utils/asyncRoute.js';
router.get('/:id', asyncRoute(userController.getUser));
```

**Rule**: All routes use `asyncRoute` wrapper. Central `errorHandler` is the LAST middleware registered.

---

## 6. Circuit Breaker

### Node.js (opossum)
```js
// utils/circuitBreaker.js
import CircuitBreaker from 'opossum';

export function createBreaker(fn, options = {}) {
  const breaker = new CircuitBreaker(fn, {
    timeout: 3000,           // 3s timeout
    errorThresholdPercentage: 50,
    resetTimeout: 30000,     // try again after 30s
    ...options,
  });
  breaker.fallback(() => null);  // graceful degradation
  breaker.on('open', () => logger.warn(`Circuit open: ${fn.name}`));
  return breaker;
}
```

### Usage in a service
```js
// services/emailService.js
import { createBreaker } from '../utils/circuitBreaker.js';

const sendBreaker = createBreaker(sendEmailViaProvider);

export async function sendEmail(payload) {
  const result = await sendBreaker.fire(payload);
  if (!result) logger.warn('Email send skipped — circuit open');
}
```

---

## 7. Graceful Shutdown

```js
// server.js
const server = app.listen(process.env.PORT, () => {
  logger.info(`Server running on port ${process.env.PORT}`);
});

async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await db.pool.end();          // drain DB connections
    await redisClient.quit();     // close cache connection
    logger.info('Shutdown complete');
    process.exit(0);
  });
  // Force exit if drain takes too long
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
```

---

## 8. Health Check Endpoint

```js
// routes/healthRoutes.js
import { version } from '../../package.json' assert { type: 'json' };

router.get('/health', asyncRoute(async (req, res) => {
  const dbOk = await checkDbConnection();  // simple SELECT 1
  const cacheOk = await checkCacheConnection();
  const status = dbOk && cacheOk ? 200 : 503;
  res.status(status).json({
    status: status === 200 ? 'ok' : 'degraded',
    version,
    uptime: process.uptime(),
    db: dbOk ? 'ok' : 'error',
    cache: cacheOk ? 'ok' : 'error',
  });
}));
```

**Rule**: Load balancers and orchestrators (K8s, ECS) hit `/health` to decide if the instance is live.
Always return `503` (not `500`) when a dependency is down — it signals "remove from rotation, not "crash".

---

## 9. Logger Utility (replaces console.log)

```js
// utils/logger.js
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});

export default logger;
```

**Rule**: Import `logger` everywhere. Never use `console.log/error/warn` in production code.
