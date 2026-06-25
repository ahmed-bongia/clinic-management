const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const errorMiddleware = require('../middleware/errorMiddleware');
const { requireResourceAccess } = require('../middleware/ownershipMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const { createAppointmentValidators } = require('../validators/requestValidators');

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

const invoke = async (middleware, req) => {
  const res = createResponse();
  let nextCalled = false;
  await middleware(req, res, () => {
    nextCalled = true;
  });
  return { nextCalled, res };
};

test('missing appointment fields return a safe 400 validation response', async () => {
  const app = express();
  app.use(express.json());
  app.post('/appointments', createAppointmentValidators, validationMiddleware, (req, res) => res.status(204).end());

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(Array.isArray(body.errors), true);
    assert.equal('stack' in body, false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('invalid role access returns 403', async () => {
  const { nextCalled, res } = await invoke(roleMiddleware(['Admin']), { user: { role: 'Patient' } });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, 'Forbidden.');
});

test('missing credentials on a protected route return 401', async () => {
  const { nextCalled, res } = await invoke(authMiddleware, { headers: {} });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('ownership middleware denies a patient when ownership verification fails', async () => {
  const middleware = requireResourceAccess({
    resource: 'patient',
    ownershipRoles: ['Patient'],
    ownershipCheck: async () => false,
  });
  const { nextCalled, res } = await invoke(middleware, { user: { id: 'user-1', role: 'Patient' } });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test('ownership middleware allows Admin without an ownership lookup', async () => {
  let ownershipChecked = false;
  const middleware = requireResourceAccess({
    resource: 'patient',
    ownershipRoles: ['Patient'],
    ownershipCheck: async () => {
      ownershipChecked = true;
      return false;
    },
  });
  const { nextCalled, res } = await invoke(middleware, { user: { id: 'admin-1', role: 'Admin' } });

  assert.equal(nextCalled, true);
  assert.equal(ownershipChecked, false);
  assert.equal(res.body, undefined);
});

test('global errors never expose a stack trace', async () => {
  const res = createResponse();
  errorMiddleware(new Error('internal test error'), {}, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, 'An internal server error occurred.');
  assert.equal('errors' in res.body, false);
});
