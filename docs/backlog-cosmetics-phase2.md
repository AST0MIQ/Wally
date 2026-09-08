# Cosmetics — Phase 2 delivery checklist

## Implemented

- Config v2 plus production/preview renderers for all 16 equipment slots.
- Replacement precedence for every card slot, including removal of legacy
  overview-card colours while an asset is equipped.
- Vercel Blob Media Library with drag-and-drop upload, safe MIME/size checks,
  archive history and a direct media picker in Asset Studio.
- Collection availability windows enforced for grants and set application.
- Bulk asset status changes and multi-asset grants.
- Reward automation for streak, rank and achievement milestones with an
  idempotency ledger; rank points and levels are manageable from Admin.
- Hourly entitlement expiry and automatic unequip.
- Products, orders, Stripe Checkout and signed-webhook fulfilment.
- Database-backed feature flags and non-secret runtime configuration.
- Database-backed RBAC from the parallel Claude implementation, merged into
  this branch: multiple roles, permission union, bootstrap access, role Admin
  UI and final-SUPER_ADMIN protection.

## Shared UX / Phase 3 integration

- Cosmetic typography, icon and chart presets are applied from the shared app
  root, so Dashboard and Analytics reuse the existing chart/layout components.
- All asset types share the same preview and renderer functions.
- Admin workflows use existing Button, Card, Field, PageHeader and action/toast
  conventions; mobile controls remain at least 44 px and immutable published
  records are preserved through “Duplicate as draft”.

## Enable in staging

1. Apply `20260909120000_cosmetics_phase2` to the staging Neon branch.
2. Seed RBAC/system data.
3. Add `BLOB_READ_WRITE_TOKEN`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET` and the staging
   `NEXT_PUBLIC_APP_URL` in Vercel.
4. Register the staging Stripe webhook at `/api/stripe/webhook`.

Do not use production Stripe keys or the production Neon branch for this
verification.
