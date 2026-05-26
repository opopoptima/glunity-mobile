# Glunity Mobile Y - Engineering Audit

Generated from a repository-wide review of the mobile app, API, docs, and workspace structure.

## Executive Summary

The project has a solid product direction and a reasonably clear split between the API and mobile app, but it is not yet production-ready. The largest gaps are in backend security hardening, test coverage, real-time infrastructure, and consistency between the app shell and screen-level implementations. The mobile app has already moved toward a shared navigation shell, but the codebase still contains a mix of legacy screen-level headers, hardcoded theme values, and several areas where the runtime can fail before Metro finishes bundling.

Current overall posture:

- Security readiness: weak to moderate
- Test readiness: weak
- Performance readiness: moderate, with several easy wins
- Maintainability: moderate, but uneven across modules
- Production readiness: not yet acceptable without remediation

## Top Findings

### 1. Security middleware is incomplete

The API has placeholder or empty security configuration files, so core protections are not fully enforced. This includes HTTP security headers, rate limiting, and request hardening.

Affected files:

- [api/src/app/config/security.js](api/src/app/config/security.js)
- [api/src/app/config/rate-limit.js](api/src/app/config/rate-limit.js)
- [api/src/app/app.js](api/src/app/app.js)

Risk:

- Brute force and abuse protection is weak.
- The app may be missing baseline security headers.
- Auth endpoints are not clearly protected with tighter limits.

Recommended actions:

- Add Helmet and configure a strict baseline header policy.
- Add express-rate-limit with separate policies for auth and general routes.
- Add request timeout protection for slow or hanging calls.
- Verify CORS, cookie, and JWT settings against production requirements.

### 2. Test coverage and CI quality gates are insufficient

The repository has a testing strategy documented, but the actual test execution and lint enforcement appear incomplete. This creates a risk that broken code can ship without a meaningful gate.

Affected files:

- [api/package.json](api/package.json)
- [mobile/package.json](mobile/package.json)
- [docs/05-testing-strategy.md](docs/05-testing-strategy.md)
- [.github/workflows](.github/workflows)

Risk:

- No strong enforcement of unit, integration, or contract tests.
- Regression risk is high for auth, network, and navigation changes.

Recommended actions:

- Make test scripts real and enforce them in CI.
- Add contract coverage for API envelopes and auth flows.
- Add lint and typecheck jobs before merge.
- Introduce smoke tests for mobile boot and API health.

### 3. Real-time architecture is not implemented

The realtime layer is referenced in the structure, but key implementations are empty or missing dependencies.

Affected files:

- [api/src/app/realtime](api/src/app/realtime)
- [api/package.json](api/package.json)

Risk:

- Notifications, channel events, and live collaboration features will not function.
- The structure gives an impression of capability that does not yet exist.

Recommended actions:

- Add the realtime transport dependency and wire it into server bootstrap.
- Define auth-checked socket connection handling.
- Add event contracts before adding UI features that depend on live updates.

### 4. Mobile API/network layer needs robustness work

The mobile network layer has a known risk around concurrent refresh handling, and the app still relies on screen-level patterns that are easy to break during refactors.

Affected files:

- [mobile/src/core/network/http.client.ts](mobile/src/core/network/http.client.ts)
- [mobile/src/core/network/http.auth-interceptor.ts](mobile/src/core/network/http.auth-interceptor.ts)
- [mobile/src/core/network/http.error-interceptor.ts](mobile/src/core/network/http.error-interceptor.ts)

Risk:

- Multiple 401s can trigger parallel refresh attempts.
- Errors may surface inconsistently across screens.
- Transient network failures are not handled as gracefully as they should be.

Recommended actions:

- Serialize refresh attempts with a single-flight lock or queue.
- Add timeout and retry policy for transient failures.
- Standardize error mapping to a single app error shape.

## High Priority Findings

### 5. API versioning is missing

Routes are not clearly versioned, which makes future breaking changes much harder to manage.

Affected files:

- [api/src/app/app.js](api/src/app/app.js)

Recommended actions:

- Prefix the public API with a versioned base path.
- Align docs and mobile config with the same versioned route.
- Preserve backwards compatibility when introducing changes.

### 6. Logging is not production-grade

The backend logging approach is still too basic for production use.

Affected files:

- [api/src/app/bootstrap/logger.bootstrap.js](api/src/app/bootstrap/logger.bootstrap.js)
- [api/src/app/observability](api/src/app/observability)

Risk:

- Troubleshooting in production will be harder than necessary.
- Structured logs, trace correlation, and auditability are limited.

Recommended actions:

- Adopt structured logging.
- Avoid logging secrets, tokens, or personal data.
- Include request IDs and response timing in logs.

### 7. Input validation is inconsistent

The API has validation-related scaffolding, but there is no clear single validation standard applied everywhere.

Affected files:

- [api/src/app/common/validators](api/src/app/common/validators)
- [api/src/app/common/middleware](api/src/app/common/middleware)

Risk:

- Validation drift across modules.
- Higher risk of malformed payloads reaching services and models.

Recommended actions:

- Choose one validation approach and standardize it.
- Validate pagination, IDs, auth data, and file upload metadata.
- Return a consistent error envelope on validation failure.

### 8. Mobile still has hardcoded environment assumptions

The mobile app still contains environment-specific assumptions that should be removed before broader deployment.

Affected files:

- [mobile/src/core/config/api.config.ts](mobile/src/core/config/api.config.ts)
- [mobile/app.json](mobile/app.json)

Risk:

- Runtime surprises on other machines or in production.
- Developer onboarding is more fragile than it needs to be.

Recommended actions:

- Make API endpoints environment-driven.
- Remove personal-machine defaults.
- Finalize app metadata, deep-link scheme, and bundle identifiers.

## Medium Priority Findings

### 9. Several backend modules are placeholders

The app structure shows many feature areas, but a number of backend modules are still empty or mostly empty.

Affected files and folders:

- [api/src/app/modules](api/src/app/modules)
- [api/src/app/jobs](api/src/app/jobs)
- [api/src/database/migrations](api/src/database/migrations)
- [api/src/database/indexes](api/src/database/indexes)

Risk:

- The codebase looks more complete than it is.
- Empty modules increase cognitive load and make it hard to know what is actually supported.

Recommended actions:

- Remove dead placeholders or mark them clearly as planned work.
- Implement or document a roadmap for remaining modules.
- Add database indexes and migrations before scaling write/read traffic.

### 10. Docker and deployment packaging can be improved

The backend container setup is serviceable, but not optimized for fast and secure builds.

Affected files:

- [api/Dockerfile](api/Dockerfile)
- [docker-compose.yml](docker-compose.yml)

Risk:

- Larger-than-needed images.
- Slower deployments.
- Extra files may be included in build context.

Recommended actions:

- Move to a multi-stage Docker build.
- Add a proper .dockerignore.
- Keep dev-only tooling out of production images.

### 11. CORS and timeout policy should be tightened

The app likely works in local development, but production policies should be explicit.

Affected files:

- [api/src/app/config/cors.js](api/src/app/config/cors.js)
- [api/src/app/app.js](api/src/app/app.js)

Recommended actions:

- Set explicit origin allowlists per environment.
- Cache CORS preflight where it is safe to do so.
- Add request timeout handling.

### 12. Pagination and request limits need defensive validation

Some list endpoints use defaults, but defensive caps should be explicit to avoid abuse.

Affected files:

- [api/src/app/modules/locations](api/src/app/modules/locations)
- [api/src/app/modules/products](api/src/app/modules/products)
- [api/src/app/modules/recipes](api/src/app/modules/recipes)

Recommended actions:

- Enforce max page sizes.
- Reject negative offsets and unreasonable query values.
- Keep list endpoints consistent across modules.

## Mobile App Observations

### Global shell and navigation

The mobile app is moving in the right direction with a global header and bottom navigation shell. That is the right architectural move, but it needs finishing so all screens share one consistent visual language.

Good direction:

- Shared header and bottom nav abstraction.
- Theme-aware surfaces through the global shell.
- Better alignment with a consistent app frame.

What still needs work:

- Legacy screens that still carry their own header logic.
- A few remaining hardcoded colors and dimensions.
- Need to keep auth screens excluded from the shared app shell.

### Theme and dark mode

Dark mode is supported, but several surfaces still depend on hardcoded light-mode values or screen-local constants.

Recommended actions:

- Move remaining constants into the shared theme layer.
- Replace screen-specific backgrounds with theme tokens.
- Verify contrast ratios on badges, chips, and CTA buttons.

### Navigation and UX consistency

The bottom navigation is visually improved, but its spacing, icon frames, and floating center action should be verified across device sizes.

Recommended actions:

- Test on small and large phones.
- Verify the center action remains half-in/half-out and not too high.
- Ensure labels and icons remain readable under dark mode.

### Network and offline behavior

The mobile app would benefit from a better failure strategy.

Recommended actions:

- Add offline-aware UI states.
- Show retry affordances for transient failures.
- Standardize network timeout and error messaging.

## Backend Observations

### Security

The API currently lacks several baseline protections expected from a public production service. The most important items are headers, rate limiting, structured validation, and proper auth hardening.

Recommended order:

1. Security headers and rate limiting.
2. Input validation standardization.
3. Request timeouts and auth hardening.
4. Structured logging and audit trail.

### Data layer

The database setup needs more discipline around indexes and migrations. This will matter as soon as traffic and content volume grow.

Recommended actions:

- Add indexes for common search and geo queries.
- Add migration discipline before schema drift accumulates.
- Verify seed scripts do not duplicate or corrupt production-like data.

### Jobs and async processing

There are job files, but no visible scheduler or orchestration layer. Background processing should be explicit rather than implied.

Recommended actions:

- Decide whether jobs are cron-based, queue-based, or event-driven.
- Add a single job runner strategy.
- Define retry and dead-letter behavior for failed jobs.

## Dependency Health

### API

The API depends on several modern packages, but it is still missing a number of operational dependencies that should exist in a production-ready stack.

Notably missing or underused:

- Security headers middleware
- Rate limiting middleware
- Real-time transport dependency
- Stable structured logger
- Strong validation framework standardization
- Real test runner coverage in CI

### Mobile

The mobile app is on a modern Expo/React Native stack, but it would benefit from stronger network, state, and error-handling support.

Notably missing or worth adding:

- Shared error boundary
- Better request retry policy
- Stronger offline/caching strategy
- Clearer environment-driven config discipline

## Good Practices Already Present

The project is not starting from zero. A few things are already heading in the right direction:

- Clear separation between `api` and `mobile` workspaces.
- A documented testing and performance strategy in docs.
- A theme context on the mobile side.
- A shared app shell approach for navigation and headers.
- Modular feature directories that make future ownership possible.

## Recommended Remediation Plan

### Phase 1 - Security and correctness

- Add Helmet and rate limiting.
- Standardize validation and error envelopes.
- Fix API versioning and request timeout policy.
- Stabilize mobile refresh-token handling.

### Phase 2 - Test and release discipline

- Make lint/test scripts real.
- Run them in CI.
- Add contract tests and smoke tests.
- Add a basic release gate before merge.

### Phase 3 - Maintainability and scale

- Remove or complete placeholder modules.
- Add migrations and indexes.
- Introduce structured logs and tracing.
- Decide on a real jobs/queue strategy.

### Phase 4 - Mobile polish and resilience

- Finish dark-mode tokenization.
- Keep auth screens outside the global app shell.
- Add offline and retry behavior.
- Verify responsive behavior across devices.

## Final Assessment

The codebase has a workable foundation and a clear product structure, but it still needs several foundational engineering fixes before it should be considered production-ready. The highest-value work now is not cosmetic. It is security hardening, test enforcement, and eliminating brittle runtime behavior in the mobile network and navigation layers.

If you want, I can turn this into a tracked remediation checklist next and start fixing the highest-priority items one by one.