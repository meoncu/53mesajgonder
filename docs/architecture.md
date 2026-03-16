# Phase-1 Architecture Plan

## 1. Ürün Mimarisi
- Next.js App Router tabanlı monorepo-benzeri tek uygulama.
- UI katmanı (`app`, `components`, `features`) ile backend modülleri (`server`) ayrışık.
- API route handler sadece transport; iş kuralları service/domain katmanında.
- Firestore source of truth; n8n için API üzerinden güvenli erişim.

## 2. Teknoloji Kararları
- Next.js 15 + React 19 + TypeScript strict.
- Tailwind + shadcn/ui yaklaşımı.
- react-hook-form + zod doğrulama.
- TanStack Query (phase-1 temeli, phase-2 yoğun kullanım).
- Firebase Auth + Firestore.
- Vitest + RTL test altyapısı.

## 3. Firestore Veri Modeli
- `users`
- `contacts`
- `groups`
- `group_members`
- `message_templates`
- `campaigns`
- `campaign_runs`
- `message_jobs`
- `sync_states`
- `sync_logs`
- `audit_logs`

## 4. Route/API Tasarımı
- CRUD modülleri: `/api/contacts`, `/api/groups`, `/api/templates`, `/api/campaigns`.
- Dashboard: `/api/dashboard`.
- Sync trigger: `/api/sync`.
- n8n hazır endpointler:
  - `GET /api/integrations/n8n/campaigns/due`
  - `POST /api/integrations/n8n/campaigns/:id/claim`
  - `POST /api/integrations/n8n/messages/log`
  - `POST /api/integrations/n8n/campaigns/:id/complete`
  - `POST /api/integrations/n8n/campaigns/:id/fail`

## 5. Auth ve RBAC
- Google Sign-In ile Firebase Authentication.
- `meoncu@gmail.com` her zaman `super_admin`.
- Diğer roller: `admin`, `editor`, `viewer`.
- Owner bazlı izolasyon + admin yetki sınırları.

## 6. Sync Mekanizması
- People API servisi: full + incremental sync.
- Sync token, son başarılı sync zamanı, log ve hata alanları.
- Normalize telefon (E.164) ve duplicate detection hazırlığı.

## 7. n8n Campaign Akışı Hazırlığı
- Status machine ve geçiş kuralları.
- Claim için `processingLock` + `idempotencyKey`.
- n8n service token ile endpoint doğrulaması.
- Complete/fail callback endpointleri.

## 8. Klasör Yapısı
- `app/`, `components/`, `features/`, `lib/`, `server/`, `firestore/`, `tests/`, `scripts/`, `docs/`.

## 9. Ortam Değişkenleri
- Firebase public env'leri.
- Server-side secretlar: service token, webhook secret, google oauth secrets.

## 10. Deployment Planı
- Vercel + Firebase.
- CI: lint/test build pipeline.
- Secret yönetimi: platform env manager.
