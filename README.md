# Crowdsourced Civic Issue Reporting System (CCIRS) API

Backend API for civic issue reporting with Firebase-authenticated submissions, AI-assisted department routing, and tamper-evident transparency timelines.

## Project Analysis

### Executive Summary

The proposed Crowdsourced Civic Issue Reporting and Resolution System, developed by Team HardCode for the Smart India Hackathon 2025, addresses the systemic failure of civic issues remaining unreported or unresolved due to the absence of a unified reporting platform. The solution integrates an AI-driven backend for automated department routing with a blockchain-based ledger to ensure tamper-proof transparency. By providing a multilingual, multimedia-enabled interface, the system aims to streamline the communication between citizens and government authorities, fostering trust and accelerating the resolution of community problems to build cleaner, greener environments.

### Problem Identification

The primary obstacle to effective civic maintenance identified is the lack of a unified, accessible platform for citizens. This deficiency leads to several critical issues:

- Unreported Grievances: Many civic problems are never brought to the attention of authorities because the reporting process is unclear or fragmented.
- Resolution Delays: Without a centralized system, issues may not reach the appropriate department in a timely manner.
- Lack of Transparency: Citizens often have no visibility into the status of their reports once submitted, leading to a breakdown in trust between the public and government bodies.

### Proposed Solution and Key Features

The project introduces a unified mobile and web application designed to act as a single point of entry for all civic concerns. The solution is built around three core pillars: accessibility, intelligence, and transparency.

#### 1. Multi-Modal Reporting Interface

To ensure the system is accessible to all demographics, including non-technical users, the platform supports several input methods:

- Multimedia Inputs: Users can submit reports using photos, text, or voice notes.
- Geotagging: All reports are automatically geotagged to provide precise location data for authorities.
- Multilingual Support: A multilingual interface removes language barriers, allowing a broader segment of the population to participate in civic reporting.

#### 2. Intelligent Backend and Automated Routing

The system minimizes manual intervention and administrative overhead through an intelligent backend:

- AI Classification: An integrated AI engine automatically categorizes the submitted issue.
- Automated Department Routing: Once classified, the system identifies and allocates the report to the correct government department, ensuring efficient handling from the outset.

#### 3. Transparency and Accountability Mechanisms

To rebuild citizen trust, the platform incorporates high-integrity tracking features:

- Blockchain Ledger: A blockchain-based system provides a tamper-proof record of issue status, ensuring that progress updates are authentic and cannot be manipulated.
- Open Transparency Dashboard: A real-time dashboard allows citizens to track the progress of their reports from the moment of submission through to final resolution.

### Technical Architecture

The system utilizes a modern technical stack to ensure scalability, precision, and intelligence.

| Component | Technology Employed |
|---|---|
| Front End | HTML, CSS, JavaScript, and Bootstrap |
| Back End and Auth | Firebase |
| Database | PostgreSQL |
| Mapping and Location | Geospatial APIs for high-precision mapping |
| Artificial Intelligence | TensorFlow Lite for AI integration and classification |

### Anticipated Strategic Impact

The implementation of this crowdsourced system is expected to yield significant improvements in urban management and civic engagement:

- Operational Efficiency: Automated routing and smart resource allocation allow government departments to respond to issues more rapidly.
- Increased Trust: The use of blockchain and open dashboards creates a verifiable trail of government action, enhancing accountability.
- Community Well-being: By facilitating faster reporting and resolution, the system contributes directly to the creation of cleaner and greener communities.
- Data-Driven Governance: High-precision mapping and intelligent classification provide authorities with better data to manage civic resources.

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