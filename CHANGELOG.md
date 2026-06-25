# Changelog

All notable project changes are recorded here.

## [Unreleased]

### Added

- Sprint 0 development-baseline scripts for frontend type checking and backend syntax/tests.
- Empty backend service, repository, validator, and test directories for incremental migration.
- Empty frontend core, feature, component, type, and development-fixture directories for incremental migration.
- Sprint 0 Step 2A authentication security contract tests using mocked Supabase and no live database; role escalation, required-JWT-secret, and rate-limit tests are intentionally red until hardening.
- Login-only failed-attempt rate limiting with a five-attempt, 15-minute policy.
- Sprint 0 Step 3A reusable request validators, role-policy constants, ownership middleware foundation, and focused authorization tests.
- Sprint 0 Step 4A SecureStore-backed frontend session storage service and AuthContext bootstrap.

### Changed

- Environment templates now describe the variables currently used by the applications.
- README setup guidance now uses lockfile-based installs and avoids unsupported demo and fallback claims.
- Public registration now creates Patient accounts only; JWT signing requires a configured secret; password verification is bcrypt-only.
- Frontend authentication now stores only the access token and safe public user identity fields in Expo SecureStore.

### Notes

- No authentication, API versioning, database schema, role permissions, or legacy-screen behavior changed in this baseline.
