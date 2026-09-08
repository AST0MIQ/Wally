# Cosmetics — Phase 2 backlog

## Completed in the Phase 2 visual/UX slice

- Renderers for `NAVIGATION`, `HEADER`, `ACCOUNT_CARD`, and `TRANSACTION_CARD`.
- Card replacement precedence for overview, investment, account, and
  transaction cards (no legacy accent/streak colour bleeding through).
- Slot-specific live previews and direct equip from the Preview dialog.
- Plain-language Thai/English slot, colour, and effect labels.
- iOS-safe account-card overlay behind a one-line emergency flag.

Phase 1 shipped the full vertical slice (author → publish → grant → equip →
render). Deferred, roughly in priority order:

## Rendering
- Renderers that need config v2 semantics: `CHART_STYLE`, `ICON_SET`,
  `TYPOGRAPHY`, `AMBIENT_EFFECT`, `INTERACTION_EFFECT`, `CELEBRATION_EFFECT`.
- `mediaUrl` backgrounds once the Media Library exists (CSP `img-src` currently
  blocks external hosts; only same-origin `/…` paths are allowed).
- Config `v2` (via `parseAssetConfig` version dispatch) if new tokens are needed.

## Admin
- **Media Library**: upload + manage images (S3/Blob), reference by asset id.
- Drag-and-drop **Asset Studio** (Phase 1 is form + live preview).
- Per-collection **availability windows** enforced (`availableFrom` / `availableTo`
  are stored but not gated yet).
- Bulk operations (multi-grant, multi-publish).
- **DB-backed roles**: add an `adminRole` column and populate
  `roleOf()` / `CAPABILITIES` in `src/server/lib/authz.ts` from it
  (`USER` / `CONTENT_ADMIN` / `SUPER_ADMIN`). The capability layer is already in
  place; only the mapping changes.

## Rewards
- Automation engine that consumes `RewardRule` (streak/rank/achievement
  triggers → `grantAsset` / `grantCollection`). Phase 1 is schema + CRUD only.
- Rank system (there is no rank model yet — only streak).

## Entitlements
- Expiry cron: flip `ACTIVE` → `EXPIRED` for `expiresAt <= now` and unequip.
- `LIMITED` rarity / `LIMITED_EVENT` acquisition event tooling.

## Commerce
- Products (package cosmetics), Orders, Stripe checkout, fulfilment →
  `grantCollection` / `grantAsset` with `acquisitionType: PURCHASE`.
  **Not in Phase 1 — no payment code.**

## Operations
- Feature Flags + App Configuration (non-secret runtime settings) — currently
  placeholder pages.
