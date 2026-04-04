# glunity-mobile
# Glunity Mobile — Technical Architecture & Project Plan

> React Native + Node.js · iOS & Android · Agile / Scrum  
· Agency: Optima Junior Entreprise · April 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Data Models](#3-data-models-mongodb-schemas)
4. [REST API Design](#4-rest-api-design)
5. [Real-Time Architecture](#5-real-time-architecture-socketio)
6. [Security](#6-security-architecture)
7. [Scalability & Performance](#7-scalability--performance)
8. [Scrum Plan & Sprint Roadmap](#8-scrum-plan--sprint-roadmap)
9. [Git Workflow & Dev Rules](#9-git-workflow--development-rules)
10. [Risk Management](#10-risk-management)
11. [Definition of Done](#11-definition-of-done)

---

## 1. Project Overview

Glunity Mobile is a community-driven mobile application for people with celiac disease and gluten intolerance in Tunisia, with international expansion potential. It serves four user profiles — celiac consumers, family/friends (proches), commercial professionals (restaurants, bakeries, sellers), and healthcare professionals — each with tailored features and content.

> **Design is locked.** The marketing team delivered the complete Figma mockups. The dev team's job is 100% implementation — architecture, backend API, business logic, real-time features, security, and pixel-perfect React Native UI. No design decisions during development.
>
> **Figma:** https://embed.figma.com/design/hGkZ6EBoLgG1o5FCPAzgnZ/Glunity

### 1.1 Functional modules

| Module | Description | Priority |
|---|---|---|
| Auth & Profiles | Registration, login, JWT auth, profile type at onboarding | P1 — Sprint 1 |
| Home Screen | Streak counter, badges, personalized suggestions, quick access | P1 — Sprint 1 |
| Collaborative Map | GF-safe locations, geo-filters, certified reviews, user pins | P1 — Sprint 2 |
| GF Product DB | Community product catalog with verified GF status | P2 — Sprint 2 |
| Recipe Catalog | Filterable recipes, steps, nutrition, favorites, share | P2 — Sprint 3 |
| Events Module | Calendar, workshops, webinars, registration | P2 — Sprint 3 |
| Community Channels | Discord/Slack-style real-time thematic channels | P2 — Sprint 3 |
| Reels | Short vertical video feed (GF tips, recipes) | P3 — Sprint 4 |
| Seller Dashboard | Visibility analytics for commerce professionals | P2 — Sprint 3 |
| Gamification | Badges, streaks, challenges, Warrior progression | P3 — Sprint 4 |
| Push Notifications | Personalized alerts (locations, challenges, events) | P2 — Sprint 2 |
| Offline Mode | Partial offline cache — map, recipes, products | P3 — Sprint 4 |
| Multilingual | FR (primary), Tunisian Arabic (Darija), English | P3 — Sprint 4 |

---

## 2. Technical Architecture

### 2.1 Pattern: Client–Server · REST + WebSocket

The React Native app communicates with the Node.js backend through two channels:
- **REST API over HTTPS** — all standard CRUD and data fetching
- **Socket.io WebSocket** — real-time community chat and live notifications

> **Decision:** Single monolithic Node.js API. No microservices, no GraphQL, no overengineering. Right for a 2-person team at this stage. Can be split later.

### 2.2 Full stack

| Layer | Technology | Role |
|---|---|---|
| Mobile Client | React Native + Expo | Cross-platform iOS/Android |
| Navigation | React Navigation v6 | Stack + Bottom Tabs |
| State Management | React Context + useReducer | Auth state, global user session |
| HTTP Client | Axios | All REST API calls, JWT interceptors |
| Real-time Client | Socket.io-client | Community chat, live notifications |
| Offline Cache | AsyncStorage + MMKV | Map cache, favorite recipes |
| Secure Storage | Expo SecureStore | JWT refresh token (never AsyncStorage) |
| Maps | React Native Maps | Collaborative GF-safe location map |
| Push Notifications | Expo Notifications + FCM | iOS + Android push delivery |
| Internationalization | i18next + expo-localization | FR / AR / EN switching |
| API Server | Node.js + Express.js | REST API, business logic, auth |
| Real-time Server | Socket.io (Node.js) | Chat rooms, real-time events |
| Database | MongoDB + Mongoose | Main application data store |
| Media Storage | Cloudinary | Images, videos, avatars, reels |
| Authentication | JWT (access + refresh tokens) | Stateless auth, role-based access |
| Password Hashing | bcryptjs | Secure password storage |
| Email Service | Nodemailer + SMTP | Password reset, verification emails |
| Validation | Joi / express-validator | Input validation on all routes |
| Environment | dotenv | Config secrets, never hardcoded |
| Hosting | VPS (6 vCore, 8 GB RAM, 160 GB) | Node.js server + MongoDB |
| Process Manager | PM2 | Auto-restart, logs, production daemon |
| Reverse Proxy | Nginx | HTTPS termination, static serving |

### 2.3 Folder structure

#### Frontend — React Native / Expo
```
src/
├── screens/          # One folder per feature (Auth, Home, Map, Recipes, Community...)
├── components/       # Reusable UI components (Button, Card, Input, Avatar...)
├── navigation/       # RootNavigator, AuthStack, MainTabs, each stack file
├── services/         # API service layer — ALL Axios calls go here
├── context/          # AuthContext (user session), ThemeContext (dark mode)
├── hooks/            # useLocation, useSocket, usePushNotifications...
├── utils/            # formatDate, formatDistance, constants, validators
├── i18n/             # fr.json, ar.json, en.json + i18n config
└── assets/           # Icons, images, fonts, splash screen
app.json              # Expo config (app name, icons, bundle IDs, permissions)
.env                  # API_BASE_URL, CLOUDINARY_URL, GOOGLE_MAPS_KEY — never committed
```

#### Backend — Node.js / Express
```
src/
├── routes/           # Express routers — one file per domain (auth, users, locations...)
├── controllers/      # Request handlers — thin, delegate to services
├── services/         # Business logic — authService, locationService, recipeService...
├── models/           # Mongoose schemas — User, Location, Product, Recipe, Event...
├── middleware/       # auth.js, role.js, validate.js, rateLimit.js, upload.js
├── utils/            # generateToken, sendEmail, cloudinaryUpload, paginate, ApiError
├── socket/           # Socket.io handlers — chatHandler, notificationHandler
├── config/           # db.js, cloudinary.js, nodemailer.js
├── app.js            # Express app setup, middleware chain, route mounting
└── server.js         # HTTP server init, Socket.io attach, PM2 entry point
.env                  # MONGO_URI, JWT_SECRET, REFRESH_SECRET, CLOUDINARY_*, FCM_KEY, SMTP_*
```

---

## 3. Data Models (MongoDB Schemas)

### User

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `fullName` | String, required | |
| `email` | String, required, unique | Lowercase, trimmed |
| `phone` | String | Optional |
| `passwordHash` | String, required | bcrypt hash — never store plain |
| `profileType` | Enum | `celiac` \| `proche` \| `pro_commerce` \| `pro_health` \| `admin` |
| `avatar` | String | Cloudinary URL |
| `streakDays` | Number | GF streak counter |
| `badges` | [ObjectId] | Ref: Badge |
| `language` | Enum | `fr` \| `ar` \| `en` |
| `darkMode` | Boolean | |
| `pushToken` | String | Expo push token |
| `emailVerified` | Boolean | |
| `isActive` | Boolean | Soft delete |
| `createdAt / updatedAt` | Date | Mongoose timestamps |

### Location (Collaborative Map)

| Field | Type | Notes |
|---|---|---|
| `name` | String, required | Business name |
| `type` | Enum | `restaurant` \| `bakery` \| `shop` \| `pharmacy` \| `other` |
| `address` | String | |
| `coordinates` | GeoJSON Point | `{ type: 'Point', coordinates: [lng, lat] }` — required for `$near` |
| `phone` | String | |
| `openingHours` | String | |
| `isVerified` | Boolean | Admin-verified = certified badge |
| `addedBy` | ObjectId | Ref: User |
| `averageRating` | Number | Computed from reviews |
| `reviewCount` | Number | |
| `views` | Number | Seller dashboard analytics |
| `mapClicks` | Number | Seller dashboard analytics |

> **Index:** `LocationSchema.index({ coordinates: '2dsphere' })` — required for geospatial queries.

### Other schemas (summary)

| Model | Key Fields |
|---|---|
| Review | `locationId, userId, rating (1-5), text, isVerified, createdAt` |
| Product | `name, category, sellerId, images[], isGlutenFree, certifiedGF, ingredients, price` |
| Recipe | `title, category (tunisian/easy/quick), ingredients[], steps[], nutritionInfo{}, photos[], videos[], authorId` |
| Event | `title, type (meetup/class/webinar), date, location, organizer, attendees[], maxCapacity, price` |
| Channel | `name (slug), description, type (space/community), members[], isPrivate` |
| Message | `channelId, senderId, text, attachments[], readBy[], createdAt` |
| Notification | `userId, type, title, body, data{}, isRead, createdAt` |
| Badge | `name, description, icon, condition (streakDays>=7...), earnedBy[]` |

---

## 4. REST API Design

### Base URL
```
https://api.glunity.com/api/v1/
```

### Response envelope
```json
// Success
{ "success": true, "data": {}, "message": "...", "pagination": {} }

// Error
{ "success": false, "message": "...", "errors": [] }
```

### Auth routes

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register with profile type, returns JWT pair | Public |
| POST | `/auth/login` | Login with email+password | Public |
| POST | `/auth/refresh` | Get new access token from refresh token | Public |
| POST | `/auth/logout` | Invalidate refresh token | Private |
| POST | `/auth/forgot-password` | Send reset email | Public |
| POST | `/auth/reset-password/:token` | Reset password with token | Public |
| POST | `/auth/verify-email/:token` | Verify email address | Public |

### Core resource routes

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/users/me` | Get own profile | Private |
| PUT | `/users/me` | Update profile (name, phone, avatar) | Private |
| GET | `/locations?lat=&lng=&radius=&type=` | Nearby GF locations (geo query) | Private |
| POST | `/locations` | Add a new location pin | Private |
| GET | `/locations/:id` | Location detail + reviews | Private |
| POST | `/locations/:id/reviews` | Submit a review | Private |
| GET | `/products?category=&certified=` | List GF products with filters | Private |
| POST | `/products` | Declare a new product | Pro-commerce |
| GET | `/recipes?category=&search=` | List recipes with filters | Private |
| GET | `/recipes/:id` | Full recipe detail | Private |
| POST | `/recipes/:id/favorite` | Toggle favorite | Private |
| GET | `/events?type=&date=` | List upcoming events | Private |
| POST | `/events/:id/attend` | Register for an event | Private |
| GET | `/channels` | List joined + discoverable channels | Private |
| GET | `/channels/:id/messages?page=` | Paginated message history | Private |
| POST | `/channels/:id/messages` | Send message (also via Socket.io) | Private |
| GET | `/seller/dashboard` | Visibility stats | Pro-commerce |
| GET | `/notifications` | User notifications (paginated) | Private |
| PUT | `/notifications/:id/read` | Mark as read | Private |
| GET | `/search?q=&type=` | Global search | Private |

---

## 5. Real-Time Architecture (Socket.io)

### Connection flow

The Socket.io server runs on the same Node.js process as Express. When the app opens the Community screen, it connects via WebSocket, sending the JWT as handshake auth. The server verifies the token before allowing the connection.
```js
// Client-side connection
const socket = io(API_BASE_URL, {
  auth: { token: accessToken }
});
```

### Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join_channel` | Client → Server | `{ channelId }` | Join a channel room |
| `leave_channel` | Client → Server | `{ channelId }` | Leave a channel room |
| `send_message` | Client → Server | `{ channelId, text, attachments }` | Send message — server saves to DB then broadcasts |
| `new_message` | Server → Client | `{ message, channelId }` | Broadcast to all room members |
| `typing_start` | Client → Server | `{ channelId, userId }` | User started typing |
| `user_typing` | Server → Client | `{ userId, channelId }` | Broadcast typing indicator |
| `notification` | Server → Client | `{ type, title, body, data }` | In-app push to specific user |
| `location_added` | Server → Client | `{ location }` | New map pin broadcast to all |

### Room strategy

- **Channel room:** `channel:{channelId}` — all members of a community channel
- **User room:** `user:{userId}` — private notifications per user
- **Global room:** `global` — system-wide announcements

> **Rule:** All messages sent via Socket.io are persisted to MongoDB by the server **before** broadcasting. The client never saves directly — server is the single source of truth.

---

## 6. Security Architecture

### JWT dual-token strategy

| Token | Expiry | Storage | Usage |
|---|---|---|---|
| Access Token | 15 minutes | React Native memory (Context/state) | `Authorization: Bearer <token>` on every request |
| Refresh Token | 7 days | Expo SecureStore (encrypted) | Sent only to `POST /auth/refresh` |

> ⚠️ **Never store the access token in AsyncStorage.** It is not encrypted. Always use `Expo SecureStore` for the refresh token.

### RBAC middleware chain
```
Public:           No middleware
Private:          [authMiddleware]
Pro-commerce:     [authMiddleware, requireRole('pro_commerce')]
Admin:            [authMiddleware, requireRole('admin')]
```

### Security checklist

| Area | Measure | Implementation |
|---|---|---|
| Passwords | Never stored plain | bcryptjs, salt rounds = 12 |
| JWT secrets | Long random strings | Stored in `.env`, rotated periodically |
| Input validation | All routes validated | Joi schemas on every POST/PUT body |
| Rate limiting | Prevent brute force | 100 req/15min global · 5 req/15min on `/auth/*` |
| HTTPS | Encrypt in transit | Nginx terminates TLS — all HTTP → HTTPS |
| CORS | Lock origins | App domain + Expo dev URLs only |
| Helmet.js | HTTP security headers | X-Frame-Options, CSP, HSTS... |
| MongoDB injection | Sanitize inputs | `express-mongo-sanitize` on all bodies |
| File uploads | Validate type & size | Multer: images only, max 10 MB → Cloudinary |
| Refresh token rotation | One-time use | Old token invalidated on each refresh |
| Sensitive data | Health data context | No PII logged, no health data in JWT payload |

---

## 7. Scalability & Performance

### Database indexes

| Index | Collection | Why |
|---|---|---|
| `2dsphere` on `coordinates` | Location | Required for `$near` and `$geoWithin` |
| Text index on `name, description` | Location, Product, Recipe | Powers global search |
| Index on `userId` | Message, Notification, Review | Fast user-specific lookups |
| Index on `channelId + createdAt` | Message | Efficient paginated history |
| Index on `profileType` | User | Filter users by role |
| Index on `date` | Event | Sort + filter upcoming events |

### API performance rules

- Pagination on **all** list endpoints: `?page=1&limit=20` — never unbounded arrays
- `.select()` only needed fields in every Mongoose query
- Avoid N+1 — use aggregation pipelines where needed
- Cloudinary serves media via CDN — never serve media from Node.js
- Redis can be added later for caching (not needed at launch)

### React Native performance rules

- `FlatList` with `keyExtractor` and `getItemLayout` on all long lists
- `React.memo` and `useCallback` on complex prop components
- Lazy screen loading via React Navigation
- Cloudinary transformation URLs — resize to display size, serve webp
- MMKV for offline cache — map pins and recipes available without internet

### Hosting & infrastructure

| Component | Config |
|---|---|
| Server | VPS — 6 vCore, 8 GB RAM, 160 GB SSD |
| OS | Ubuntu 24.04 LTS |
| Process Manager | PM2 — cluster mode, auto-restart on crash |
| Reverse Proxy | Nginx — HTTPS termination, gzip compression |
| SSL | Let's Encrypt (Certbot) — auto-renew every 90 days |
| Database | MongoDB on VPS or Atlas M10+ for production |
| Backups | `mongodump` cron — daily, kept 30 days |
| Monitoring | PM2 logs + Uptime Robot for endpoint health |

---

## 8. Scrum Plan & Sprint Roadmap

### Team

| Person | Role | Responsibilities |
|---|---|---|
| Yassine Drira | Scrum Master + Dev | Ceremonies, backend, RN features, GitHub |
| Dev 2 | Developer | React Native screens from Figma, assigned backend tasks |
| Sirine Boufares | Product Owner | Sprint Review validation, content, functional answers |

### Ceremonies

| Ceremony | When | Duration | Who |
|---|---|---|---|
| Sprint Planning | Start of sprint | Max 8h | YD + D2 + PO |
| Daily Standup | Every morning | Max 15 min | YD + D2 |
| Sprint Review | End of sprint | Max 4h | YD + D2 + PO |
| Sprint Retrospective | After Review | Max 3h | YD + D2 |
| Backlog Refinement | Mid-sprint | Max 10% sprint time | YD + D2 |

---

### Sprint 1 — Auth + Home (2 weeks)
**Goal:** User can register, log in, and see the home screen

| ID | Task | Type | Pts | Owner |
|---|---|---|---|---|
| S1-01 | RN + Expo setup, navigation scaffold, folder structure | FS | 2 | YD |
| S1-02 | Node.js + Express boilerplate, .env, MongoDB connection | BE | 1 | YD |
| S1-03 | User model + `POST /auth/register` | BE | 2 | YD |
| S1-04 | Login API + JWT access/refresh token generation | BE | 2 | YD |
| S1-05 | auth middleware + role middleware | BE | 2 | YD |
| S1-06 | Forgot password — email flow | BE | 3 | YD |
| S1-07 | Register screen — Figma pixel-perfect (profile type + onboarding) | FE | 3 | D2 |
| S1-08 | Login screen — Figma pixel-perfect | FE | 2 | D2 |
| S1-09 | Forgot password screen | FE | 2 | D2 |
| S1-10 | AuthContext + JWT in SecureStore + auto-login on launch | FE | 3 | D2 |
| S1-11 | Home screen scaffold (streak, badges, quick access cards) | FE | 3 | D2 |
| S1-12 | `GET /users/me` + `PUT /users/me` + home data endpoint | BE | 2 | YD |

---

### Sprint 2 — Map + Home completion (2 weeks)
**Goal:** Collaborative map works end to end

| ID | Task | Type | Pts | Owner |
|---|---|---|---|---|
| S2-01 | Bottom tab navigator — 5 tabs with Figma icons | FE | 2 | D2 |
| S2-02 | Home — events section + personalized suggestions (API) | FE | 3 | D2 |
| S2-03 | Push notification setup — Expo + FCM + notification model | FS | 3 | YD |
| S2-04 | Location model + `GET /locations` (geo query with `$near`) | BE | 3 | YD |
| S2-05 | `POST /locations` + `POST /locations/:id/reviews` | BE | 2 | YD |
| S2-06 | Map screen — RN Maps, pin rendering, filter bar (Figma) | FE | 3 | D2 |
| S2-07 | Location detail sheet — reviews, contact, certified badge | FE | 2 | D2 |
| S2-08 | Offline cache — map pins cached to AsyncStorage | FE | 2 | D2 |

---

### Sprint 3 — Recipes + Events + Seller (2 weeks)

| ID | Task | Type | Pts | Owner |
|---|---|---|---|---|
| S3-01 | Recipe model + `GET /recipes` + `GET /recipes/:id` + favorite | BE | 3 | YD |
| S3-02 | Recipe catalog screen — filterable list (Figma) | FE | 3 | D2 |
| S3-03 | Recipe detail screen — nutrition, steps, ingredients (Figma) | FE | 2 | D2 |
| S3-04 | Event model + `GET /events` + `POST /events/:id/attend` | BE | 2 | YD |
| S3-05 | Events screen — tabbed (Meetups/Classes/Webinars) + detail | FE | 3 | D2 |
| S3-06 | Product model + `GET /products` + `POST /products` | BE | 2 | YD |
| S3-07 | Product catalog + product detail screens (Figma) | FE | 2 | D2 |
| S3-08 | Seller profile screen + product declaration form (Figma) | FE | 3 | D2 |
| S3-09 | Seller dashboard API — views, map clicks, top products | BE | 2 | YD |
| S3-10 | Seller dashboard screen — analytics (Figma) | FE | 3 | D2 |

---

### Sprint 4 — Community + Reels (2 weeks)

| ID | Task | Type | Pts | Owner |
|---|---|---|---|---|
| S4-01 | Channel + Message models, `GET /channels`, paginated messages | BE | 3 | YD |
| S4-02 | Socket.io server — join/leave, send_message, new_message | BE | 4 | YD |
| S4-03 | Socket.io client — connect on launch with JWT auth | FE | 3 | D2 |
| S4-04 | Community channel list screen (Figma) | FE | 2 | D2 |
| S4-05 | Community chat screen — real-time messages, typing indicator | FE | 4 | D2 |
| S4-06 | Reels screen — vertical FlatList, video playback (Figma) | FE | 4 | D2 |
| S4-07 | Badge model + gamification API (streak update on login) | BE | 3 | YD |
| S4-08 | i18next setup — FR/AR/EN + Settings language switcher | FE | 2 | D2 |

---

### Sprint 5 — Polish, testing, deployment (2 weeks)

| ID | Task | Type | Pts | Owner |
|---|---|---|---|---|
| S5-01 | Profile screen + edit profile + settings (dark mode) — Figma | FE | 3 | D2 |
| S5-02 | Global search screen — products, locations, recipes, users | FS | 3 | Both |
| S5-03 | Offline mode — favorite recipes cached in MMKV | FE | 2 | D2 |
| S5-04 | Nginx + PM2 + SSL setup on production VPS | DevOps | 2 | YD |
| S5-05 | Production `.env` config, secrets management | BE | 1 | YD |
| S5-06 | End-to-end testing — all critical user flows | QA | 3 | Both |
| S5-07 | App Store + Google Play submission prep (icons, screenshots) | Mobile | 2 | D2 |
| S5-08 | PO Review + UAT + bug fixes | QA | 3 | All |

---

## 9. Git Workflow & Development Rules

### Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Production — merged from `develop` after PO approval only. Protected. |
| `develop` | Integration — all features merged here first |
| `feature/S1-07-register-screen` | One branch per task, named with sprint ID |
| `hotfix/auth-token-bug` | Urgent production fixes — merged to `main` + `develop` |

### Commit convention
```
feat(auth): add register screen with profile type selection
feat(api): add POST /locations with geo validation
fix(map): correct pin rendering on iOS 17
chore(deps): update expo-notifications to 0.28
docs: update API route documentation
```

### Code rules — always followed

- **One component per file** — never multiple exports in one file
- **All API calls go through `src/services/`** — no inline `fetch` or `axios` in screen files
- **All user-facing strings use i18next** — no hardcoded text in JSX
- **Always handle loading, error, and empty states** on every screen
- **Never commit `.env` files** — keep `.env.example` with placeholder values
- **All async functions wrapped in try/catch** — no unhandled promise rejections
- **Backend routes: validate input first, then query DB** — never trust raw request body
- **PR rule:** the other developer reviews before merging to `develop` — no self-merges

---

## 10. Risk Management

| ID | Risk | Impact | Probability | Mitigation |
|---|---|---|---|---|
| R-01 | Server downtime | Catastrophic | Probable | PM2 auto-restart, daily backups, Nginx fallback |
| R-02 | Developer delay | Major | Probable | Fixed sprint deadlines, daily standup to surface blockers |
| R-03 | Client feedback delay | Minor | Probable | Max 3-day response window in contract |
| R-04 | Security breach | Catastrophic | Low | Helmet, rate limiting, sanitization, JWT rotation |
| R-05 | Breaking dependency update | Catastrophic | Very probable | Lock versions in `package.json`, snapshot before update |
| R-06 | Scope creep | Major | Probable | New features go to next sprint — not current one |
| R-07 | Geolocation accuracy (Tunisia) | Moderate | Moderate | Allow manual pin adjustment by users and sellers |
| R-08 | App Store rejection | Major | Low | Follow Apple/Google guidelines from day 1, test on real devices |

---

## 11. Definition of Done

### Backend task is DONE when

- [ ] Route returns correct data with proper HTTP status codes
- [ ] Input validated with Joi — invalid inputs return `400` with clear messages
- [ ] Auth middleware applied to all protected routes
- [ ] All async logic wrapped in try/catch with `next(error)`
- [ ] Tested manually with Postman — all edge cases pass
- [ ] Code committed to feature branch, PR opened

### Frontend task is DONE when

- [ ] Screen matches Figma — layout, colors, spacing, typography pixel-perfect
- [ ] All text uses i18next — no hardcoded strings
- [ ] Loading state shown during API call
- [ ] Error state handled — user sees a meaningful message, not a crash
- [ ] Empty state handled — meaningful UI when list is empty
- [ ] Tested on iOS simulator and Android emulator
- [ ] No `console.warn` or `console.error` in final build
- [ ] Code committed to feature branch, PR opened

### Sprint is DONE when

- [ ] All committed tasks pass Definition of Done above
- [ ] Sprint Review demo presented to Product Owner
- [ ] PO has validated delivered features
- [ ] No critical bugs on `develop` branch
- [ ] Sprint Retrospective completed, action items noted

---

*Glunity Mobile · Optima Junior Entreprise · Confidential · 2026*
