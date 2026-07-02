const { test } = require('node:test');
const assert = require('node:assert');
const createRateLimiter = require('../middleware/rateLimitMiddleware');
const { makeReq, makeRes } = require('./helpers');

const run = (limiter, ip) => {
  const req = makeReq({ ip, socket: { remoteAddress: ip } });
  const res = makeRes();
  let passed = false;
  limiter(req, res, () => { passed = true; });
  return { res, passed };
};

test('allows requests up to the max, then blocks with 429', () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });
  assert.strictEqual(run(limiter, '1.1.1.1').passed, true);
  assert.strictEqual(run(limiter, '1.1.1.1').passed, true);
  assert.strictEqual(run(limiter, '1.1.1.1').passed, true);

  const blocked = run(limiter, '1.1.1.1');
  assert.strictEqual(blocked.passed, false);
  assert.strictEqual(blocked.res.statusCode, 429);
  assert.ok(blocked.res.headers['Retry-After']);
});

test('tracks limits per client IP independently', () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
  assert.strictEqual(run(limiter, '2.2.2.2').passed, true);
  assert.strictEqual(run(limiter, '2.2.2.2').passed, false);
  // A different IP still gets its own fresh allowance.
  assert.strictEqual(run(limiter, '3.3.3.3').passed, true);
});

test('resets the allowance after the window elapses', () => {
  const limiter = createRateLimiter({ windowMs: -1, max: 1 }); // window already expired
  assert.strictEqual(run(limiter, '4.4.4.4').passed, true);
  // Because resetAt is in the past, the next request starts a fresh window instead of blocking.
  assert.strictEqual(run(limiter, '4.4.4.4').passed, true);
});
