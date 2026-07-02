# MediCore Pro — Hosting & Deployment Guide

This guide takes you from a fresh clone to a fully running system: a **Supabase** database, the
**Node.js/Express backend**, and the **Expo React Native app** on your phone. Follow the parts in
order. No prior DevOps experience is assumed — every command is spelled out.

```
Phone (Expo Go app)  ──►  Backend API (Express)  ──►  Supabase (PostgreSQL)
```

---

## 0. Prerequisites (install these once)

| Tool | Why | Check it's installed |
|---|---|---|
| **Node.js 18 or newer** ([download](https://nodejs.org/)) | Runs the backend and Expo tooling | `node -v` |
| **npm** (ships with Node) | Installs dependencies | `npm -v` |
| **Git** | Clone / manage the code | `git --version` |
| **Expo Go app** (iOS App Store / Google Play) | Runs the mobile app on your phone | — |
| A **Supabase** account ([supabase.com](https://supabase.com), free) | Hosted PostgreSQL database | — |

Your **computer and your phone must be on the same Wi-Fi network** for local development.

---

## Part A — Set up the database (Supabase)

### A.1 Create the project
1. Go to <https://supabase.com> → **Sign in** → **New project**.
2. Give it a name (e.g. `medicore-pro`), set a strong **database password** (save it somewhere), pick
   the region closest to you, and click **Create new project**. Wait ~2 minutes for it to provision.

### A.2 Run the schema and seed data
1. In the Supabase dashboard, open the **SQL Editor** (left sidebar).
2. Click **+ New query**. Open the file `backend/config/schema.sql` from this repo, copy **all** of it,
   paste it into the editor, and click **Run**. This creates every table, index, and constraint.
3. Click **+ New query** again. Open `backend/config/seed.sql`, copy all of it, paste, and **Run**.
   This loads the demo users, patients, doctors, appointments, invoices, etc.

> ✅ After this, all demo accounts exist with the password **`password123`** (see the README table).

### A.3 Collect your keys
In the Supabase dashboard go to **Project Settings → API** and copy these three values:

| Value in Supabase | Use it for |
|---|---|
| **Project URL** (e.g. `https://abcd1234.supabase.co`) | `SUPABASE_URL` |
| **`service_role` secret key** | `SUPABASE_SERVICE_ROLE_KEY` (backend only — **keep secret**) |
| **`anon` public key** | `EXPO_PUBLIC_SUPABASE_ANON_KEY` (safe for the app) |

> ⚠️ The **service_role key bypasses all row security**. It must live **only** in the backend `.env`
> and must **never** be committed to Git or placed in the frontend.

---

## Part B — Run the backend

### B.1 Configure environment
1. In a terminal: `cd backend`
2. Copy the example env file:
   - macOS/Linux: `cp .env.example .env`
   - Windows (PowerShell): `Copy-Item .env.example .env`
3. Open `backend/.env` and fill it in:

```env
PORT=5000
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=change-me-to-a-long-random-string-at-least-32-characters
```

> **`JWT_SECRET` must be at least 32 characters** or the API refuses to issue tokens (fail-closed by
> design). Generate a strong one with:
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

**Optional tuning** (safe defaults are built in — only set these if you need to):

| Variable | Default | Meaning |
|---|---|---|
| `AUTH_RATE_LIMIT_MAX` | `10` | Max login/register/forgot-password attempts per window per IP |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | Auth rate-limit window |
| `GENERAL_RATE_LIMIT_MAX` | `300` | Max requests per window per IP across the whole API |
| `GENERAL_RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | General rate-limit window |
| `CORS_ORIGIN` | (empty) | Comma-separated allowed origins **in production only** |

### B.2 Install and start
```bash
npm install
npm run dev      # auto-reloads on changes (development)
# or: npm start  # plain run (production)
```

You should see:
```
[INFO] Supabase client initialized successfully (service_role).
[OK] Express Server listening on port 5000
```
If you instead see `[WARN] Supabase is not fully configured`, your `.env` values are missing or still
contain the placeholder text — fix them and restart.

### B.3 Verify the backend
```bash
npm test          # runs the unit test suite (should report pass, fail 0)
npm run syntax    # sanity-checks every .js file parses

curl http://localhost:5000/            # -> {"status":"online", ...}
```

### B.4 Deploy the backend (optional — for a phone that isn't on your Wi-Fi)

Any Node host works. **[Render](https://render.com)** has a free tier and is the simplest:

1. Push this repo to GitHub.
2. Render → **New → Web Service** → connect the repo.
3. Set **Root Directory** = `backend`, **Build Command** = `npm install`,
   **Start Command** = `npm start`.
4. Under **Environment**, add every variable from `backend/.env`
   (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `JWT_SECRET`), plus:
   - `NODE_ENV=production`
   - `CORS_ORIGIN=` your app's origin(s) if you serve it on the web.
5. Deploy. Render gives you a public URL like `https://medicore-api.onrender.com`.
   Your API base URL is that + `/api` → `https://medicore-api.onrender.com/api`.

> Note: the built-in rate limiter is **in-memory**, so it resets on restart and is per-instance. For a
> multi-instance deployment, move it to a shared store (Redis). Fine as-is for a single instance/demo.

---

## Part C — Run the mobile app (Expo)

### C.1 Configure environment
1. In a **new** terminal: `cd frontend`
2. Create the env file:
   - macOS/Linux: `cp .env.example .env`
   - Windows: `Copy-Item .env.example .env`
3. Edit `frontend/.env`:

```env
# For LOCAL dev, the app auto-detects your computer's IP from Expo, so this can stay as-is.
# Set it explicitly only when pointing at a deployed backend.
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **How the API URL is resolved** (see `src/services/api.ts`): in development the app automatically
> uses your computer's Expo/Metro host IP, so you usually **don't** need to find your IP by hand. If
> that fails, it falls back to `EXPO_PUBLIC_API_URL`. When using a **deployed** backend (Part B.4), set
> `EXPO_PUBLIC_API_URL` to your public URL, e.g. `https://medicore-api.onrender.com/api`.
>
> To find your local IP manually if needed: Windows `ipconfig` (IPv4 Address), macOS/Linux
> `ifconfig | grep inet` — use the `192.168.x.x` address.

### C.2 Install and start
```bash
npm install
npm run typecheck   # optional: confirms TypeScript is clean
npx expo start
```
A QR code prints in the terminal.

### C.3 Open it on your phone
- **Android:** open **Expo Go** → **Scan QR code**.
- **iOS:** open the **Camera** app, point at the QR code, tap the banner.

The app loads over Wi-Fi. Log in with any seeded account (e.g. `admin@medicore.com` / `password123`).

### C.4 Build a standalone app (optional)
To hand someone an installable build instead of Expo Go, use **EAS Build**:
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # produces an .apk/.aab you can share
```
Set the same `EXPO_PUBLIC_*` variables in your EAS project (they must point at a **deployed** backend,
since a build won't be on your dev Wi-Fi). See <https://docs.expo.dev/build/introduction/>.

---

## Smoke test (end-to-end)

1. Backend running and showing the `service_role` init line.
2. `curl http://localhost:5000/` returns `status: online`.
3. In the app, log in as `admin@medicore.com` / `password123` → the Admin dashboard loads with real data.
4. Log in as `sarah.chen@medicore.com` (Doctor) → today's patient queue and appointments appear.
5. Tap **Forgot Password?** on the login screen → enter any email → you get a neutral confirmation.

---

## Troubleshooting

| Symptom | Cause & fix |
|---|---|
| `[WARN] Supabase is not fully configured` | `backend/.env` missing values or still has placeholder text. |
| Login returns **"Authentication is not configured"** (503) | `JWT_SECRET` missing or shorter than 32 chars. |
| Login returns **"Invalid email or password"** with the seed accounts | `seed.sql` wasn't run, or you used the wrong password — it's **`password123`**. |
| App shows **"Connection failed. Ensure backend server is running."** | Phone can't reach the backend: not on the same Wi-Fi, backend not started, or a firewall is blocking port 5000. For a deployed backend, set `EXPO_PUBLIC_API_URL`. |
| **429 Too Many Requests** | Rate limiter tripped. Wait for the window (default 15 min) or raise `*_RATE_LIMIT_MAX` in the backend env. |
| CORS error (web only) | In production set `CORS_ORIGIN` to your web origin; leave `NODE_ENV` unset locally to allow all origins. |

---

## Security checklist before going public

- [ ] `JWT_SECRET` is a unique, random 32+ char string (not the example value).
- [ ] The `service_role` key is only in the backend host's env — never in Git or the app.
- [ ] `NODE_ENV=production` and `CORS_ORIGIN` are set on the deployed backend.
- [ ] The seeded demo accounts are removed or their passwords rotated.
- [ ] Password-reset email delivery is wired (currently the request is recorded for an admin to fulfil —
      see `forgotPassword` in `backend/controllers/authController.js`).
