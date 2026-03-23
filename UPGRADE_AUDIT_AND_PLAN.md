# CCIRS Phase 1 Audit And Migration Plan

Date: 2026-03-23

## 1) Architecture Map (Current State)

### Backend runtime paths
- Active backend entry appears to be `src/indexFirebase.ts` (Firestore + Firebase auth + Express routes).
- Legacy/alternate backend entry `src/index.ts` still exists (Prisma/Postgres path, mostly stubbed).
- Root `api/index.js` exists for serverless entry compatibility.

### Frontend runtime paths
- Active frontend app is in `frontend/src/*` (Vite React).
- A second, older frontend tree still exists at root `src/*.jsx` and `src/services/api.js`.

### Data/auth stack in practice
- Firestore is active (`src/services/firestoreApi.ts`).
- Prisma schema and migrations still exist (`prisma/schema.prisma`) but runtime DB module is a no-op (`src/db.ts`).
- Firebase auth middleware is used (`src/middleware/firebaseAuth.ts`) with a permissive fallback mode.

### Existing feature structure
- Recently modularized transparency feature under `frontend/src/features/transparency/*`.
- Remaining frontend areas are page-oriented and mostly JavaScript (`.jsx/.js`), not TypeScript.

### CI/CD and quality tooling
- GitHub workflows are generic/static (`.github/workflows/*`) and not aligned to this stack.
- Backend has lint/test scripts in root `package.json`.
- Frontend has no lint/test scripts in `frontend/package.json`.

## 2) Severity-Ranked Findings (Technical Debt / Anti-patterns)

## High severity
1. Mixed and conflicting architecture paths increase upgrade risk.
- Evidence: `src/indexFirebase.ts` (active Firestore), `src/index.ts` (legacy Prisma), duplicate root frontend files under `src/*.jsx`.
- Impact: Future changes can target wrong stack/files and silently regress production behavior.

2. Authorization gap on sensitive status update flow.
- Evidence: `src/routes/issuesFirebase.ts` comment says moderator required, but route currently allows any authenticated user to update status.
- Impact: Privilege escalation and data integrity risk.

3. Insecure local auth behavior stores plaintext passwords.
- Evidence: `src/routes/authFirebase.ts` saves/compares `password` directly in Firestore for local mode.
- Impact: Severe security exposure if local mode leaks into non-dev deployments.

4. Token verification fallback can accept unsigned payload-style tokens when strict mode is off.
- Evidence: `src/middleware/firebaseAuth.ts` falls back to decoding JWT payload if Firebase lookup fails.
- Impact: Auth bypass risk in misconfigured environments.

## Medium severity
1. Ledger transparency is partially stubbed.
- Evidence: `src/services/ledger.ts` currently no-ops and always verifies true.
- Impact: Transparency claim exists but integrity guarantees are not enforced end-to-end.

2. Firestore query patterns are non-scalable (fetch-all then filter in memory).
- Evidence: `src/routes/transparencyFirebase.ts` loads up to 2000 docs then filters/sorts in process.
- Impact: Performance and cost degrade as issue volume grows.

3. Frontend and backend type boundaries are weak.
- Evidence: frontend API/services are JS-only; no shared DTO contracts.
- Impact: API drift and runtime defects during upgrades.

4. CI pipelines are not product-focused.
- Evidence: workflows are Jekyll/static/webpack templates, not targeted lint+test+build for backend/frontend.
- Impact: Regressions can merge without quality gates.

## Low severity
1. Documentation drift from implementation reality.
- Evidence: README and SYSTEM_ARCHITECTURE mention TensorFlow Lite + blockchain + Postgres as current path, while runtime is Firestore with heuristic classifier and stub ledger.
- Impact: Onboarding friction and wrong operational assumptions.

2. Naming/folder duplication creates cognitive overhead.
- Evidence: same semantic modules in root `src` and `frontend/src` with different behavior.
- Impact: slower iteration and higher defect probability.

## 3) Target Architecture (Upgrade Direction)

### Monorepo layout (recommended)
- `apps/api` (Express + Firebase/Firestore backend)
- `apps/web` (React/Vite frontend)
- `packages/shared` (types, API contracts, constants, validation schemas)
- `packages/ml` (ML inference adapters and model interface)
- `packages/audit-ledger` (blockchain/ledger adapter abstraction)

If full move is too disruptive now, keep current folders but enforce equivalent boundaries via module paths and explicit ownership.

## 4) Incremental Migration Plan (Checkpoints)

## Phase A: Stabilize architecture baseline (1-2 days)
1. Declare active runtime paths in README and mark legacy files as deprecated.
2. Add `LEGACY.md` listing files not in active runtime.
3. Add guardrails in CI to fail if deprecated entrypoints are modified (except cleanup PRs).

Acceptance criteria:
- Team can identify active backend/frontend paths unambiguously in under 2 minutes.

## Phase B: Security hardening (1-2 days)
1. Enforce strict token verification by default in non-dev.
2. Remove plaintext password storage from local auth flow; hash with `bcryptjs`.
3. Add role check for `PATCH /issues/:id/status` in Firebase routes.
4. Add rate limiting to auth and write-heavy routes.

Acceptance criteria:
- Unauthorized users cannot update issue status.
- Local auth stores only hashed credentials.

## Phase C: Contract-first typing (2-3 days)
1. Create shared DTO schemas (Zod + TypeScript types) for issue/auth/transparency responses.
2. Backend routes validate and return typed contracts.
3. Frontend service layer consumes typed contracts.

Acceptance criteria:
- API contract changes fail typecheck/tests before runtime.

## Phase D: Frontend TypeScript migration (3-5 days incremental)
1. Convert `frontend/src/services` and `features/transparency/*` to TS first.
2. Convert contexts/hooks/pages in slices (route-by-route).
3. Add strict lint+format setup (ESLint + Prettier) and scripts.

Acceptance criteria:
- `npm --prefix frontend run build` passes with TS files for core flows.

## Phase E: Data/query scalability (2-4 days)
1. Replace in-memory filtering with indexed Firestore queries and cursor pagination.
2. Introduce query utilities for status/department/search combinations.
3. Add observability around query latency and document reads.

Acceptance criteria:
- Transparency list endpoint supports paginated queries without full collection scan.

## Phase F: Real ledger and blockchain adapter (3-6 days MVP)
1. Implement actual append-only event persistence (Firestore subcollection or dedicated store).
2. Add pluggable adapter interface:
   - `InAppHashChainAdapter` (default)
   - `EthersAuditAdapter` (optional Ethereum testnet anchoring)
3. Persist and expose verification metadata (`txHash`, `chainId`, `blockNumber` when external anchoring enabled).

Acceptance criteria:
- Timeline integrity check fails on tampered events.
- Optional on-chain anchor visible on transparency API/UI.

## Phase G: ML module (2-4 days MVP)
1. Introduce `MLClassifier` interface with:
   - heuristic fallback (current router)
   - external model adapter (TensorFlow.js service or hosted ML API)
2. Log model confidence + version with each classification.
3. Add offline-safe fallback behavior.

Acceptance criteria:
- Classification path is adapter-driven; swapping model source requires config only.

## Phase H: CI/CD quality gates (1-2 days)
1. Replace generic workflows with:
   - backend: lint, typecheck, test, build
   - frontend: lint, test, build
2. Add required status checks on PR.
3. Add dependency audit step and lockfile consistency check.

Acceptance criteria:
- PRs cannot merge without passing quality gates.

## 5) Immediate Next Tasks (Actionable)

1. Security patch PR:
- role enforcement for issue status updates
- strict auth mode defaults
- bcrypt hashing for local mode passwords

2. Repo clarity PR:
- document active architecture and deprecate legacy paths
- add `LEGACY.md`

3. Tooling PR:
- add frontend ESLint/Prettier + scripts
- add minimal CI workflow for frontend/backend build validation

## 6) Notes on ML + Blockchain Upgrade Strategy

- Treat both as adapters behind stable interfaces, not hardcoded implementations.
- Keep fallback path always available (service outages should not block issue reporting).
- Record explicit versioning metadata:
  - ML model version + confidence + input language
  - Ledger adapter version + verification status + optional chain proof fields
