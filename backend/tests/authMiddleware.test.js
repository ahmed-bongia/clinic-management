// A valid JWT secret is set so the middleware reaches its token-verification branch.
process.env.JWT_SECRET = 'test_secret_key_that_is_at_least_32_chars_long';

const { test } = require('node:test');
const assert = require('node:assert');
const authMiddleware = require('../middleware/authMiddleware');
const { makeReq, makeRes } = require('./helpers');

test('rejects with 401 when no Authorization header is present', async () => {
  const req = makeReq();
  const res = makeRes();
  let nextCalled = false;
  await authMiddleware(req, res, () => { nextCalled = true; });
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nextCalled, false);
});

test('rejects with 401 when the header is not a Bearer token', async () => {
  const req = makeReq({ headers: { authorization: 'Basic abc123' } });
  const res = makeRes();
  await authMiddleware(req, res, () => {});
  assert.strictEqual(res.statusCode, 401);
});

test('rejects with 401 for a malformed/expired bearer token', async () => {
  const req = makeReq({ headers: { authorization: 'Bearer not.a.real.token' } });
  const res = makeRes();
  await authMiddleware(req, res, () => {});
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.success, false);
});
