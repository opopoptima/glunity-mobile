# Glunity Engineering DDoc

## Purpose
This doctrine defines how developers collaborate and implement features in a clean, secure, scalable, and maintainable way.

## Core Engineering Principles
- Clear module ownership
- Strict layer boundaries
- Contract-first API collaboration
- Security by default
- Measured performance, not assumptions
- Tests are part of delivery, not optional

## Non-Negotiable Rules
1. No business logic in controllers or screen components
2. No direct DB access outside repositories
3. No direct network calls in mobile screens
4. No user-facing hardcoded strings outside i18n files
5. No unpaginated list endpoints
6. No sensitive values in logs

## Backend Working Rules
- Build features by domain module
- Validate input before service execution
- Use explicit error mapping and consistent status codes
- Keep module interfaces stable and documented

## Mobile Working Rules
- Build features in module structure (api/domain/state/ui)
- Implement loading, error, and empty states on all API-driven screens
- Keep state minimal and localized where possible
- Reuse shared components before creating duplicates

## API Contract Rules
- Any endpoint contract change updates docs in same PR
- Breaking changes need migration plan and approval
- Response envelope consistency is mandatory

## Security Rules
- Follow security standards document for every feature
- RBAC and auth checks are server responsibilities
- Token and secret handling must follow policy exactly

## Performance Rules
- Define expected query and UI behavior before implementation
- Verify indexes for query-heavy additions
- Measure regressions and fix before merge

## Code Review Rules
- Every PR must be reviewed by teammate
- Reviewer checks architecture, security, tests, docs, and performance impact
- Self-merge is not allowed on feature work

## Branch and Commit Rules
- One feature branch per task
- Use conventional commit format
- Keep PRs focused and small enough for reliable review

## Done Criteria
- Feature acceptance criteria satisfied
- Tests pass and quality gates green
- Docs updated
- No critical known issue introduced

## Escalation Rules
- Raise blockers in daily standup immediately
- Escalate security issues same day
- Escalate release blockers to release owner without delay

