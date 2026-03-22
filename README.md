# Crowdsourced Civic Issue Reporting System (CCIRS) API

Backend API for civic issue reporting with Firebase-authenticated submissions, AI-assisted department routing, and tamper-evident transparency timelines.

## Project Overview

| Field | Details |
|---|---|
| Project Name | Crowdsourced Civic Issue Reporting and Resolution System (CCIRS) |
| Problem Statement | Civic issues often go unreported or unresolved due to a lack of a unified platform, leading to inefficiency and low accountability. |
| Proposed Solution | A crowdsourced civic issue reporting and resolution system providing a single platform for reporting with automated routing and blockchain tracking. |
| Key Features | Blockchain ledger for tamper-proof tracking, AI engine for classification and department routing, transparency dashboard, and geotagged multimedia inputs. |
| Technology Stack | HTML, CSS, JavaScript, Bootstrap, Firebase, PostgreSQL with geospatial APIs, and TensorFlow Lite. |
| Anticipated Impact | Faster reporting, smart resource allocation, and enhanced transparency between citizens and government bodies. |
| Source | Team HardCode |

## 🚀 Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env and set your values (especially JWT secrets in production)
```

**Key env variables:**
- `DATABASE_URL` — PostgreSQL connection string
- `FIREBASE_SERVICE_ACCOUNT_JSON` — full service account JSON (optional strategy A)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — discrete Firebase credentials (optional strategy B)
- `PORT` — Server port (default: 3000)
- `CORS_ORIGIN` — Frontend origin URL

### 3. Run Database Migrations
```bash
npx prisma migrate dev --name init
```

This creates tables and initializes the database schema.

### 4. Start Development Server
```bash
npm run dev
```

API runs at `http://localhost:3000` with hot-reload via ts-node-dev.

## 📚 npm Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Watch mode with hot reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run start` | Run compiled build (dist/index.js) |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest tests |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create/apply migrations |
| `npm run prisma:deploy` | Apply migrations in production |

## 🔌 API Endpoints

### Authentication
- Firebase ID token is required in `Authorization: Bearer <token>` for protected routes.
- `GET /auth/me` — Resolve authenticated Firebase user into app profile.
- `POST /auth/sync` — Ensure app user record exists/updated from Firebase identity.

### Issues
- `POST /issues` — Create issue (Firebase authenticated; AI category + department auto-assigned)
- `GET /issues` — List issues (with filters: status, category, search)
- `GET /issues/:id` — Get issue detail with media, comments, vote count
- `PATCH /issues/:id/status` — Update status/assignment (Firebase authenticated + `MODERATOR/ADMIN` role)

### Comments
- `POST /issues/:id/comments` — Add comment (authenticated)
- `GET /issues/:id/comments` — List comments for issue

### Votes
- `POST /issues/:id/vote` — Upvote issue (authenticated)
- `DELETE /issues/:id/vote` — Remove vote (authenticated)

### Transparency
- `GET /transparency/issues/:id/timeline` — Return append-only issue timeline plus chain integrity check

### Health Check
- `GET /health` — Returns `{ status: "ok" }` if database is healthy

## 🗄️ Database

### PostgreSQL (Development + Production)
The current schema uses PostgreSQL:

```env
DATABASE_URL="postgresql://user:password@host:5432/ccirs?schema=public"
```

Run migrations: `npm run prisma:migrate`

## 🔐 Security & Auth

- **Primary auth**: Firebase ID token verification through `firebase-admin`
- **Role enforcement**: status changes restricted to `MODERATOR` and `ADMIN` app users
- **CORS**: configured via `CORS_ORIGIN`
- **Helmet**: HTTP security headers enabled
- **Validation**: Zod schemas on inputs
- **Tamper evidence**: hash-chained ledger entries per issue

## 🛠️ Development Workflow

### Create a Migration
```bash
npm run prisma:migrate
# Follow prompts to name migration (e.g., "add_field_to_user")
```

### Reset Database (dev only)
```bash
npx prisma migrate reset
```

### Browse Database (Prisma Studio)
```bash
npx prisma studio
```

Opens browser interface to view/edit data.

## 📊 Project Structure

```
CCIRS/
├── src/
│   ├── index.ts          # App setup, routes, health check
│   ├── config.ts         # Environment config
│   ├── db.ts             # Prisma client
│   ├── middleware/
│   │   └── auth.ts       # JWT verification, RBAC
│   ├── routes/
│   │   ├── auth.ts       # Register/login endpoints
│   │   └── issues.ts     # Issue CRUD + comments/votes
│   └── utils/
│       └── auth.ts       # Crypto (hash/compare), token signing
├── prisma/
│   ├── schema.prisma     # Data models & relationships
│   └── migrations/       # Version-controlled schema changes
├── .env                  # Local secrets (not committed)
├── .env.example          # Template for .env
├── tsconfig.json         # TypeScript config
├── package.json          # Dependencies & scripts
└── README.md             # This file
```

## 🔄 Data Models

### User
- `id`, `email` (unique), `password` (hashed), `name`, `role` (CITIZEN|MODERATOR|ADMIN)
- Relationships: issues (reported), comments, votes

### Issue
- `id`, `title`, `description`, `category`, `status`, `severity`
- AI/route metadata: `aiCategory`, `aiConfidence`, `department`
- accessibility fields: `language`, `voiceNoteUrl`
- Location: `latitude`, `longitude`, `address`
- `reporterId` (user who reported), `assignedTo` (optional assignee)
- Relationships: media, comments, votes, ledgerEntries

### Comment
- `id`, `body`, `issueId`, `authorId`, `createdAt`

### Vote
- Unique constraint: `[issueId, userId]` (one vote per user per issue)

### IssueMedia
- `id`, `issueId`, `url`, `type` (e.g., "image", "video")

### LedgerEntry
- `id`, `issueId`, `eventType`, `payload`, `prevHash`, `hash`, `timestamp`
- Powers transparency timeline integrity verification

## 🚢 Production Deployment

1. **Set production env vars** (.env or environment)
   - Postgres CONNECTION_URL
   - Strong JWT secrets
   - CORS_ORIGIN to frontend domain
   - NODE_ENV=production

2. **Build & run**
   ```bash
   npm run build
   npm run start
   ```

3. **Run migrations** (if needed)
   ```bash
   npm run prisma:deploy
   ```

## 📝 Notes

- AI routing currently uses a deterministic fallback classifier and is ready to be replaced by a TensorFlow Lite inference service.
- Transparency route verifies hash-chain integrity for every issue timeline.
- Rate limiting can be added with `express-rate-limit` for production hardening.
- Logging: Morgan request logging is enabled.