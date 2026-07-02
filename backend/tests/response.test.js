const { test } = require('node:test');
const assert = require('node:assert');
const { successResponse, errorResponse } = require('../utils/response');
const { makeRes } = require('./helpers');

test('successResponse uses default 200 and success envelope', () => {
  const res = makeRes();
  successResponse(res, 'ok', { a: 1 });
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body, { success: true, message: 'ok', data: { a: 1 } });
});

test('successResponse honours a custom status code', () => {
  const res = makeRes();
  successResponse(res, 'created', { id: 5 }, 201);
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.success, true);
});

test('successResponse defaults data to an empty object', () => {
  const res = makeRes();
  successResponse(res, 'done');
  assert.deepStrictEqual(res.body.data, {});
});

test('errorResponse defaults to 500 and omits errors when none given', () => {
  const res = makeRes();
  errorResponse(res, 'boom');
  assert.strictEqual(res.statusCode, 500);
  assert.deepStrictEqual(res.body, { success: false, message: 'boom' });
  assert.ok(!('errors' in res.body));
});

test('errorResponse includes detailed errors when provided', () => {
  const res = makeRes();
  errorResponse(res, 'bad', 400, [{ field: 'email' }]);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.body.errors, [{ field: 'email' }]);
});
