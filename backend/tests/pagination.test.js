const { test } = require('node:test');
const assert = require('node:assert');
const { parsePagination, setPaginationHeaders, DEFAULT_LIMIT, MAX_LIMIT } = require('../utils/pagination');
const { makeRes } = require('./helpers');

test('pagination is disabled when no page/limit params are present', () => {
  const p = parsePagination({});
  assert.strictEqual(p.enabled, false);
});

test('page/limit produce a correct zero-based range', () => {
  const p = parsePagination({ page: '2', limit: '10' });
  assert.strictEqual(p.enabled, true);
  assert.strictEqual(p.page, 2);
  assert.strictEqual(p.limit, 10);
  assert.strictEqual(p.from, 10);
  assert.strictEqual(p.to, 19);
});

test('providing only limit enables pagination and defaults page to 1', () => {
  const p = parsePagination({ limit: '5' });
  assert.strictEqual(p.enabled, true);
  assert.strictEqual(p.page, 1);
  assert.strictEqual(p.from, 0);
  assert.strictEqual(p.to, 4);
});

test('invalid values fall back to defaults', () => {
  const p = parsePagination({ page: '-3', limit: 'abc' });
  assert.strictEqual(p.page, 1);
  assert.strictEqual(p.limit, DEFAULT_LIMIT);
});

test('limit is capped at MAX_LIMIT', () => {
  const p = parsePagination({ limit: '9999' });
  assert.strictEqual(p.limit, MAX_LIMIT);
});

test('setPaginationHeaders emits total, pages, page and limit', () => {
  const res = makeRes();
  setPaginationHeaders(res, { total: 45, page: 2, limit: 10 });
  assert.strictEqual(res.headers['X-Total-Count'], '45');
  assert.strictEqual(res.headers['X-Total-Pages'], '5');
  assert.strictEqual(res.headers['X-Page'], '2');
  assert.strictEqual(res.headers['X-Page-Limit'], '10');
});

test('setPaginationHeaders omits totals when count is unknown', () => {
  const res = makeRes();
  setPaginationHeaders(res, { total: null, page: 1, limit: 10 });
  assert.ok(!('X-Total-Count' in res.headers));
  assert.strictEqual(res.headers['X-Page'], '1');
});
