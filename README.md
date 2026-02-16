# Crowdsourced Civic Issue Reporting System API

Backend starter built with TypeScript, Express, Prisma, and SQLite (swap to Postgres for production). Includes auth, issues, comments, votes, and basic RBAC.

## Quickstart
1) Install deps: `npm install`
2) Copy env: `cp .env.example .env` and adjust secrets/DB URL.
3) Run migrations: `npx prisma migrate dev --name init`
4) Start dev server: `npm run dev` (http://localhost:3000)

## Scripts
- `npm run dev` — watch mode via ts-node-dev
- `npm run build` — compile to dist
- `npm run start` — run compiled build
- `npm run prisma:migrate` — create migrations
- `npm run prisma:deploy` — apply migrations in prod

## API surface (v1)
- `POST /auth/register` — email/password signup
- `POST /auth/login` — login, returns access/refresh tokens
- `POST /issues` — create issue (auth)
- `GET /issues` — list issues with filters (status/category/search)
- `GET /issues/:id` — issue detail with media/comments/vote count
- `PATCH /issues/:id/status` — update status/assignment (moderator/admin)
- `POST /issues/:id/comments` — add comment (auth); `GET /issues/:id/comments`
- `POST /issues/:id/vote` / `DELETE /issues/:id/vote` — upvote/unvote (auth)

## Notes
- Default DB is SQLite (`file:./dev.db`); set `DATABASE_URL` to Postgres in prod.
- JWT secrets and CORS origin are configured via env vars.
- Media handling expects presigned URLs stored in IssueMedia; actual upload flow is up to the client/storage layer.