// Minimal Express req/res doubles for unit-testing middleware and utils without a running server.

const makeRes = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    set(key, value) {
      this.headers[key] = value;
      return this;
    },
  };
  return res;
};

const makeReq = (overrides = {}) => ({
  headers: {},
  query: {},
  body: {},
  params: {},
  ...overrides,
});

module.exports = { makeRes, makeReq };
