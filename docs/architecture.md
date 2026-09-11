# Architecture decisions

## Boundaries

- Server Components own reads and never expose server keys.
- Server Actions own authenticated same-origin mutations and revalidate affected routes.
- Route Handlers own the Auth callback for email confirmation/password recovery, import/export, and scheduler integration.
- Zod schemas are reused at every ingress; database constraints remain the final invariant.
- The UI renders a safe empty preview when Supabase variables are absent.

## Authentication

`src/proxy.ts` refreshes the Supabase cookie. It performs no authoritative authorization. Each mutation calls `getAuthenticatedUser`; PostgreSQL RLS is a second independent layer. Pendaftaran email/password terbuka, tetapi akses baru aktif setelah email dikonfirmasi. Email kustom menuju `/auth/confirm` untuk memverifikasi token hash dan membuat profil; `/auth/callback` tetap menangani PKCE code dari flow kompatibilitas/invite. `access_allowlist` tidak lagi menjadi gerbang login; ia hanya mempertahankan role admin opsional.

## Money

Amounts cross boundaries as decimal strings. PostgreSQL stores `numeric(18,2)`. Domain calculations use integer cents in TypeScript. Only `posted` rows appear in balance, budget, and report queries.

## PWA and data safety

The service worker pre-caches only `/offline.html` and icons. It ignores navigation, `/api`, Supabase, and all non-GET requests. There is no offline mutation queue. Push registration occurs only after explicit user action.

## Release topology

```text
developer → Supabase local → GitHub PR → Netlify Deploy Preview + Supabase staging
                                           │
                                           └─ gates green → main → Netlify Production + Supabase production
```

Database migrations are applied before code that depends on them. Risky changes use expand/migrate/contract releases. Rollback restores a prior Netlify deploy; database changes prefer a reviewed forward fix.
