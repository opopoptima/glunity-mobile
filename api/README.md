# GlUnity API — Backend

Node.js + Express 5 REST API for the GlUnity gluten-free mobile application.  
Connected to **MongoDB Atlas** with a modular, professional architecture.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd api
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env — fill in your MongoDB Atlas URI, JWT secrets, Cloudinary, SMTP

# 3. Whitelist your IP in MongoDB Atlas
# Atlas → Security → Network Access → Add IP Address

# 4. Start development server (with hot-reload)
npm run dev

# 5. Or start production server
npm start
```

Server starts at **http://localhost:5000**

---

## 🔑 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | HTTP port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Access token signing secret | any strong random string |
| `REFRESH_SECRET` | Refresh token signing secret | any strong random string |
| `ACCESS_TOKEN_EXPIRES` | Access token TTL | `15m` |
| `REFRESH_TOKEN_EXPIRES` | Refresh token TTL | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | — |
| `CLOUDINARY_API_KEY` | Cloudinary API key | — |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | — |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password / app password | — |
| `APP_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:8081` |

---

## 📁 Project Architecture

```
api/
├── .env                        ← Environment configuration
├── package.json
└── src/
    ├── app/
    │   ├── server.js           ← Entry point — boot sequence
    │   ├── app.js              ← Express factory (middleware + routes)
    │   │
    │   ├── bootstrap/
    │   │   ├── env.bootstrap.js     ← dotenv loader (must run first)
    │   │   ├── db.bootstrap.js      ← MongoDB Atlas connection + events
    │   │   └── logger.bootstrap.js  ← Structured console logger
    │   │
    │   ├── config/
    │   │   ├── env.js               ← Validated env config (fails fast on missing vars)
    │   │   ├── constants.js         ← PROFILE_TYPES, LANGUAGES, HTTP_STATUS, AUTH
    │   │   ├── cors.js              ← CORS config (mobile-friendly, credentials: true)
    │   │   ├── rate-limit.js        ← (skeleton)
    │   │   └── security.js          ← (skeleton)
    │   │
    │   ├── common/
    │   │   ├── errors/
    │   │   │   ├── app-error.js     ← AppError base class with factory helpers
    │   │   │   └── error-codes.js   ← (skeleton)
    │   │   │
    │   │   ├── middleware/
    │   │   │   ├── auth.middleware.js        ← Bearer JWT guard → attaches req.user
    │   │   │   ├── error.middleware.js       ← Global error handler (Mongoose + JWT)
    │   │   │   ├── role.middleware.js        ← RBAC by profileType
    │   │   │   ├── validation.middleware.js  ← express-validator aggregator → 422
    │   │   │   └── request-id.middleware.js  ← x-request-id trace header
    │   │   │
    │   │   └── utils/
    │   │       ├── async-handler.js  ← Eliminates try/catch in controllers
    │   │       ├── password.js       ← bcryptjs hash + verify
    │   │       └── token.js          ← JWT sign/verify (access + refresh)
    │   │
    │   └── modules/
    │       └── auth/
    │           ├── auth.repository.js  ← DB layer only (User queries)
    │           ├── auth.service.js     ← Business logic (register/login/refresh/getMe)
    │           ├── auth.schema.js      ← express-validator input rules
    │           ├── auth.mapper.js      ← Response shaping (prevents data leaks)
    │           ├── auth.controller.js  ← HTTP layer — thin, delegates to service
    │           └── auth.routes.js      ← Route declarations with middleware guards
    │
    └── database/
        ├── models/
        │   ├── user.model.js        ← Full User schema (see below)
        │   ├── badge.model.js       ← (skeleton)
        │   ├── channel.model.js     ← (skeleton)
        │   ├── event.model.js       ← (skeleton)
        │   ├── location.model.js    ← (skeleton)
        │   ├── message.model.js     ← (skeleton)
        │   ├── notification.model.js← (skeleton)
        │   ├── product.model.js     ← (skeleton)
        │   ├── recipe.model.js      ← (skeleton)
        │   └── review.model.js      ← (skeleton)
        ├── indexes/                 ← (skeleton)
        ├── migrations/              ← (skeleton)
        └── seeds/                   ← (skeleton)
```

---

## 👤 User Schema

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `fullName` | String, required | 2–80 chars |
| `email` | String, required, unique | Lowercase, trimmed |
| `phone` | String | Optional |
| `passwordHash` | String, required | bcrypt, `select: false` |
| `profileType` | Enum | `celiac \| proche \| pro_commerce \| pro_health \| admin` |
| `avatar` | `{ url, publicId }` | Cloudinary sub-document |
| `streakDays` | Number | Gamification counter, default 0 |
| `badges` | `[ObjectId]` | Ref: Badge |
| `language` | Enum | `fr \| ar \| en` |
| `darkMode` | Boolean | Default false |
| `pushToken` | String | Expo push token |
| `emailVerified` | Boolean | Default false |
| `isActive` | Boolean | Soft delete, indexed |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

---

## 🔗 API Endpoints

### Auth — `/api/auth`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/register` | — | Create account → returns tokens |
| `POST` | `/login` | — | Login → returns tokens |
| `POST` | `/refresh` | — | Refresh access token (body or httpOnly cookie) |
| `POST` | `/logout` | — | Clears refresh token cookie |
| `GET` | `/me` | Bearer JWT | Get current user profile |

### Health

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/health` | Returns `{ status: "ok", timestamp }` |

---

## 🏗️ Design Principles

- **Layered architecture** — Repository → Service → Controller (no DB logic in controllers)
- **Fail-fast env validation** — Server won't start with missing required vars
- **httpOnly cookie** for refresh tokens — XSS-safe
- **`select: false`** on `passwordHash` — never leaked in queries
- **`toPublic()`** method on User — safe serialization without sensitive fields
- **Global error middleware** — handles Mongoose, JWT, and AppError uniformly
- **asyncHandler** — no try/catch boilerplate in controllers
- **Graceful shutdown** — SIGTERM/SIGINT closes server + MongoDB connection cleanly

---

## 📦 Dependencies

```json
{
  "bcryptjs": "^3.0.3",
  "cloudinary": "^2.9.0",
  "cookie-parser": "^1.4.7",
  "cors": "^2.8.5",
  "dotenv": "^17.2.3",
  "express": "^5.2.1",
  "express-validator": "^7.3.1",
  "jsonwebtoken": "^9.0.3",
  "mongoose": "^9.1.5",
  "multer": "^2.0.2",
  "nodemailer": "^8.0.4"
}
```

Dev: `nodemon`

---

## ⚠️ Important Notes

> **MongoDB Atlas IP Whitelist** — Before running in any environment, add your IP:  
> Atlas Portal → Security → Network Access → Add IP Address  
> Use `0.0.0.0/0` for development (allow all).

> **Skeleton modules** — Routes for `users`, `badges`, `products`, `recipes`, `reviews`, `locations`, `channels`, `events`, `notifications`, `seller`, `search` are scaffolded but not yet implemented.
