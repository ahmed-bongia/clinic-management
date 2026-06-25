const assert = require('node:assert/strict');
const test = require('node:test');
const bcrypt = require('bcryptjs');

const {
  createLoginSupabase,
  createRegistrationSupabase,
  createResponse,
  loadAuthController,
  startAuthServer,
} = require('./helpers/auth-test-utils.cjs');

let testQueue = Promise.resolve();

const serialTest = (name, fn) => test(name, async () => {
  const previousTest = testQueue;
  let releaseNextTest;
  testQueue = new Promise((resolve) => {
    releaseNextTest = resolve;
  });

  await previousTest;
  try {
    await fn();
  } finally {
    releaseNextTest();
  }
});
const restrictedPublicRoles = ['Admin', 'Doctor', 'Receptionist', 'Laboratory Staff', 'Pharmacist'];

for (const role of restrictedPublicRoles) {
  serialTest(`public registration must not grant the ${role} role`, async () => {
    const registration = createRegistrationSupabase();
    const { register } = loadAuthController({ supabase: registration.supabase });
    const response = createResponse();

    await register(
      { body: { fullName: 'Security Test User', email: `${role.toLowerCase().replaceAll(' ', '.')}@example.com`, password: 'password123', role } },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.data.user.role, 'Patient');
    assert.equal(registration.createdUsers[0].role, 'Patient');
  });
}

serialTest('public registration may create a Patient account', async () => {
  const registration = createRegistrationSupabase();
  const { register } = loadAuthController({ supabase: registration.supabase });
  const response = createResponse();

  await register(
    { body: { fullName: 'Patient Test User', email: 'patient@example.com', password: 'password123', role: 'Patient' } },
    response,
    assert.fail,
  );

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.user.role, 'Patient');
  assert.equal(registration.createdUsers[0].role, 'Patient');
  assert.equal(registration.createdPatients.length, 1);
});

serialTest('login must fail closed when JWT_SECRET is not configured', async () => {
  const passwordHash = await bcrypt.hash('correct-password', 4);
  const { login } = loadAuthController({
    supabase: createLoginSupabase({
      id: 'user-1',
      name: 'Configured User',
      email: 'configured@example.com',
      role: 'Patient',
      is_active: true,
      password_hash: passwordHash,
    }),
    jwtSecret: undefined,
  });
  const response = createResponse();

  await login({ body: { email: 'configured@example.com', password: 'correct-password' } }, response, assert.fail);

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.success, false);
});

serialTest('login rejects an invalid password', async () => {
  const passwordHash = await bcrypt.hash('correct-password', 4);
  const { login } = loadAuthController({
    supabase: createLoginSupabase({
      id: 'user-2',
      name: 'Active User',
      email: 'active@example.com',
      role: 'Patient',
      is_active: true,
      password_hash: passwordHash,
    }),
  });
  const response = createResponse();

  await login({ body: { email: 'active@example.com', password: 'wrong-password' } }, response, assert.fail);

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Invalid email or password.');
});

serialTest('login rejects an inactive user', async () => {
  const { login } = loadAuthController({
    supabase: createLoginSupabase({
      id: 'user-3',
      name: 'Inactive User',
      email: 'inactive@example.com',
      role: 'Patient',
      is_active: false,
      password_hash: await bcrypt.hash('correct-password', 4),
    }),
  });
  const response = createResponse();

  await login({ body: { email: 'inactive@example.com', password: 'correct-password' } }, response, assert.fail);

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Invalid email or password.');
});

serialTest('login returns a token and a public user profile for valid credentials', async () => {
  const passwordHash = await bcrypt.hash('correct-password', 4);
  const { login } = loadAuthController({
    supabase: createLoginSupabase({
      id: 'user-4',
      name: 'Valid User',
      email: 'valid@example.com',
      role: 'Doctor',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      password_hash: passwordHash,
    }),
  });
  const response = createResponse();

  await login({ body: { email: 'valid@example.com', password: 'correct-password' } }, response, assert.fail);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(typeof response.body.data.token, 'string');
  assert.deepEqual(response.body.data.user, {
    id: 'user-4',
    name: 'Valid User',
    role: 'Doctor',
    email: 'valid@example.com',
  });
  assert.equal('password_hash' in response.body.data.user, false);
  assert.equal('is_active' in response.body.data.user, false);
  assert.equal('created_at' in response.body.data.user, false);
});

serialTest('repeated invalid login attempts must return 429 after five failures', async () => {
  const server = await startAuthServer({ supabase: createLoginSupabase(null) });

  try {
    const attempts = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      attempts.push(await server.login({ email: 'unknown@example.com', password: 'wrong-password' }));
    }

    assert.deepEqual(attempts.slice(0, 5).map(({ status }) => status), [401, 401, 401, 401, 401]);
    assert.equal(attempts[5].status, 429);
  } finally {
    await server.close();
  }
});
