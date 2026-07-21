# Testing Strategy

## Goals
- Catch regressions before merge
- Protect critical user journeys
- Keep confidence high for sprint delivery

## Test Pyramid
- Unit tests: fast, many, isolated
- Integration tests: module and boundary behavior
- Contract tests: API envelopes and key schema guarantees
- E2E tests: critical user workflows

## Backend Test Scope
- Unit: services, mappers, utilities
- Integration: routes + middleware + repository behavior
- Contract: response envelope and required fields
- E2E: auth, locations, channels, notifications

## Mobile Test Scope
- Unit: reducers, hooks, pure helpers
- Integration: feature flows per module
- E2E: login, map flow, review flow, community message flow

## Mandatory Critical Flows
1. register/login/refresh/logout
2. read and update profile
3. list nearby locations and add review
4. send and receive community message
5. list notifications and mark as read

## Quality Gates
- PR cannot merge if lint or tests fail
- Critical flow E2E failures block release
- Contract test failures block API deployment

## Test Data Management
- Keep deterministic fixtures
- Isolate test environment data
- Reset data between E2E suites where possible

## Coverage Guidance
- Focus on risk and business-critical logic, not vanity percentages
- Every bug fix should add at least one regression test

## Definition Of Done For Testing
- Relevant tests added or updated
- Local and CI test runs pass
- No flaky test accepted without mitigation plan

## Flaky Test Handling
1. quarantine only if release-blocking timeline requires it
2. create follow-up ticket same day
3. resolve root cause before next sprint end

