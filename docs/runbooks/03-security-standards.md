# Security Standards

## Security Objectives
- Protect user accounts and personal data
- Prevent unauthorized access
- Reduce impact of common web and mobile attacks
- Keep incident response fast and auditable

## Identity and Access
- Access token lifetime: 15 minutes
- Refresh token lifetime: 7 days
- Refresh token rotation required
- RBAC enforced in backend middleware

## Token Storage Policy
- Mobile access token: memory only
- Mobile refresh token: secure encrypted storage only
- Never store tokens in plain local storage mechanisms

## Password Policy
- Hash with bcryptjs, cost factor 12 minimum
- Never return password hash in any API response
- Use reset flow with expiring one-time token

## Input Security
- Validate all external input at route boundary
- Sanitize request payloads to mitigate injection attempts
- Reject unknown or invalid enum values

## Transport Security
- HTTPS mandatory outside local development
- Enforce TLS at reverse proxy
- Redirect HTTP traffic to HTTPS

## HTTP Security Headers
- Helmet enabled by default
- Strict CORS origin allowlist
- Disable unsafe framing and sniffing

## Abuse Protection
- Global rate limiting enabled
- Stricter rate limit on authentication endpoints
- Lockout or cooldown strategy for repeated failed login attempts

## Data Protection
- Do not log PII, password, token, health-sensitive details
- Apply least-privilege principle for service credentials
- Secrets loaded from environment/secret manager

## Upload Security
- Validate MIME type and size
- Restrict allowed file categories
- Store media in managed external storage

## Realtime Security
- Validate socket token at handshake
- Validate room join authorization
- Reject events with invalid payload shape

## Dependency Security
- Use pinned versions where possible
- Run regular vulnerability scans
- Patch critical vulnerabilities before release

## Security Testing
- Include auth negative test cases
- Include RBAC denial tests
- Include input validation tests for malformed payloads

## Incident Response Baseline
1. detect and classify severity
2. contain impact
3. rotate secrets if needed
4. patch and verify
5. publish postmortem and action items

