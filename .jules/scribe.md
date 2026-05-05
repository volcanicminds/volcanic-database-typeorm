## 2026-05-05 - Global Repository Proxy Mechanism
**Learning:** `index.ts` implements a FAIL-FAST proxy on `global.repository` that explicitly throws a FATAL error when direct access is attempted. This enforces the Context-Aware Service pattern (e.g., `service.use(req.db)`).
**Action:** When updating or writing documentation related to database access, explicitly instruct developers to avoid using `global.repository` and provide examples using the repository from the request context.

## 2026-05-05 - Environment Variable Configurations
**Learning:** `index.ts` and `lib/query.ts` rely on environment variables (like `LOG_DB_LEVEL` and `VOLCANIC_CUSTOM_QUERY_OPERATORS`) for core runtime configuration, but these were missing from a dedicated documentation section.
**Action:** When adding new runtime flags or configurations via environment variables in the codebase, always update `docs/configuration.md` to keep the reference complete.
