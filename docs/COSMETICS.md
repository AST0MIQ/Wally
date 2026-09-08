# Wally Cosmetics — Phase 1

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
| `RewardRule` | schema + admin CRUD only in Phase 1; grants exactly one target (collection XOR asset) — DB `CHECK` + Zod |

## Safety

- `config` is a validated bag of tokens + named presets — **never** raw CSS or JS.
  `src/lib/cosmetics/config.ts` (`assetConfigV1Schema`, `.strict()`) rejects unknown
  keys; `mediaUrl` must be a same-origin `/…` path.
- Preset whitelists: `src/lib/cosmetics/presets.ts`. Each axis (shape / surface /
  borderEffect / texture / motion / intensity) is its own enum.
- Renderer layers are always `pointer-events: none` + `aria-hidden`, gated by
  `prefers-reduced-motion`.

## Fallback

Every existing user has an empty loadout → `getResolvedLoadout` returns all-null →
renderers emit nothing → the app looks exactly as it did in 1.4.6. `DEFAULT`
acquisition assets ("Wally Classic") are implicitly owned by everyone (no
entitlement rows). `resetToDefaults` deletes the user's equipped rows.

## Rendered slots (Phase 1)

`APP_BACKGROUND`, `PROFILE_FRAME`, `PROFILE_BADGE`, `PROFILE_AURA`,
`OVERVIEW_CARD`, `INVESTMENT_CARD`. All other slots are data + admin only.
`ACCOUNT_CARD` has **no renderer** — `accounts-view.tsx` (the 1.4.6 iOS drag
mechanic) is untouched.

## Admin

`/admin` — separate `AdminShell`, server-guarded (`requireAdmin()` on the layout
**and** every page). Authz abstraction in `src/server/lib/authz.ts` is
capability-based so DB-backed roles (`CONTENT_ADMIN` / `SUPER_ADMIN`) slot in
later. Material admin actions are audited **inside the same transaction** as the
mutation via `auditInTx()` — a single audit-writing path.

See `docs/backlog-cosmetics-phase2.md` for what's deferred.
