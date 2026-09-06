# Wally UI redesign

## Frontend audit

Wally uses Next.js 15 App Router, React 19, Tailwind 4 tokens in `src/styles/globals.css`, next-intl with English/Thai JSON messages, Lucide icons, Radix dialogs, and Vaul drawers. Route groups separate public, authenticated, and admin pages. Server pages load finance data; client views own local interaction state and call existing server actions through `useAction`. Transaction filters live in the URL. Quick-add is shared through context and remembers selections in local storage.

Existing reusable primitives include Button, Card, Field, Input, Select, Dialog, Drawer, Badge, EmptyState, Skeleton, and chart components. These were extended rather than replaced. Authentication, authorization, Prisma models, finance services, currency conversion, transaction persistence, investment calculations, and API routes were preserved.

The audit identified a narrow desktop shell, a dashboard that placed recent activity below many charts, crowded account actions, unlabeled filters, numpad-only amount entry, a silent Add action without accounts, unlabeled icon controls, and charts whose percentage heights lacked a definite parent height.

## Visual system

- Light surfaces: background `#F6F8FC`, white cards, slate text and borders.
- Primary action: `#2563EB`; light blue accent surfaces; the existing indigo dark palette remains supported.
- Financial semantics: accessible green `#15803D`, red `#DC2626`, and explicit amount signs.
- Existing locally hosted LINE Sans Thai/English fonts; stronger page and financial-number hierarchy.
- Consistent rounded cards, minimal shadows, 4/8/12/16/24/32 spacing, 44px controls, keyboard focus, and reduced-motion support.

## Implemented

Dashboard: clear net-worth hero with cash/investment breakdown, monthly summaries, earlier accounts and activity, balanced desktop columns, and expandable secondary history/comparisons with a chart legend.

Transactions: visible Add action, labeled search with submit button, expandable labeled filters, clear filters, separate empty versus no-match guidance, grouped card-based rows, and understandable pagination errors.

Quick-add: editable focused amount alongside the existing numpad, selected-state accessibility, correct source currency for transfers, account prerequisites, an explicit Close control, and a separate Save footer that does not cover scrolling fields.

Accounts: responsive card grid, prominent balance, separate management actions, archived-section disclosure. Portfolio: stronger value hierarchy, clean gain/loss presentation, account prerequisite CTA, and labeled mobile holdings cards with existing editing controls preserved.

Analytics and Settings use the shared page header. Shared forms, dialogs, navigation, empty/loading states, and translated error messages benefit the remaining screens, including Admin without expanding its scope.

## Verification

- TypeScript and lint validation passed; 33 tests passed, 10 database-dependent tests skipped.
- Production build passed for all routes using a temporary isolated output directory. A concurrently running development server was writing to `.next`; separating build output resolved the mixed-manifest failure. The temporary configuration change was reverted.
- Browser layout checks at 320, 390, 768, and 1440 pixels for Dashboard, Accounts, Transactions, Portfolio, and portfolio detail. No page-level horizontal overflow in the sample scenarios.
- Isolated browser interaction checks: quick-add focus and typing, enabled/disabled Save, close, empty-account guidance, account form labels, expandable charts, and Thai dark mode.
- Screenshots in `docs/ui-review` use synthetic sample data. The temporary preview route was removed; no demo data or authentication bypass remains in the app.
- The local PostgreSQL server was unavailable. Financial integration tests and authenticated database-backed end-to-end flows require a running database and must be rerun before release.

## Follow-up

Retest with real accounts and unusually long Thai names, large balances, cross-currency transfers, and a device keyboard in installed iOS/Android PWA mode. Existing native destructive confirmations could later be replaced with localized confirmation dialogs. Budget functionality was not introduced; Reports remains its existing placeholder.

## Consumer fintech polish — round 2

The dashboard now uses one strong blue net-worth anchor with real cash/investment composition. Monthly health cards include icons and show month-over-month percentages only when prior-month data exists. Account tiles use their saved icons and colors, while the portfolio preview shows its real unrealized value and percentage when cost data is available.

Recent transactions and category spending now sit on the page surface with restrained dividers instead of equally weighted container cards. Transaction icons use saved category colors, rows have clearer metadata and hover feedback, and spending bars use the configured category palette. Prominent balances use compact locale-aware currency symbols without changing stored or calculated precision.

Desktop keeps the persistent Add Transaction action in the sidebar and removes duplicate page-header actions. Mobile keeps the thumb-accessible floating action in a compact, elevated bottom bar. Navigation, buttons, account cards, portfolio cards, dark surfaces, and charts now use consistent 180–200ms interactions.

Production screenshots were regenerated with synthetic display-only data at 320, 390, 768, 1024, and 1440 pixels for Dashboard, Accounts, and Transactions. The suite found and fixed a 320px grid overflow. Final production-browser validation reported no horizontal overflow or runtime errors. The temporary preview route and screenshot script were removed afterward.
