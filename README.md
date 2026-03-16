# Contacts Campaign Hub (Phase 1)

Production-grade scaffold for Google Contacts sync, Firestore-backed contact/group/template/campaign management and n8n-ready integration APIs.

## 1) Product Architecture (Summary)
- **Frontend:** Next.js 15 App Router + React 19 + Tailwind + shadcn-style component approach.
- **Backend:** Next Route Handlers + service/domain/repository layers.
- **Auth:** Firebase Authentication (Google Sign-In), role resolution with fixed super admin (`meoncu@gmail.com`).
- **DB:** Firestore collections for users, contacts, groups, group_members, templates, campaigns, runs, jobs, sync states/logs, audit logs.
- **Integration:** n8n-compatible service-token protected endpoints for due campaigns, claim, log, complete/fail callbacks.

## 2) Technology Decisions
- TypeScript strict mode for strong typing.
- zod for schema validation.
- TanStack Query-ready modular structure.
- Vitest + RTL foundation.
- ESLint + Prettier.

## 3) Firestore Data Model
Implemented in documentation + rules/index strategy. Key collections:
`users`, `contacts`, `groups`, `group_members`, `message_templates`, `campaigns`, `campaign_runs`, `message_jobs`, `sync_states`, `sync_logs`, `audit_logs`.

## 4) API Design (Phase-1 scaffold)
- App APIs: `/api/contacts`, `/api/groups`, `/api/templates`, `/api/campaigns`, `/api/dashboard`, `/api/sync`
- n8n endpoints:
  - `GET /api/integrations/n8n/campaigns/due`
  - `POST /api/integrations/n8n/campaigns/:id/claim`
  - `POST /api/integrations/n8n/messages/log`
  - `POST /api/integrations/n8n/campaigns/:id/complete`
  - `POST /api/integrations/n8n/campaigns/:id/fail`

## 5) Auth & RBAC
Roles: `super_admin`, `admin`, `editor`, `viewer`.
Super admin email is fixed by policy.

## 6) Sync Design
- Google People API service abstraction: full sync + incremental sync.
- Sync state/token and sync logs intended via `sync_states` + `sync_logs`.
- Contact normalization + source/type fields built for future expansion.

## 7) n8n-ready Campaign Lifecycle
Campaign status machine includes:
`draft -> scheduled -> queued -> processing -> completed|failed|cancelled`.
Includes processing lock + idempotency key structure.

## 8) Folder Structure
See top-level folders:
`app/`, `components/`, `features/`, `lib/`, `server/`, `firestore/`, `scripts/`, `tests/`.

## 9) Environment Variables
Copy `.env.example` to `.env.local` and fill values.

## Setup
```bash
npm install
npm run dev
```

## Testing
```bash
npm run test
```

## Firebase
- Firestore rules: `firestore/firestore.rules`
- Indexes: `firestore/indexes.json`

## Notes
- Message provider implementation is intentionally excluded in Phase-1.
- Architecture is intentionally provider-agnostic and n8n-first for Phase-2 orchestration.
