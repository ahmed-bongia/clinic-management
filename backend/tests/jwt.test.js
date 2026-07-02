// Set a valid secret BEFORE requiring the module, since jwt.js reads JWT_SECRET at load time.
process.env.JWT_SECRET = 'test_secret_key_that_is_at_least_32_chars_long';

const { test } = require('node:test');
const assert = require('node:assert');
const { generateToken, verifyToken, isJwtConfigured } = require('../utils/jwt');

test('isJwtConfigured is true when a 32+ char secret is set', () => {
  assert.strictEqual(isJwtConfigured(), true);
});

test('generateToken then verifyToken round-trips the payload', () => {
  const token = generateToken({ id: 'u1', role: 'Doctor', email: 'd@x.com', name: 'Doc' });
  assert.strictEqual(typeof token, 'string');
  const decoded = verifyToken(token);
  assert.strictEqual(decoded.id, 'u1');
  assert.strictEqual(decoded.role, 'Doctor');
});

test('verifyToken returns null for a tampered/garbage token', () => {
  assert.strictEqual(verifyToken('not.a.valid.token'), null);
});

test('verifyToken returns null for a token signed with a different secret', () => {
  const jwt = require('jsonwebtoken');
  const foreign = jwt.sign({ id: 'x' }, 'some_other_secret_value_used_elsewhere_only', { expiresIn: '1h' });
  assert.strictEqual(verifyToken(foreign), null);
});
