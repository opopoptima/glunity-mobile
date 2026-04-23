# Release Runbook

## Purpose
Standardize release preparation, deployment, verification, and rollback.

## Release Cadence
- Regular sprint-based releases
- Hotfix releases only for critical defects

## Roles
- Release owner: coordinates timeline and checklist
- Backend owner: API readiness and migration checks
- Mobile owner: client build and store readiness
- Reviewer: final approval and go/no-go decision

## Pre-Release Checklist
1. all planned tickets in done state
2. CI pipelines green
3. critical E2E flows pass
4. no unresolved critical severity bug
5. docs updated for contract/security/performance changes
6. environment values verified

## Backend Deployment Steps
1. tag release candidate
2. backup database
3. build and deploy backend containers
4. run migration steps if any
5. warm up health checks
6. validate key endpoints

## Container Deployment Standard
- Production compose file: `docker-compose.yml`
- Local/dev compose file: `docker-compose.dev.yml`
- Reverse proxy config: `deploy/nginx/default.conf`
- API image context: `api/Dockerfile`

### Baseline Command
```bash
docker compose up -d --build
```

### Scale API Instances
```bash
docker compose up -d --build --scale api=3
```

Use orchestrator-based scaling for sustained high traffic.

## Mobile Release Steps
1. bump app version and build number
2. generate release build
3. smoke test on Android and iOS
4. publish to store tracks according to plan
5. verify runtime config values

## Post-Release Verification
- login and refresh flow
- profile read/update flow
- locations list and detail
- chat send/receive flow
- notifications flow

## Rollback Criteria
- sustained 5xx increase above threshold
- auth flow broken
- data corruption risk detected
- severe crash spike in mobile

## Rollback Plan
1. stop rollout
2. redeploy previous stable backend artifact
3. revert problematic migration if applicable
4. disable affected feature flag if available
5. communicate status and ETA

## Incident Communication
- Create incident channel and assign owner
- Post timeline updates at fixed intervals
- Publish post-incident summary with root cause and action items

## Evidence To Keep Per Release
- CI run links
- deployment logs
- smoke test checklist
- release notes
- known issues list
- container image tags
- compose version used

