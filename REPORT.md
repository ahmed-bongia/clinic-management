# Final QA, Security, and Submission Report

## Completed modules

- Authentication, registration, profile retrieval, password change, logout
- Admin dashboard and user/staff management
- Doctor dashboard, appointments, patients, laboratory workflow
- Patient dashboard, booking, records, laboratory results
- Reception patient, appointment, waiting-room, billing and payment workflows
- Pharmacy medicine and inventory workflows
- Laboratory test/result workflows

## Database summary

The schema defines users, patients, doctors, doctor schedules, appointments, invoices, invoice items, payments, medicines, lab tests, and audit logs. It includes foreign keys, constrained role/status values, indexes, and a partial unique `(doctor_id, appointment_date)` index for active appointments.

## Security measures verified

- Passwords are written with bcrypt and auth/user responses select safe fields only.
- Legacy plaintext password comparison was removed.
- JWTs require a configured secret of at least 32 characters.
- Protected routes require a valid bearer token; role middleware returns 403 for unauthorized roles.
- Every protected request refreshes the user’s current role and `is_active` status, so deactivated users and role changes take effect immediately.
- Tokens are stored in Expo SecureStore, not AsyncStorage.
- `.env` patterns are ignored by Git; tracked-file review found no environment files.
- Appointment access is scoped to the signed-in patient or doctor where applicable.

## QA checklist

| Check | Result |
| --- | --- |
| Frontend TypeScript compilation | Passed |
| Backend JavaScript syntax validation | Passed |
| Public API health endpoint | Ready for smoke test |
| Missing-token protected endpoint response | Returns 401 |
| Invalid/expired JWT response | Returns 401 |
| Inactive user login | Rejected by login query |
| Deactivated user with old token | Rejected by auth middleware |
| Role mismatch | Rejected with 403 by role middleware |
| Appointment double-booking | Protected by database unique index; controller maps conflict to 409 |

## Bugs found and fixes applied

1. Plaintext password fallback could authenticate legacy unencrypted records. Removed; passwords must be bcrypt hashes.
2. A deactivated account could continue using a previously issued JWT. Auth middleware now checks current account status and role on every protected request.
3. Patient booking payloads could name another patient, and appointment detail/update endpoints were not ownership-scoped. Added ownership checks.
4. A default JWT secret made a misconfigured deployment unsafe. Authentication now fails closed until a proper secret is supplied.
5. The token was stored in AsyncStorage. It now uses Expo SecureStore and existing sessions are validated on app launch.
6. README contained outdated plaintext demo credentials and claimed an unconfigured database had a demo fallback. Documentation now reflects actual behavior.

## Sprint 5 updates (2026-07-02)

- **Automated tests added.** A `node:test` unit suite covers the response envelope, JWT policy, role and
  auth middleware, the rate limiter, and pagination (25 tests, all passing via `npm test`).
- **Password recovery wired.** `POST /api/auth/forgot-password` and a `ForgotPasswordScreen` replace the
  dead placeholder. The endpoint is rate-limited and non-enumerating (identical response regardless of
  whether the email exists); it records the request for an administrator. Email delivery is the remaining
  follow-up.
- **Global rate limiting added.** A general limiter now guards all `/api` traffic on top of the stricter
  auth limiter.
- **Pagination added** (opt-in) to `GET /api/patients` via `?page`/`?limit`, with paging metadata in
  response headers and no change to the existing array body.
- **Dead code removed.** The unused `frontend/src/screens/laboratory/` duplicate was deleted.
- **Credential bug fixed.** README demo credentials now match `seed.sql` (password is `password123`).

## Remaining limitations / future enhancements

- A configured Supabase test environment is still needed for full live CRUD and DB-constraint tests per role.
- Password-reset **email/SMS delivery** is not yet wired (requests are recorded for an admin to fulfil).
- Pagination is implemented on the patients list as the reference pattern; extend it to the remaining
  list endpoints (appointments, invoices, medicines, lab queue) as needed.
- The in-memory rate limiter is per-instance; use a shared store (e.g. Redis) for multi-instance deploys.
- Add end-to-end (API + mobile) coverage on top of the new unit suite.
