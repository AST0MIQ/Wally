# Wally Cosmetics

A modular, game-inventory-style theming system. A **Collection** bundles
**Assets**; each Asset is bound to one **EquipmentSlot** and is equipped
independently. Users mix assets across collections or apply a whole collection.

## Model overview

| Model | Purpose |
| --- | --- |
| `CosmeticCollection` | themed bundle; `status` DRAFT→PUBLISHED→HIDDEN→ARCHIVED; `isApplicableAsSet` |
| `CosmeticAsset` | the equippable item; `slot` (immutable after create), `config` (frozen after first publish), `isCanonicalDefault` (≤1 per slot) |
| `CollectionAsset` | join; **one asset per slot per collection** (`@@unique([collectionId, slot])`); composite FK `[assetId, slot] → CosmeticAsset[id, slot]` keeps `slot` honest |
| `UserEntitlement` | **ownership**, separate from equipped; idempotent via `@@unique([userId, assetId])`; expiry + revocation; history in `AuditLog` |
| `UserEquippedAsset` | **the loadout** — one row per equipped slot (`@@unique([userId, slot])`); composite FK enforces `slot == asset.slot` |
| `RewardRule` | automatic streak/rank/achievement grants; grants exactly one target (collection XOR asset) — DB `CHECK` + Zod |
| `RewardGrant` / `UserRank` | idempotent reward history and rank level derived from points |
| `CosmeticMedia` | public artwork uploaded to Vercel Blob and selected from the Asset form |
| `CosmeticProduct` / `CosmeticOrder` | Stripe Checkout catalogue, order snapshot and idempotent fulfilment |

## Safety

- `config` is a validated bag of tokens + named presets — **never** raw CSS or JS.
  `src/lib/cosmetics/config.ts` dispatches v1/v2 with `.strict()` and rejects unknown
  keys; `mediaUrl` must be a same-origin `/…` path or Wally's Vercel Blob URL.
- Preset whitelists: `src/lib/cosmetics/presets.ts`. Each axis (shape / surface /
  borderEffect / texture / motion / intensity) is its own enum.
- Renderer layers are always `pointer-events: none` + `aria-hidden`, gated by
  `prefers-reduced-motion`.

## Fallback

Every existing user has an empty loadout → `getResolvedLoadout` returns all-null →
renderers emit nothing → the app looks exactly as it did in 1.4.6. `DEFAULT`
acquisition assets ("Wally Classic") are implicitly owned by everyone (no
entitlement rows). `resetToDefaults` deletes the user's equipped rows.

## Rendered slots (Phase 1–2)

Phase 1: `APP_BACKGROUND`, `PROFILE_FRAME`, `PROFILE_BADGE`, `PROFILE_AURA`,
`OVERVIEW_CARD`, `INVESTMENT_CARD`.

Phase 2: `NAVIGATION`, `HEADER`, `ACCOUNT_CARD`, `TRANSACTION_CARD`, `CHART_STYLE`,
`ICON_SET`, `TYPOGRAPHY`, `AMBIENT_EFFECT`, `INTERACTION_EFFECT`, and
`CELEBRATION_EFFECT`. Card assets
replace the old card fill instead of blending over the user's accent/streak
gradient. The Admin and user previews use the same replacement rule.

The `ACCOUNT_CARD` renderer is a class/style-only layer with
`pointer-events:none`, guarded by `ACCOUNT_CARD_COSMETICS_ENABLED`. It does not
change pointer capture, touch action, the rect-scan hit test, selection
prevention, or any drag handler.

All declared slots now have matching production and Admin preview behaviour.

## Phase 2 user experience

- Technical slot and preset identifiers are translated into plain labels.
- Preview is available before equipping and can equip the item directly.
- Applying a collection still shows the replacement summary before the single
  confirmation click.
- Reset remains available from the page header and restores the Wally default.
- The Media Library accepts drag-and-drop; Asset forms can select uploaded art
  directly without copying a URL.
- Availability windows, automatic rewards/ranks, entitlement expiry, bulk
  publishing/grants, runtime flags/config and the optional Stripe theme shop
  are implemented server-side and audited.

## Admin

`/admin` — separate `AdminShell`, server-guarded (`requireAdmin()` on the layout
**and** every page). Authz abstraction in `src/server/lib/authz.ts` is
capability-based so DB-backed roles (`CONTENT_ADMIN` / `SUPER_ADMIN`) slot in
later. Material admin actions are audited **inside the same transaction** as the
mutation via `auditInTx()` — a single audit-writing path.

See `docs/backlog-cosmetics-phase2.md` for the completed checklist and staging
enablement notes.
