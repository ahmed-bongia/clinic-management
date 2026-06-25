const { once } = require('node:events');

const modulePaths = {
  authController: require.resolve('../../controllers/authController'),
  authRoutes: require.resolve('../../routes/authRoutes'),
  jwt: require.resolve('../../utils/jwt'),
  supabase: require.resolve('../../config/supabase'),
};

const clearAuthModules = () => {
  delete require.cache[modulePaths.authRoutes];
  delete require.cache[modulePaths.authController];
  delete require.cache[modulePaths.jwt];
  delete require.cache[modulePaths.supabase];
};

const configureAuthModules = (options) => {
  const { supabase } = options;
  const jwtSecret = Object.hasOwn(options, 'jwtSecret') ? options.jwtSecret : 'auth-security-test-secret';

  if (jwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = jwtSecret;
  }

  clearAuthModules();
  require.cache[modulePaths.supabase] = {
    id: modulePaths.supabase,
    filename: modulePaths.supabase,
    loaded: true,
    exports: { supabase, isConfigured: () => !!supabase },
  };
};

const loadAuthController = (options) => {
  configureAuthModules(options);
  return require(modulePaths.authController);
};

const loadAuthRoutes = (options) => {
  configureAuthModules(options);
  return require(modulePaths.authRoutes);
};

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

const createLoginSupabase = (user) => ({
  from(table) {
    if (table === 'users') {
      const filters = [];
      return {
        select() {
          return this;
        },
        eq(field, value) {
          filters.push([field, value]);
          return this;
        },
        async single() {
          const activeUserRequired = filters.some(([field, value]) => field === 'is_active' && value === true);
          const visibleUser = activeUserRequired && user?.is_active !== true ? null : user;
          return {
            data: visibleUser || null,
            error: visibleUser ? null : { message: 'No matching user' },
          };
        },
      };
    }

    if (table === 'audit_logs') {
      return { insert: () => Promise.resolve({ data: null, error: null }) };
    }

    throw new Error(`Unexpected Supabase table: ${table}`);
  },
});

const createRegistrationSupabase = () => {
  const createdUsers = [];
  const createdPatients = [];

  return {
    createdUsers,
    createdPatients,
    supabase: {
      from(table) {
        if (table === 'users') {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            async maybeSingle() {
              return { data: null, error: null };
            },
            insert(input) {
              createdUsers.push(input);
              return {
                select: () => ({
                  single: async () => ({
                    data: { id: `user-${createdUsers.length}`, email: input.email, name: input.name, role: input.role },
                    error: null,
                  }),
                }),
              };
            },
          };
        }

        if (table === 'patients') {
          return {
            insert: async (input) => {
              createdPatients.push(input);
              return { data: input, error: null };
            },
          };
        }

        if (table === 'audit_logs') {
          return { insert: () => Promise.resolve({ data: null, error: null }) };
        }

        throw new Error(`Unexpected Supabase table: ${table}`);
      },
    },
  };
};

const startAuthServer = async (options) => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/api/auth', loadAuthRoutes(options));

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();

  return {
    async login(payload) {
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return { status: response.status, body: await response.json() };
    },
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
};

module.exports = {
  createLoginSupabase,
  createRegistrationSupabase,
  createResponse,
  loadAuthController,
  startAuthServer,
};
