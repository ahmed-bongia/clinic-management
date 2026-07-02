const { test } = require('node:test');
const assert = require('node:assert');
const roleMiddleware = require('../middleware/roleMiddleware');
const { makeReq, makeRes } = require('./helpers');

test('rejects with 401 when no authenticated user is present', () => {
  const req = makeReq();
  const res = makeRes();
  let nextCalled = false;
  roleMiddleware(['Admin'])(req, res, () => { nextCalled = true; });
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nextCalled, false);
});

test('rejects with 403 when the user role is not allowed', () => {
  const req = makeReq({ user: { role: 'Patient' } });
  const res = makeRes();
  let nextCalled = false;
  roleMiddleware(['Admin', 'Receptionist'])(req, res, () => { nextCalled = true; });
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(nextCalled, false);
});

test('calls next() when the user role is allowed', () => {
  const req = makeReq({ user: { role: 'Doctor' } });
  const res = makeRes();
  let nextCalled = false;
  roleMiddleware(['Doctor'])(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
});
