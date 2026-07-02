// Shared pagination helper for list endpoints.
// Pagination is opt-in: a request only paginates when it sends `page` or `limit`, so existing
// clients that expect the full array keep working unchanged.

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/**
 * Parse pagination query params into a safe { page, limit, from, to } range for Supabase `.range()`.
 * @param {object} query - Express req.query
 * @returns {{ enabled: boolean, page: number, limit: number, from: number, to: number }}
 */
const parsePagination = (query = {}) => {
  const hasPageParam = query.page !== undefined || query.limit !== undefined;

  const rawPage = parseInt(query.page, 10);
  const rawLimit = parseInt(query.limit, 10);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { enabled: hasPageParam, page, limit, from, to };
};

/**
 * Attach standard pagination headers so clients can page without changing the JSON body shape.
 * @param {object} res - Express response
 * @param {{ total: number|null, page: number, limit: number }} meta
 */
const setPaginationHeaders = (res, { total, page, limit }) => {
  if (typeof total === 'number') {
    res.set('X-Total-Count', String(total));
    res.set('X-Total-Pages', String(Math.max(1, Math.ceil(total / limit))));
  }
  res.set('X-Page', String(page));
  res.set('X-Page-Limit', String(limit));
};

module.exports = { parsePagination, setPaginationHeaders, DEFAULT_LIMIT, MAX_LIMIT };
