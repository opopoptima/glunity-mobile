# Glunity Architecture Overview

## Architecture Type
- Client-Server architecture
- Mobile app as client
- Single backend service as server
- REST over HTTPS for CRUD and fetch operations
- Socket events for realtime chat and notifications

## Why This Architecture
- Team size is small and needs fast delivery
- Product roadmap is wide and needs simple operations
- Domain boundaries are still evolving
- Modular monolith minimizes operational complexity while keeping clear separation

## System Components
- Client: React Native + Expo app
- API: Node.js + Express service
- Realtime: Socket layer in same backend runtime
- Database: MongoDB
- Media: Cloudinary
- Notifications: Expo + FCM/APNs bridge

## Backend Architectural Style
- Modular monolith with strict domain boundaries
- Domain folders under api/src/app/modules
- Cross-cutting concerns under api/src/app/common
- Infrastructure adapters under api/src/app/integrations

## Backend Layering Contract
1. route: transport and middleware chain
2. controller: request parsing and response formatting
3. service: business rules and orchestration
4. repository: data access and query optimization
5. mapper: DTO transformation

## Mobile Architectural Style
- Feature-first module structure
- Shared core infrastructure for networking, storage, realtime, i18n
- Shared reusable primitives under mobile/src/shared

## Mobile Layering Contract
1. ui/screens and ui/components: presentation only
2. state: reducers/context and orchestration
3. api: transport calls
4. domain: feature types and validation constraints

## Data Flow
1. user action in screen
2. state or feature action dispatch
3. module api request
4. backend route -> service -> repository
5. response envelope mapping
6. state update and UI render

## Realtime Flow
1. client opens socket with access token
2. server authenticates handshake
3. client joins room
4. server validates authorization for room action
5. server persists event payload
6. server broadcasts event to room

## Security Model
- Access token short TTL
- Refresh token long TTL with rotation
- Role checks enforced server-side
- Input validation at route boundary
- Sanitization and rate limit enabled globally

## Scalability Strategy
- Vertical scale first with PM2 cluster and optimized queries
- Prepared for later split by domain if traffic demands it
- Contract discipline and module boundaries make extraction possible

## Failure Isolation Strategy
- Validation failures return 400 envelope
- Auth failures return 401/403 envelope
- Domain errors mapped to known codes
- Unexpected errors pass centralized error middleware

## Architectural Anti-Patterns To Avoid
- Smart controllers with embedded business logic
- DB queries in controllers or middleware
- Mobile screens directly calling HTTP clients
- Shared utility dumping ground with domain logic mixed in

## Decision Record
- Current target: Client-Server + modular monolith
- Microservices: not in current scope
- Revisit trigger: sustained scale or team growth requiring independent deploy units

