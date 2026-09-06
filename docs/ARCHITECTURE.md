# Wally — Architecture & Requirements Document

> Status: **DRAFT for review** — ยังไม่เริ่ม implementation จนกว่าจะ approve
> Last updated: 2026-09-02

**Core concept:** "Know where your money is. Know where your wealth is going."

---

## 0. Locked Decisions (จากการตอบคำถาม)

| หัวข้อ | ตัดสินใจ | ผลต่อ architecture |
|---|---|---|
| **Auth** | Auth.js v5 (NextAuth) + Prisma adapter, Google OAuth (P0), Apple (P1) | DB session, self-managed, ไม่มี vendor lock-in |
| **Stock prices** | Finnhub free API (60 req/min) + daily cron snapshot + manual override | ต้องมี `SecurityPrice` table + `/api/cron/prices` + จัดการ rate limit / symbol not found |
| **Currency** | **Full multi-currency** — สกุลใดก็ได้ | ทุก aggregation ต้องแปลงผ่าน FX แบบ as-of-date; `FxRate` เก็บ **historical** (ต่อวัน) ไม่ใช่แค่ล่าสุด; `NetWorthSnapshot` เก็บ base currency ที่ใช้ |
| **Hosting** | Vercel + Neon (serverless Postgres) | ใช้ Prisma + `@prisma/adapter-neon` / driver adapter; Vercel Cron สำหรับ price/FX/snapshot jobs |

### ค่า default อื่น (เปลี่ยนได้)
- Timezone คำนวณ "วันนี้/เดือนนี้": `Asia/Bangkok`
- วันที่แสดงเป็น ค.ศ. (ไม่ใช้ พ.ศ.)
- Cost method หุ้น: **Average Cost**
- Seed default categories ตอนสมัคร (แก้/ลบได้ทั้งหมด)
- FX fiat rates: `frankfurter.app` (ECB, ฟรี, ไม่ต้อง key) — Finnhub ใช้เฉพาะ securities

---

## A. Project Overview

**Wally** — Personal Finance & Wealth Tracker ใช้งานส่วนตัว ออกแบบ architecture ให้ scale เป็น multi-user ได้โดยไม่ rewrite

ตอบ 4 คำถามหลัก:
1. ตอนนี้มีเงินอยู่ที่ไหนบ้าง — Account balances
2. มีทรัพย์สินรวมเท่าไหร่ — Net Worth = cash + investments (ไม่นับซ้ำ)
3. ใช้เงินไปกับอะไร — Expense by category
4. การลงทุนมีมูลค่า/กำไรเท่าไหร่ — Portfolio market value & P&L

**หลักออกแบบ:** mobile-first, ลดขั้นตอน user (quick-add ≤ 3 ก้าว), i18n th/en ตั้งแต่วันแรก, ไม่มี double counting, data isolation เข้มงวด, ทุกจำนวนเงินเป็น Decimal

---

## B. Functional Requirements

### B1. Auth & User
- FR-1 สมัคร/เข้าสู่ระบบผ่าน Google OAuth (เผื่อ Apple)
- FR-2 สร้าง `User` อัตโนมัติหลัง verify identity สำเร็จ (upsert by email)
- FR-3 Logout / เพิกถอน session
- FR-4 Protected routes ตาม role (USER / ADMIN) — guard ทั้ง middleware และ server layout
- FR-5 Onboarding: เลือก base currency + ภาษา
- FR-6 Settings: ชื่อแสดง, ภาษา (th/en), base currency, theme, timezone

### B2. Accounts
- FR-7 CRUD บัญชี: name, type, openingBalance, openingBalanceDate, currency, icon, color, status
- FR-8 ดูยอดคงเหลือปัจจุบันต่อบัญชี (คำนวณสด, ในสกุลของบัญชี)
- FR-9 Archive บัญชีที่มี transaction; ลบจริงได้เฉพาะบัญชีที่ไม่มี transaction/transfer/investment
- FR-10 Account type: `CASH`, `BANK`, `EWALLET`, `SAVINGS`, `INVESTMENT`, `OTHER` + custom label

### B3. Transactions (Income / Expense)
- FR-11 CRUD: amount (> 0), kind (INCOME/EXPENSE), accountId (บังคับ), categoryId, subcategoryId?, date, description?, note?
- FR-12 List + filter: date range, account, category, kind, ค้นหาข้อความ
- FR-13 Sort (date, amount) + cursor pagination
- FR-14 Soft delete (`deletedAt`) + กู้คืน
- FR-15 Quick-add flow: จำนวนเงิน → category → account → save (ก้าวบังคับ = 3, date default = วันนี้)
- FR-16 จำ account + category ล่าสุดเป็น default ของ quick-add
- FR-17 Idempotency key กันกดซ้ำ

### B4. Transfer
- FR-18 CRUD transfer: fromAccount, toAccount, fromAmount, toAmount, fromCurrency, toCurrency, fee?, feeAccount?, date, note?
- FR-19 Transfer **ไม่** นับเป็น income/expense ทุกจุดของ analytics
- FR-20 รองรับข้ามสกุลเงิน (fromAmount ≠ toAmount, เก็บ implied rate)
- FR-21 Soft delete

### B5. Category / Subcategory
- FR-22 CRUD Category: name, kind (INCOME | EXPENSE), icon, color, sortOrder
- FR-23 CRUD Subcategory ผูก Category (subcategory optional, สืบทอด kind)
- FR-24 Category เป็นของ user เท่านั้น — ไม่มี global
- FR-25 Seed ชุด default ตอนสมัคร (แก้/ลบได้ทั้งหมด)
- FR-26 ลบ category ที่มี transaction → บังคับ reassign หรือ set null พร้อมเตือน

### B6. Investment / Portfolio
- FR-27 CRUD Portfolio ผูกกับ Account (เช่น Dime)
- FR-28 ค้นหา/เพิ่ม Security ผ่าน Finnhub (symbol, name, type, currency, exchange)
- FR-29 CRUD InvestmentTransaction: BUY / SELL (quantity, price, fee, tradeDate, settlementAccountId?)
- FR-30 คำนวณ Holdings จาก transactions (ไม่กรอก holding มือ)
- FR-31 ต่อ holding: qty, avg cost, current price, market value, unrealized P&L, P&L%, % ของ portfolio
- FR-32 Portfolio summary: total cost, total market value, total unrealized P&L, P&L%, realized P&L
- FR-33 Investment transaction history + filter
- FR-34 กรอก current price เองได้ (manual override ชนะถ้า asOf ใหม่กว่า)
- FR-35 Validate: SELL ไม่เกิน qty ที่ถือ ณ วันนั้น

### B7. Dashboard
Total Net Worth · Cash/Account Balance total · Investment Value · Income This Month · Expense This Month · Net Cash Flow · Account Breakdown · Investment Breakdown · Recent Transactions · Expense by Category · Income vs Expense · Net Worth History · Monthly Comparison

### B8. Analytics (MVP subset)
- ยอดต่อ category เดือนนี้
- Top spending category
- Income − Expense เดือนนี้
- Net Worth เทียบเดือนก่อน
- (P1) MoM % change, trends

### B9. Admin
- Total Users · New Users Today · New Users This Month · Active Users (ประมาณจาก `lastLoginAt`)
- **ไม่มี** สิทธิ์เข้าถึง transaction / balance / portfolio / financial data ของ user

### B10. Settings
ภาษา · base currency · theme · timezone · จัดการ account/category · export data (JSON) · request delete account

---

## C. Non-functional Requirements

| ด้าน | เป้าหมาย |
|---|---|
| Performance | Dashboard TTI < 2.5s บน 4G มือถือ; transaction list query < 300ms |
| Responsive | 360px → 1440px+, mobile-first, Tailwind breakpoints sm/md/lg/xl |
| PWA | installable, standalone, offline read-only shell, Lighthouse PWA pass |
| i18n | th/en สลับได้ทันที; format วันที่/เงิน/ตัวเลขตาม locale + currency |
| Security | OAuth only; server-side authz ทุก endpoint; Zod validation; rate limiting; secrets ใน env |
| Data isolation | ทุก query ผูก `userId` จาก session — ไม่เชื่อ id จาก client; (เสริม) Postgres RLS |
| Reliability | write แบบ atomic (transaction); idempotency บน create; ไม่มี double counting |
| Accessibility | WCAG 2.1 AA พื้นฐาน — keyboard nav, contrast, ARIA |
| Maintainability | TS strict; ไม่ hard-code UI string; Prisma migrate versioned |
| Observability | error tracking (Sentry-compatible); `AuditLog` ทุก mutation การเงิน |
| Scalability | schema รองรับ N users / N investment accounts / N currencies โดยไม่ rewrite |
| Cost | อยู่ใน free tier ของ Vercel + Neon + Finnhub + frankfurter ให้นานที่สุด |

---

## D. User Roles & Permissions

| ความสามารถ | USER | ADMIN |
|---|---|---|
| เข้าสู่ระบบ | ✅ | ✅ |
| จัดการข้อมูลการเงินของตัวเอง | ✅ | ❌ (ไม่มี data) |
| เห็นข้อมูลการเงินของ user อื่น | ❌ | ❌ |
| เห็นสถิติผู้ใช้แบบ aggregate | ❌ | ✅ |
| เห็น transaction/balance/portfolio ราย user | ❌ | ❌ |
| จัดการ role | ❌ | ⚠️ ผ่าน DB/seed ก่อนใน MVP |

- Role เก็บใน `User.role` (`USER` | `ADMIN`)
- ADMIN = superset ของ **auth** เท่านั้น ไม่ใช่ superset ของ **data access**
- Admin คนแรกตั้งผ่าน env `ADMIN_EMAILS` ตอน seed
- Admin service มีเฉพาะ method ที่คืน `COUNT` / `GROUP BY date` — ไม่มี method คืน row การเงิน

---

## E. User Flow

### E1. Onboarding
```
เปิด Wally → Landing → "Continue with Google" → Google consent
→ callback → Auth.js ตรวจ id_token → upsert User (by email)
   ├─ ครั้งแรก → สร้าง User + seed categories → /onboarding (เลือก base currency + ภาษา) → /dashboard (empty state)
   └─ มีแล้ว   → update lastLoginAt → /dashboard
```

### E2. Quick Add Transaction (ต้องเร็วสุด — ข้อ 18)
```
กดปุ่ม + (bottom nav กลาง / FAB)
→ Numpad จำนวนเงิน (autofocus) + toggle Income/Expense
→ เลือก Category (grid icon, default = ล่าสุด)
→ เลือก Account (chip, default = ล่าสุด)
→ (พับไว้) วันที่ = วันนี้, โน้ต
→ Save → toast → กลับ Dashboard
```
ก้าวบังคับ = 3

### E3. Transfer
```
+ → แท็บ Transfer → From account → To account → จำนวน (ถ้าคนละสกุล = 2 ช่อง) → fee? → Save
```

### E4. Investment BUY
```
Portfolio → + Buy → ค้นหา symbol (Finnhub) → qty + price (auto amount) → fee? → settlement account? → Save
→ holdings recompute
```

### E5. เปลี่ยนภาษา
```
Settings → Language → th/en → apply ทันที (cookie NEXT_LOCALE + re-render) + persist ที่ User.locale
```

### E6. Admin
```
login → role=ADMIN → /admin → stat cards (อ่าน aggregate เท่านั้น)
```

---

## F. Information Architecture

```
Wally
├── (public)
│   └── /                      Landing + Login
├── (app)  [USER, auth required]
│   ├── /dashboard             หน้าหลัก
│   ├── /transactions          list + filter + search
│   │   └── /transactions/[id]
│   ├── /accounts              list + balances
│   │   └── /accounts/[id]     detail + transactions ของบัญชีนั้น
│   ├── /portfolio             รวมทุก portfolio
│   │   └── /portfolio/[id]    holdings + investment history
│   ├── /analytics             insight เดือนนี้
│   ├── /reports               (Phase 2)
│   └── /settings
│       ├── /settings/categories
│       ├── /settings/accounts
│       ├── /settings/preferences   (ภาษา, currency, theme, timezone)
│       └── /settings/data          (export, delete account)
└── (admin) [ADMIN only]
    └── /admin                 user stats
```

**Navigation**
- **Mobile:** bottom nav = Dashboard · Transactions · **+** · Portfolio · Settings (Accounts เข้าจาก Dashboard/Settings)
- **Desktop:** left sidebar เต็ม + top bar (search, language, avatar)

---

## G. Feature List (ตาม priority)

### P0 — MVP
- OAuth login (Google), session, protected routes, role guard
- Account CRUD + current balance (multi-currency)
- Transaction CRUD + filter/search/sort/cursor pagination + quick-add
- Transfer CRUD (ข้ามสกุลเงิน)
- Category/Subcategory CRUD + seed defaults
- Portfolio + Security (Finnhub) + InvestmentTransaction (BUY/SELL) + holdings calc
- Current price: Finnhub daily cron + manual override
- FX: historical `FxRate` + daily cron (frankfurter)
- Base currency ต่อ user + แปลงทุก aggregation
- Dashboard (12 block)
- i18n th/en
- PWA (manifest, icon, splash, offline shell)
- Admin stats
- Data export (JSON)
- `AuditLog`, soft delete, idempotency

### P1 — หลัง MVP
Analytics insight (MoM %, trends) · Reports page + export · Dark mode · Apple Sign-In · Soft-delete restore UI

### P2 — อนาคต
Recurring transactions (activate schema) · CSV/statement import · Receipt attachment · Multi-broker investment · Budget/goals · Dividend & split tracking

### ตัดออกจาก MVP (มีเหตุผล)
- **Recurring transactions** — เก็บแค่ตาราง `RecurringRule` (payload JSON) ยังไม่ทำ scheduler/UI
- **หน้า Reports เต็ม** — Dashboard + Analytics ครอบคลุม ~70% แล้ว
- **Analytics insight ขั้นสูง** — MVP ทำแค่ตัวเลขดิบ + เทียบเดือนก่อน
- **Apple Sign-In** — ต้องมี Apple Developer Program ($99/ปี); เพิ่มทีหลังได้โดยไม่แก้ architecture
- **Active Users จริง** — MVP ประมาณจาก `lastLoginAt`
- **Offline write** — MVP offline = อ่าน dashboard ที่ cache ไว้เท่านั้น; ทุก write ต้องออนไลน์
- **Dark mode** — cost ต่ำ แต่ priority ต่ำสุด

---

## H. Database ERD (อธิบายเป็นข้อความ)

- **User** `1─N` FinanceAccount, Category, Transaction, Transfer, Portfolio, InvestmentTransaction, NetWorthSnapshot, RecurringRule, AuditLog
- **FinanceAccount** `1─N` Transaction (ทุก transaction ต้องมี account)
- **FinanceAccount** `1─N` Transfer ในบทบาท `fromAccount` และ `1─N` ในบทบาท `toAccount` (relation แยกชื่อ) และ `1─N` ในบทบาท `feeAccount`
- **FinanceAccount** `1─0..N` Portfolio (Dime = account ที่มี portfolio; account ทั่วไปไม่มี)
- **FinanceAccount** `0..1←` InvestmentTransaction ผ่าน `settlementAccountId` (บัญชีเงินสดที่ตัด/รับเงินตอน BUY/SELL)
- **Category** `1─N` Subcategory; **Category** `1─N` Transaction; **Subcategory** `1─0..N` Transaction
- **Portfolio** `1─N` InvestmentTransaction
- **Security** `1─N` InvestmentTransaction; **Security** `1─N` SecurityPrice
- **Holding** = *ไม่ใช่ตารางหลัก* — คำนวณจาก `InvestmentTransaction` group by `(portfolioId, securityId)` (option: cache เป็น `HoldingSnapshot`)
- **FxRate** — reference data ระดับระบบ (base, quote, rate, asOf) ไม่ผูก user; เก็บ historical ต่อวัน
- **Security / SecurityPrice / FxRate** = shared reference data ทุก user (ไม่ใช่ข้อมูลส่วนตัว)
- **AuditLog** `N─1` User
- Auth.js tables: **Account**, **Session**, **VerificationToken** — business account ตั้งชื่อ DB ว่า `FinanceAccount` จึงไม่ชนกับ Auth.js `Account` (ดู §S1; ต้นฉบับร่างไว้ว่า `AuthAccount`)

**กฎ isolation:** ทุกตารางข้อมูลผู้ใช้มี `userId`; ทุก query กรอง `userId` จาก session เสมอ

---

## I. Database Schema เบื้องต้น (Prisma sketch — design only)

```prisma
// ---------- Auth (Auth.js v5) ----------
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  image           String?
  role            Role      @default(USER)
  locale          Locale    @default(TH)
  baseCurrency    String    @default("THB")   // ISO 4217
  timezone        String    @default("Asia/Bangkok")
  theme           Theme     @default(SYSTEM)
  lastLoginAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  accounts          Account[] // Auth.js OAuth accounts (see §S1)
  sessions          Session[]
  financeAccounts   FinanceAccount[]
  categories        Category[]
  transactions      Transaction[]
  transfers         Transfer[]
  portfolios        Portfolio[]
  investmentTxns    InvestmentTransaction[]
  netWorthSnapshots NetWorthSnapshot[]
  recurringRules    RecurringRule[]
  auditLogs         AuditLog[]

  @@index([createdAt])
}

enum Role   { USER ADMIN }
enum Locale { TH EN }
enum Theme  { LIGHT DARK SYSTEM }

model Account { // Auth.js OAuth account — renamed from the draft's `AuthAccount` (§S1)
  id                String  @id @default(cuid())
  userId            String
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires      DateTime
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// ---------- Accounts ----------
model FinanceAccount {
  id                 String        @id @default(cuid())
  userId             String
  user               User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  name               String
  type               AccountType   @default(BANK)
  customTypeLabel    String?
  openingBalance     Decimal       @db.Decimal(18, 4) @default(0)
  openingBalanceDate DateTime      @default(now())
  currency           String        // ISO 4217
  icon               String?
  color              String?
  status             AccountStatus @default(ACTIVE)
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  transactions   Transaction[]
  transfersFrom  Transfer[]              @relation("TransferFrom")
  transfersTo    Transfer[]              @relation("TransferTo")
  transfersFee   Transfer[]              @relation("TransferFee")
  portfolios     Portfolio[]
  settlementFor  InvestmentTransaction[] @relation("Settlement")

  @@index([userId, status])
}

enum AccountType   { CASH BANK EWALLET SAVINGS INVESTMENT OTHER }
enum AccountStatus { ACTIVE ARCHIVED }

// ---------- Category ----------
model Category {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  kind      TxnKind  // INCOME | EXPENSE
  icon      String?
  color     String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  subcategories Subcategory[]
  transactions  Transaction[]
  @@index([userId, kind])
}

model Subcategory {
  id         String   @id @default(cuid())
  categoryId String
  category   Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  name       String
  icon       String?
  sortOrder  Int       @default(0)
  transactions Transaction[]
  @@index([categoryId])
}

enum TxnKind { INCOME EXPENSE }

// ---------- Transaction (Income / Expense only) ----------
model Transaction {
  id             String       @id @default(cuid())
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  kind           TxnKind
  amount         Decimal      @db.Decimal(18, 4)  // > 0 เสมอ
  currency       String                            // = account.currency ตอนสร้าง
  accountId      String
  account        FinanceAccount @relation(fields: [accountId], references: [id])
  categoryId     String?
  category       Category?    @relation(fields: [categoryId], references: [id])
  subcategoryId  String?
  subcategory    Subcategory? @relation(fields: [subcategoryId], references: [id])
  date           DateTime
  description    String?
  note           String?
  source         TxnSource    @default(MANUAL)     // MANUAL | SYSTEM | IMPORT | RECURRING
  idempotencyKey String?      @unique
  deletedAt      DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([userId, date])
  @@index([userId, accountId, date])
  @@index([userId, categoryId, date])
  @@index([userId, kind, date])
}

enum TxnSource { MANUAL SYSTEM IMPORT RECURRING }

// ---------- Transfer (แยกออกจาก Transaction) ----------
model Transfer {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  fromAccountId String
  fromAccount   FinanceAccount @relation("TransferFrom", fields: [fromAccountId], references: [id])
  toAccountId   String
  toAccount     FinanceAccount @relation("TransferTo",   fields: [toAccountId], references: [id])
  fromAmount    Decimal   @db.Decimal(18, 4)
  toAmount      Decimal   @db.Decimal(18, 4)
  fromCurrency  String
  toCurrency    String
  fee           Decimal   @db.Decimal(18, 4) @default(0)
  feeAccountId  String?
  feeAccount    FinanceAccount? @relation("TransferFee", fields: [feeAccountId], references: [id])
  date          DateTime
  note          String?
  deletedAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  @@index([userId, date])
}

// ---------- Investment ----------
model Portfolio {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  accountId    String
  account      FinanceAccount @relation(fields: [accountId], references: [id])
  name         String   @default("Investment Portfolio")
  baseCurrency String   @default("USD")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  transactions InvestmentTransaction[]
  @@index([userId])
}

model Security {
  id        String       @id @default(cuid())
  symbol    String
  exchange  String?
  name      String
  type      SecurityType @default(STOCK)
  currency  String       @default("USD")
  finnhubSymbol String?                       // symbol ที่ใช้เรียก Finnhub
  createdAt DateTime     @default(now())
  prices        SecurityPrice[]
  transactions  InvestmentTransaction[]
  @@unique([symbol, exchange])
}

enum SecurityType { STOCK ETF CRYPTO FUND OTHER }

model SecurityPrice {
  id         String   @id @default(cuid())
  securityId String
  security   Security @relation(fields: [securityId], references: [id], onDelete: Cascade)
  price      Decimal  @db.Decimal(18, 6)
  currency   String
  asOf       DateTime
  source     String   // 'finnhub' | 'manual'
  @@unique([securityId, asOf, source])
  @@index([securityId, asOf])
}

model InvestmentTransaction {
  id                  String     @id @default(cuid())
  userId              String
  user                User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolioId         String
  portfolio           Portfolio  @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  securityId          String
  security            Security   @relation(fields: [securityId], references: [id])
  type                InvTxnType // BUY | SELL
  quantity            Decimal    @db.Decimal(28, 10)
  price               Decimal    @db.Decimal(18, 6)
  fee                 Decimal    @db.Decimal(18, 6) @default(0)
  amount              Decimal    @db.Decimal(18, 6)   // quantity*price (+fee BUY / -fee SELL)
  currency            String
  tradeDate           DateTime
  settlementAccountId String?
  settlementAccount   FinanceAccount? @relation("Settlement", fields: [settlementAccountId], references: [id])
  note                String?
  idempotencyKey      String?    @unique
  deletedAt           DateTime?
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt
  @@index([userId, portfolioId, tradeDate])
  @@index([securityId])
}

enum InvTxnType { BUY SELL }

// ---------- Reference / system ----------
model FxRate {
  id     String   @id @default(cuid())
  base   String
  quote  String
  rate   Decimal  @db.Decimal(18, 8)
  asOf   DateTime // วันที่ (date-only, 00:00 UTC)
  source String
  @@unique([base, quote, asOf])
  @@index([base, quote, asOf])
}

model NetWorthSnapshot {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date            DateTime // date-only
  baseCurrency    String
  totalCash       Decimal  @db.Decimal(18, 4)
  totalInvestment Decimal  @db.Decimal(18, 4)
  totalNetWorth   Decimal  @db.Decimal(18, 4)
  createdAt       DateTime @default(now())
  @@unique([userId, date])
}

model RecurringRule {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  payload   Json     // template + rrule string — schema only, ยังไม่ implement
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action    String   // 'transaction.create' ...
  entity    String
  entityId  String
  metadata  Json?
  ip        String?
  createdAt DateTime @default(now())
  @@index([userId, createdAt])
}
```

**หลัก:** `Decimal` ทุกจำนวนเงิน (ห้าม float); qty หุ้น precision สูง (รองรับ 2.4187 shares); soft delete ด้วย `deletedAt`; `idempotencyKey` unique กันกดซ้ำ

---

## J. Next.js Folder Structure (App Router)

```
wally/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                      # default categories, admin (ADMIN_EMAILS)
├── messages/
│   ├── th.json
│   └── en.json
├── public/
│   ├── manifest.webmanifest
│   ├── icons/                       # 192, 512, maskable, apple-touch
│   └── splash/                      # iOS launch images
├── src/
│   ├── app/
│   │   ├── layout.tsx               # <html lang>, LINE Sans, theme
│   │   ├── (public)/page.tsx        # landing + login
│   │   ├── (app)/
│   │   │   ├── layout.tsx           # requireUser() + shell (nav)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── transactions/{page.tsx,[id]/page.tsx}
│   │   │   ├── accounts/{page.tsx,[id]/page.tsx}
│   │   │   ├── portfolio/{page.tsx,[id]/page.tsx}
│   │   │   ├── analytics/page.tsx
│   │   │   └── settings/{...}
│   │   ├── (admin)/
│   │   │   ├── layout.tsx           # requireAdmin()
│   │   │   └── admin/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── cron/
│   │   │       ├── prices/route.ts      # Finnhub daily
│   │   │       ├── fx/route.ts          # frankfurter daily
│   │   │       └── networth/route.ts    # daily snapshot
│   │   └── ~offline/page.tsx
│   ├── server/
│   │   ├── auth.ts                  # Auth.js config
│   │   ├── db.ts                    # Prisma client singleton (Neon adapter)
│   │   ├── services/
│   │   │   ├── account.service.ts
│   │   │   ├── transaction.service.ts
│   │   │   ├── transfer.service.ts
│   │   │   ├── category.service.ts
│   │   │   ├── investment.service.ts
│   │   │   ├── dashboard.service.ts
│   │   │   └── admin.service.ts
│   │   └── lib/
│   │       ├── balance.ts           # คำนวณ balance
│   │       ├── networth.ts          # net worth + snapshot
│   │       ├── holdings.ts          # holdings + P&L
│   │       ├── fx.ts                # แปลงสกุล as-of-date
│   │       ├── finnhub.ts           # client + rate limit
│   │       └── guards.ts            # requireUser / requireAdmin
│   ├── lib/
│   │   ├── validation/              # Zod schemas (client + server)
│   │   ├── format.ts               # currency / number / date ตาม locale
│   │   └── money.ts                # Decimal helpers
│   ├── components/
│   │   ├── ui/                      # button, input, sheet, ... (shadcn-style)
│   │   ├── charts/
│   │   ├── nav/                     # BottomNav, Sidebar
│   │   └── forms/                   # QuickAddSheet, TransferForm, InvestmentForm
│   ├── hooks/
│   ├── i18n/                        # routing.ts, request.ts, config.ts
│   ├── styles/globals.css
│   └── middleware.ts               # auth + locale cookie
├── .env.example
└── next.config.ts
```

**Data layer:** Server Components + Server Actions สำหรับ mutation หลัก + Zod validation ทุกจุด; (optional) เพิ่ม tRPC ถ้าต้องการ type-safe API layer ชัดเจน — ตัดสินตอน implement

---

## K. Authentication Architecture

**Auth.js v5 (NextAuth) + Prisma adapter**

- **Providers:** Google OAuth (P0), Apple (P1)
- **Session strategy:** database session (`Session` table) → เพิกถอนได้, เหมาะกับ PWA หลายอุปกรณ์
- **Flow:**
  ```
  /api/auth/signin/google → Google consent → /api/auth/callback/google
  → Auth.js ตรวจ id_token → PrismaAdapter upsert User (by email)
  → event signIn:
      ครั้งแรก → สร้าง seed categories → redirect /onboarding
      มีแล้ว   → update lastLoginAt → redirect /dashboard
  ```
- **Protected routes:** `middleware.ts` เช็ค session cookie สำหรับ `(app)` และ `(admin)`; ใน server layout เรียก `requireUser()` / `requireAdmin()` อีกชั้น (defense in depth)
- **Authorization:** service function รับ `userId` จาก `auth()` session เท่านั้น — ไม่มี endpoint รับ `userId` จาก body/query
- **Role:** `requireAdmin()` เช็ค `session.user.role === 'ADMIN'`; admin service มีเฉพาะ aggregate query
- **CSRF:** Auth.js built-in + Server Actions origin check
- **Rate limiting:** `@upstash/ratelimit` (หรือ in-memory single-instance) ที่ auth callback + mutation + cron
- **Secrets (env):** `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `CRON_SECRET`, `FINNHUB_API_KEY`, `ADMIN_EMAILS`

---

## L. PWA Architecture

- **Manifest:** `name: "Wally"`, `short_name: "Wally"`, `display: "standalone"`, `start_url: "/dashboard"`, `scope: "/"`, `theme_color`/`background_color`, `orientation: "portrait"`, icons 192/512 + maskable, `shortcuts` → "Add Transaction" (`/transactions?new=1`)
- **Icons & Splash:** icon set + `apple-touch-icon` + generated iOS splash (`apple-touch-startup-image` ต่อขนาด) + `apple-mobile-web-app-*` meta
- **Service Worker:** `@serwist/next`
  - Precache: app shell, LINE Sans fonts, icons
  - Runtime cache:
    - static assets → CacheFirst
    - `/dashboard` + GET summary API → StaleWhileRevalidate (โชว์ข้อมูลล่าสุดที่ cache ตอน offline)
    - navigation fallback → `/~offline`
  - Mutations (POST/PUT/DELETE): **ไม่** background sync ใน MVP → offline = ปุ่ม save disabled + แจ้ง "ต้องออนไลน์"
- **Standalone UX:** `env(safe-area-inset-*)`, bottom nav แบบ native, FAB "+", in-app header/back, pull-to-refresh เฉพาะจุดที่เหมาะ
- **Install prompt:** จับ `beforeinstallprompt` → ปุ่มใน Settings + banner subtle (dismiss แล้วจำ)
- **Update flow:** SW ใหม่ → toast "มีเวอร์ชันใหม่ แตะเพื่ออัปเดต"
- **เป้า:** Lighthouse PWA installable + performance ≥ 90 mobile

---

## M. i18n Strategy

- **Library:** `next-intl` (App Router native, รองรับ Server Components)
- **Locales:** `th` (default), `en`
- **เก็บ locale:** cookie `NEXT_LOCALE` (**ไม่มี** `/th` `/en` prefix ใน URL) → ให้ความรู้สึก app; sync กับ `User.locale` หลัง login
- **Message structure:** `messages/{th,en}.json` namespace: `common`, `nav`, `dashboard`, `transaction`, `account`, `category`, `portfolio`, `analytics`, `admin`, `settings`, `auth`, `errors`, `validation`
- **กฎ:** ห้าม hard-code UI string — ทุก string ผ่าน `t('namespace.key')`; category/label ที่ user สร้าง = เก็บ raw text (ไม่แปล)
- **Formatting (helper เดียว, ใช้ `Intl`):**
  - เงิน: `Intl.NumberFormat(locale, { style:'currency', currency })` — Net Worth = base currency; ยอด account = currency ของ account
  - วันที่: `Intl.DateTimeFormat` (ค.ศ.)
  - ตัวเลข: thousand separator ตาม locale
- **Validation:** Zod + map เป็น i18n key
- **`<html lang>`:** ตาม locale ปัจจุบัน
- **ICU MessageFormat:** ใช้ pluralization ของ next-intl

---

## N. Financial Calculation Rules

### N1. ยอดคงเหลือของบัญชี (ณ ปัจจุบัน, ในสกุลของบัญชี)
```
balance(account) =
    account.openingBalance
  + Σ Transaction.amount   WHERE kind=INCOME  AND accountId=account AND deletedAt IS NULL AND date <= now
  − Σ Transaction.amount   WHERE kind=EXPENSE AND accountId=account AND deletedAt IS NULL AND date <= now
  − Σ Transfer.fromAmount  WHERE fromAccountId=account AND deletedAt IS NULL AND date <= now
  + Σ Transfer.toAmount    WHERE toAccountId=account   AND deletedAt IS NULL AND date <= now
  − Σ Transfer.fee         WHERE COALESCE(feeAccountId, fromAccountId)=account AND ...
  − Σ InvestmentTransaction.amount  WHERE type=BUY  AND settlementAccountId=account AND deletedAt IS NULL AND tradeDate <= now
  + Σ InvestmentTransaction.(amount − fee*2? )  WHERE type=SELL AND settlementAccountId=account AND ...
```
> SELL: `amount` เก็บเป็น net proceeds (`qty*price − fee`) → บวกกลับ `amount` ตรง ๆ
> BUY: `amount` เก็บเป็น total cost (`qty*price + fee`) → ลบ `amount` ตรง ๆ
- คำนวณด้วย SQL `SUM` (1 query group by หรือแยก) — **ไม่เก็บ running balance**

### N2. หลักกันคำนวณซ้ำ (double counting)
- Transfer อยู่คนละตาราง → analytics income/expense query ไม่ join Transfer → นับซ้ำไม่ได้
- BUY/SELL ที่มี `settlementAccountId` → กระทบ balance ผ่านสูตร N1 เท่านั้น **ไม่** สร้าง `Transaction` เพิ่ม; ถ้าจะโชว์ในหน้า transaction ให้เป็น virtual row (derive, ไม่ persist)
- BUY/SELL ที่ไม่มี `settlementAccountId` → user จัดการเงินสดเอง (บันทึก transfer/income แยก)

### N3. Net Worth
```
totalCash(user)       = Σ over active accounts  convertFx(balance(account), account.currency → user.baseCurrency, asOf=today)
totalInvestment(user) = Σ over holdings  convertFx(holding.qty × currentPrice(security), security.currency → user.baseCurrency, asOf=today)
netWorth(user)        = totalCash + totalInvestment
```
- **ไม่นับเงินก้อนเดียวซ้ำ:** เงินสดที่ถูกใช้ซื้อหุ้น = ถูกหักจาก `balance(account)` แล้วตาม N1 → เหลือ cash sleeve จริง + market value หุ้น → รวมได้พอดี
- Dime total asset = `balance(Dime cash)` + Σ market value ของ portfolio ที่ผูก Dime

### N4. Income / Expense this month (ใน base currency)
```
incomeThisMonth  = Σ convertFx(Transaction.amount, currency → base, asOf=transaction.date)  WHERE kind=INCOME  AND date ∈ เดือนปัจจุบัน (tz ของ user)
expenseThisMonth = Σ convertFx(...)                                                          WHERE kind=EXPENSE AND date ∈ เดือนปัจจุบัน
netCashFlow      = incomeThisMonth − expenseThisMonth
```
Transfer / investment settlement **ไม่รวม**

### N5. Expense by category
group by `categoryId` (kind=EXPENSE), ช่วงเวลาที่เลือก, แปลง base currency ที่ `asOf=transaction.date`, sort desc

### N6. FX (multi-currency)
- `FxRate` เก็บ historical ต่อวัน; cron รายวันดึงจาก frankfurter.app (`https://api.frankfurter.app/latest?from=EUR`) → normalize เป็น pairs ที่ต้องใช้
- `convertFx(amount, from, to, asOf)`:
  - `from == to` → return amount
  - หา rate `(from → to)` ที่ `asOf` ≤ วันที่ ล่าสุด; ถ้าไม่มี direct ใช้ผ่าน pivot (เช่น USD/EUR)
  - ถ้าไม่มี rate เลย → ใช้ rate ล่าสุดที่มี + flag `approx: true` (UI แสดง "≈")
- Historical rate สำหรับ transaction เก่า: backfill ครั้งแรกจาก frankfurter `/{date}` endpoint

### N7. Net Worth History
- cron รายวัน (`/api/cron/networth`) เขียน `NetWorthSnapshot` 1 แถว/วัน/user (upsert by `[userId, date]`)
- Dashboard chart อ่านจากตารางนี้ (ไม่คำนวณ retroactive แบบ heavy)
- Backfill เริ่มต้น: คำนวณย้อนหลังจาก transaction history ครั้งเดียวตอน user เปิดใช้ dashboard ครั้งแรก (job)

### N8. Rounding
คำนวณด้วย Decimal ตลอด; ปัดเฉพาะตอนแสดงผล (ตาม currency minor unit — ปกติ 2 ตำแหน่ง, บางสกุล 0)

### N9. เวลา
เก็บ `DateTime` เป็น UTC; "วันนี้/เดือนนี้" คำนวณตาม `User.timezone`

---

## O. Investment Calculation Rules

### O1. Holdings (คำนวณจาก transactions — Average Cost)
เรียง `InvestmentTransaction` ตาม `tradeDate, createdAt` ต่อ `(portfolioId, securityId)`:
```
สำหรับแต่ละรายการ:
  BUY:  totalCost += qty*price + fee ;  totalQty += qty
  SELL: avgCostBefore = totalCost / totalQty
        realizedPnL  += (price*qty − fee) − avgCostBefore*qty
        totalCost    −= avgCostBefore*qty
        totalQty     −= qty
ผลลัพธ์:
  qty     = totalQty
  avgCost = totalCost / qty            (ถ้า qty > 0, ไม่งั้น 0)
```
> Average Cost เป็น default (ตรงกับตัวอย่าง "Average Cost" ในข้อ 10). FIFO = option อนาคต

### O2. Market Value & P&L (ต่อ holding)
```
currentPrice     = SecurityPrice ล่าสุดของ security (manual ชนะถ้า asOf ใหม่กว่า)
marketValue      = qty × currentPrice
unrealizedPnL    = marketValue − (avgCost × qty)
unrealizedPnLPct = unrealizedPnL / (avgCost × qty) × 100    (ถ้า avgCost*qty > 0)
```

### O3. Portfolio summary
```
totalCost          = Σ (avgCost × qty)
totalMarketValue   = Σ marketValue
totalUnrealized    = totalMarketValue − totalCost
totalUnrealizedPct = totalUnrealized / totalCost × 100
realizedPnL        = Σ realizedPnL
holding.portfolioPct = holding.marketValue / totalMarketValue × 100
```

### O4. สกุลเงิน
security ส่วนใหญ่ USD; `Portfolio.baseCurrency` = USD; ตอนรวมเข้า Net Worth แปลงเป็น `User.baseCurrency` ด้วย `FxRate`

### O5. Fractional shares
`quantity` = `Decimal(28,10)` รองรับ 2.4187 shares; SELL 0.5 shares ได้; validate SELL ไม่เกิน qty ที่ถือ ณ วันนั้น

### O6. Corporate actions (split, dividend)
**นอก MVP** — ขยาย `InvTxnType` enum (DIVIDEND, SPLIT) ทีหลัง

### O7. Holdings cache
MVP คำนวณ on-the-fly; ถ้าช้าเพิ่ม `HoldingSnapshot` (materialized) อัปเดตตอน write investment transaction

### O8. Finnhub integration
- **Search:** `/search?q=` → symbol lookup ตอน user เพิ่ม security
- **Quote:** `/quote?symbol=` → current price (daily cron ต่อ distinct security ที่มี holding > 0)
- **Rate limit:** 60 req/min free → batch + throttle ใน `finnhub.ts`; ถ้าเกิน → retry รอบถัดไป
- **Symbol not found / non-US:** fallback ให้ user กรอก manual price
- **Snapshot:** cron เขียน `SecurityPrice(source='finnhub', asOf=today)` — ไม่ทับ manual

---

## P. Security Considerations

| หมวด | มาตรการ |
|---|---|
| AuthN | Google OAuth เท่านั้น; ไม่เก็บ password; `AUTH_SECRET` แข็งแรง; DB session + expiry |
| AuthZ | ทุก query ผูก `userId` จาก session; ไม่รับ `userId` จาก client; `requireUser`/`requireAdmin` ทั้ง middleware + service; admin ไม่มี method เข้าถึง row การเงิน |
| Data isolation | Prisma query กรอง `userId` เสมอ; (เสริม) Postgres RLS `user_id = current_setting('app.user_id')` เป็น safety net |
| Input validation | Zod schema ใช้ร่วม client+server; ตรวจ amount > 0, currency ISO 4217, fromAccount ≠ toAccount, SELL ≤ holding |
| DB constraints | FK ทุกจุด; `NOT NULL` บน `accountId`; unique `idempotencyKey`; Decimal ทุก amount |
| API security | Server Actions / route handlers ตรวจ origin + session; field allowlist (กัน mass assignment) |
| Rate limiting | ต่อ user/IP บน auth callback, mutation, cron |
| Cron protection | `/api/cron/*` ตรวจ `Authorization: Bearer CRON_SECRET` (Vercel Cron) |
| Session | httpOnly + Secure + SameSite=Lax cookie; logout เพิกถอน DB session; rotate on privilege change |
| Secrets | ทั้งหมดใน Vercel env vars; `.env` ใน `.gitignore`; มี `.env.example` |
| PII / privacy | ไม่ใส่ข้อมูลการเงินใน URL/query; `AuditLog` เก็บเท่าที่จำเป็น; export data ให้ user; delete account = soft delete + purge job |
| Transport | HTTPS only; HSTS; security headers (CSP, X-Frame-Options, X-Content-Type-Options) ใน `next.config` |
| Dependencies | pin versions; `npm audit` / Dependabot ใน CI |
| Logging | error tracking (Sentry-compatible); ไม่ log token/secret |
| Admin surface | `/admin` แยก route group + guard; query อ่านเฉพาะ `COUNT` / `GROUP BY date` |
| Backup | เปิด Neon PITR / branching |

---

## Q. Development Roadmap

### Phase 0 — Foundation
- Next.js + TS strict + Tailwind + LINE Sans
- Prisma + Neon + schema แรก + migrate + `seed.ts`
- Auth.js + Google login + DB session + `requireUser`/`requireAdmin`
- `middleware.ts` (auth + locale) + route groups `(public)`/`(app)`/`(admin)` + shell
- `next-intl` + `th.json`/`en.json` โครง + `format.ts`
- Design system: color tokens, typography, `ui/` components, BottomNav + Sidebar responsive

### Phase 1 — Core money tracking
- Account CRUD + `balance.ts` + หน้า Accounts
- Category/Subcategory CRUD + seed defaults + Settings > Categories
- Transaction CRUD + list (filter/search/sort/cursor pagination) + QuickAddSheet (≤ 3 ก้าว, จำ default)
- Transfer CRUD (ข้ามสกุลเงิน)
- Zod validation + idempotency + `AuditLog` + soft delete
- `FxRate` + `fx.ts` + `/api/cron/fx` + backfill historical rates

### Phase 2 — Investment
- Portfolio + Security search (Finnhub) + InvestmentTransaction (BUY/SELL)
- `holdings.ts` (avg cost, P&L, portfolio %)
- `/api/cron/prices` (Finnhub) + manual price override
- หน้า Portfolio + Portfolio detail + investment history
- ตรวจ no-double-count (settlement account)

### Phase 3 — Dashboard & Analytics
- Dashboard 12 block + charts
- `networth.ts` + `NetWorthSnapshot` + `/api/cron/networth` + backfill + กราฟประวัติ
- Analytics MVP (category totals, net worth vs last month, top category)

### Phase 4 — PWA & polish
- manifest + icons + splash + `@serwist/next` + `/~offline`
- install prompt + update toast + safe-area + standalone UX
- Lighthouse pass, a11y pass, empty states, loading skeletons
- Admin dashboard (stats)
- Data export (JSON) + request delete account

### Phase 5 — Hardening
- Rate limiting, security headers, CSP
- (เสริม) Postgres RLS
- Error tracking; E2E (Playwright) flow หลัก; unit test `balance.ts` / `holdings.ts` / `fx.ts`
- Dark mode; Apple Sign-In (ถ้าเอา)

### Backlog (Phase 6+)
Recurring transactions · CSV/statement import · Receipt attachment · Reports page เต็ม · Budget/goals · Multi-broker · Dividend/split

---

## R. Open Questions
1. ~~Apple Sign-In~~ — **ตัดออก** (ยืนยันแล้ว: Google อย่างเดียว)
2. Error tracking ใช้ตัวไหน (Sentry free tier / อื่น) — default: Sentry
3. ~~Category default set~~ — **กำหนดแล้ว** ดู `src/server/data/default-categories.ts`
4. ~~ปฏิทิน~~ — **ค.ศ. ทั้งสองภาษา** (บังคับผ่าน `th-TH-u-ca-gregory`)
5. Budget/Goal tracking — **อยู่ใน vision ระยะยาว** เพิ่มภายหลังแบบ additive (ตาราง `Budget` / `Goal` ใหม่ ไม่แตะ schema เดิม); ยังไม่ทำ schema stub

---

## S. Implementation Notes — Phase 0 (living)

Deviations from the design above, made during Phase 0 build (all minor / additive):

| # | Change | เหตุผล |
|---|---|---|
| S1 | Auth.js model ชื่อ **`Account`** (ไม่ใช่ `AuthAccount`); business model ยังเป็น **`FinanceAccount`** | `@auth/prisma-adapter` คาดหวังชื่อ `Account` และไม่ชนกันเพราะ business ใช้ `FinanceAccount` อยู่แล้ว |
| S2 | เพิ่ม **`Category.systemKey`** + **`Subcategory.systemKey`** (nullable) | i18n ของ default categories: seeded rows มี key ไว้ resolve ผ่าน `categories.*`; user-created = null → แสดง `name` ตรง ๆ |
| S3 | เพิ่ม **`User.emailVerified`** | ต้องมีสำหรับ `@auth/prisma-adapter` |
| S4 | เพิ่ม **`Transfer.idempotencyKey`** | ให้สอดคล้องกับ `Transaction` / `InvestmentTransaction` |
| S5 | `datasource` ใช้ **`directUrl`** | รองรับ Neon pooled + direct (migrate) |
| S6 | **Route protection:** middleware เช็คแค่ session cookie (edge-safe); authz จริงอยู่ที่ `requireUser()` / `requireAdmin()` ฝั่ง server | database session ตรวจเต็มบน edge ไม่ได้ |
| S7 | **next-intl "no i18n routing"** (locale ใน cookie `NEXT_LOCALE`, ไม่มี `/th` `/en`) | ตรงกับ §M; ไม่ต้องมี locale middleware |
| S8 | pnpm `overrides` pin **`@auth/core@0.37.2`** + `@auth/prisma-adapter@2.7.4` | กัน core สองเวอร์ชันชนกันกับ `next-auth@5.0.0-beta.25` |
| S9 | Seed on first sign-in ผ่าน Auth.js `events.createUser` → `seedUserDefaults()` + `applyAdminBootstrap()` (`ADMIN_EMAILS`) | onboarding ขั้นต่ำ; หน้า `/onboarding` เต็มค่อยทำภายหลัง (schema defaults ครอบคลุมแล้ว) |

**Known warnings (harmless):** Prisma 6 เตือน `package.json#prisma` seed config deprecated → ย้ายไป `prisma.config.ts` ตอนอัป Prisma 7. `next lint` เตือน deprecated → ย้ายไป ESLint CLI ภายหลัง.

**Stack versions ที่ล็อกจริง:** Next 15.5 · React 19.2 · Prisma 6.19 · next-auth 5.0.0-beta.25 · next-intl 3.26 · Tailwind 4.3 · TypeScript 5.9 (strict + `noUncheckedIndexedAccess`).

### Phase 1 deltas

| # | Change | เหตุผล |
|---|---|---|
| S10 | `transactionListSchema`: ใช้ **`type` (`ALL`/`INCOME`/`EXPENSE`/`TRANSFER`)** แทน `kind` + `includeTransfers` | UI filter เดียวคุมทั้ง income/expense/transfer; transfer-only feed ได้ด้วย |
| S11 | Feed แบบรวม (transactions + transfers) ใช้ **keyset cursor** `base64url(date\|createdAt\|id)` เรียง `date desc, createdAt desc, id desc`; merge transfers เฉพาะ `type=ALL` + ไม่มี category filter + sort=date | pagination เสถียรบน feed ต่างชนิด โดยไม่ใช้ SQL UNION |
| S12 | Fee ของ transfer: ถ้าไม่ระบุ `feeAccountId` → หักจาก `fromAccount` (สะท้อนใน `balance.ts`) | ให้ default ชัดเจน |
| S13 | Investment settlement ถูกรวมใน `computeAccountBalances` แล้ว (BUY = −amount, SELL = +amount ผ่าน `settlementAccountId`) แม้ยังไม่มี UII investment (Phase 2) | เลี่ยง migration/แก้ balance ซ้ำ; no-op จนกว่าจะมีข้อมูล |
| S14 | FX pivot = **USD**; `FxRate` เก็บ `base=USD, quote=X` รายวัน; source = `frankfurter` (ECB, ฟรี, ไม่ต้อง key). `convert()` fallback → rate ล่าสุด ≤ วันที่ แล้ว flag `approx` | ตรง §N6; timeseries endpoint = backfill ใน 1 request |
| S15 | Quick Add ใช้ **vaul** bottom-sheet + on-screen numpad; จำ account/category ล่าสุดใน `localStorage` (`wally:lastAccount`, `wally:lastCategory:<kind>`); เปิดจาก BottomNav `+`, Sidebar, หรือ `?new=1` | flagship flow ≤ 3 ก้าว (§18) |
| S16 | Server Actions ทุกตัวห่อด้วย `action(schema, handler)` → auth + Zod + `ActionResult` มาตรฐาน; idempotency key ต่อ create; ทุก mutation เขียน `AuditLog` | §P (security), §12 (no double count), FR-17 |
| S17 | เพิ่ม dep: `@radix-ui/react-dialog`, `vaul`, `sonner` (toast) | UI primitives |
| S18 | Cron: `vercel.json` → `/api/cron/fx` daily `0 4 * * *`, ป้องกันด้วย `Authorization: Bearer $CRON_SECRET` | §L cron protection |
| S19 | Scripts: `pnpm dev:user` (สร้าง local user+session สำหรับ smoke test โดยไม่ต้องมี Google), `pnpm fx:backfill [days]` | dev tooling |

**LINE Seed Sans TH** ติดตั้งแล้วที่ `public/fonts/Web/WOFF2/` (weights: Rg 400–500, Bd 600–700, XBd 800–900) — `@font-face` ใน `globals.css` ชี้ path จริง

### Phase 2 deltas

| # | Change | เหตุผล |
|---|---|---|
| S20 | **Login DX:** `auth.config.ts` ใส่ Google provider เฉพาะเมื่อมี `AUTH_GOOGLE_ID`+`AUTH_GOOGLE_SECRET` (`googleConfigured`); landing page ซ่อนปุ่ม + ขึ้นข้อความแทน | กัน error `Missing required parameter: client_id` ตอน creds ยังว่าง |
| S21 | เพิ่ม **`docs/SETUP.md`** — ขั้นตอน Google OAuth (consent screen, redirect URI `/(app)/api/auth/callback/google`), `AUTH_SECRET`, dev shortcut | onboarding นักพัฒนา |
| S22 | **`holdings.ts`** — Average Cost engine (pure): `computeHolding()` (qty, avgCost, costBasis, realizedPnL), `marketMetrics()`, `quantityAsOf()` (กัน oversell); คำนวณจาก BUY/SELL เสมอ ไม่เก็บ current holding | §O1–O3, §O5 fractional shares |
| S23 | **`Security` / `SecurityPrice` เป็น global reference** (ไม่ผูก user); manual price override = `SecurityPrice(source='manual')` ชนะ `finnhub` เมื่อ `asOf` ใหม่กว่า; `getLatestPrices()` เลือกแถวล่าสุดต่อ security | §H, §O4, FR-34 |
| S24 | **No double count (§12) — verified by integration test:** BUY ที่มี `settlementAccountId` → หักเงินสดจากบัญชีนั้นครั้งเดียวผ่าน `balance.ts` (ไม่สร้าง `Transaction` เพิ่ม); Net worth ของบัญชี = cash balance + Σ market value | §N2, §12 |
| S25 | **Finnhub** (`lib/finnhub.ts`) degrade ได้: ไม่มี `FINNHUB_API_KEY` → search คืน `[]`, quote คืน `null` → UI ใช้กรอก symbol/price เอง; `/api/cron/prices` (จันทร์–เสาร์ `0 5`) refresh เฉพาะ security ที่ถืออยู่ | §O8 rate limit 60/min |
| S26 | Portfolio delete บล็อกถ้ามี investment transaction (archive-style ยังไม่มี — ลบ trade ก่อน) | ป้องกันข้อมูลหาย |
| S27 | Scripts: `pnpm dev:user` เพิ่ม balance/portfolio demo ได้เอง; ยังไม่มี seed portfolio อัตโนมัติ | — |

**Tests:** 33 passing — `holdings` (8, avg-cost/fractional/realized), `finance` integration (9, balance + FX + **no-double-count** + oversell + SELL realized).

### Phase 3 deltas

| # | Change | เหตุผล |
|---|---|---|
| S28 | **`networth.ts`** — `computeNetWorth(userId, {asOf})`: Σ cash balance (FX→base) + Σ portfolio market value (FX→base); คืน breakdown ต่อ account/portfolio + flag `approx` เมื่อ FX stale/missing | §N3, §13 |
| S29 | `computeAccountBalances` รับ `{ asOf }` (filter `date`/`tradeDate ≤ asOf`) → คำนวณ balance/net worth ย้อนหลังได้ | รองรับ snapshot backfill |
| S30 | `getPricesAsOf(ids, asOf)` — ราคา security ที่ใกล้ที่สุด ≤ วันที่ (fallback ราคาแรกสุด) | net worth history ที่ราคาถูกต้องตามวัน |
| S31 | **`NetWorthSnapshot`** — `snapshotNetWorth()` (upsert ต่อวัน), `/api/cron/networth` (daily `30 5`, all users), `pnpm networth:backfill <email> [days]` | §N7, dashboard chart |
| S32 | **Analytics aggregation** (`lib/analytics.ts`): `monthRange(tz, offset)` (tz-aware boundaries สำหรับ fixed-offset zone), `sumFlows` / `amountByCategory` — group by `(currency, …)` แล้ว convert รอบเดียวต่อสกุลที่ **period-end rate** (ไม่ใช่ per-txn — approximation ที่ยอมรับได้สำหรับ aggregate รายเดือน) | performance vs §N4 |
| S33 | Dashboard 13 block + **charts เขียนเองด้วย SVG** (`components/charts/`: LineChart, IncomeExpenseBars, CategoryBars, StatCard) — ไม่มี dep chart lib | bundle เล็ก (dashboard 4kB), คุม theme เต็ม |
| S34 | Analytics page = insight เป็นประโยค (ICU MessageFormat: "เดือนนี้คุณใช้เงินกับ Food ฿4,200", "เพิ่มขึ้น 18%") + category trends ต่อหมวด (MoM %) | §14 |
| S35 | **Settlement currency ต้องตรงกับ security currency** — `createInvestmentTransaction`/`update` reject `settlement_currency_mismatch` (เพราะ `balance.ts` ย้ายเงินสด 1:1 ไม่แปลง FX); ถ้าต่างสกุล → เว้น settlement account แล้วบันทึก transfer เอง | ความถูกต้องของ balance ข้ามสกุล |
| S36 | `formatDate()` — ไม่ผสม `dateStyle` กับ component options (month/day) แล้ว | กัน `Intl` throw |

**Tests:** 35 passing — เพิ่ม net worth multi-currency (cash+investment แปลง FX ไม่นับซ้ำ, `netWorth = 14320` จาก 10000 THB + $120×36) + settlement-currency-mismatch reject.

### Phase 4 deltas

| # | Change | เหตุผล |
|---|---|---|
| S37 | **Mobile nav (ตามที่ผู้ใช้ขอ):** เพิ่ม `MobileTopBar` (sticky, `md:hidden`) มีปุ่ม ☰ เปิด `Sidebar` เป็น **left drawer** (vaul `direction="left"`); **BottomNav คงเดิม**. Sidebar content แยกเป็น `SidebarNav` ใช้ร่วมกัน desktop + drawer | UX มือถือ: เข้าถึงเมนูเต็ม (accounts/analytics/admin/lang/logout) โดยไม่เสีย bottom nav |
| S38 | **PWA — Serwist** (`@serwist/next`): `src/app/sw.ts` (precache + `defaultCache` runtime + navigation fallback → `/~offline` สำหรับ `document`), `disable` ใน dev, `register:false` + `<ServiceWorker/>` จัดการเอง; mutation (POST/PUT/DELETE) ผ่าน network ตรง (offline = อ่านอย่างเดียว ตาม §L) | §L |
| S39 | **Update UX:** SW ใหม่ waiting → toast "มีเวอร์ชันใหม่ · อัปเดต" → `postMessage(SKIP_WAITING)` → `controllerchange` → reload | §L |
| S40 | **Icons/splash:** `src/app/icon.svg` (favicon) + `scripts/gen-pwa-assets.ts` (sharp) สร้าง `public/icons/*` (192/512/maskable/apple-touch) + `public/splash/*` (10 iOS sizes); `<AppleSplash/>` ใส่ `apple-touch-startup-image` ต่ออุปกรณ์; manifest มี `id`, `display_override`, shortcuts 2 อัน | §PWA |
| S41 | **Install prompt:** `usePwaInstall()` จับ `beforeinstallprompt` → ปุ่ม "ติดตั้งแอป" ใน SidebarNav (แสดงเมื่อ available; iOS/Firefox ไม่มี → ซ่อน) | §L |
| S42 | **Admin dashboard** (`admin.service.ts`, ADMIN only): Total / New today / New this month / Active (login ≤ 30 วัน) + signups 30 วัน (LineChart) — **query เฉพาะ `prisma.user` count/groupBy ไม่มี COUNT/SELECT ตารางการเงิน** | §16, §D |
| S43 | **Data export:** `GET /api/export` (auth) → JSON ทั้งหมดของ user เอง (ไม่มี OAuth token) + `Content-Disposition: attachment`; audit `data.export` | §20 privacy |
| S44 | **Account deletion:** `/settings/data` → พิมพ์ `DELETE` ยืนยัน → `deleteMyAccountAction` → `prisma.user.delete` (cascade ทุกตาราง) → `signOut`; audit `account.delete_self` | §20 |
| S45 | Loading skeletons: `loading.tsx` + `PageSkeleton` สำหรับ dashboard/transactions/portfolio(+[id])/analytics/accounts | UX |
| S46 | **Plugin order สำคัญ:** `withNextIntl(withSerwist(nextConfig))` (Serwist ชั้นใน) — สลับกันแล้ว `/_not-found` prerender พัง (`a[d] is not a function`) | build fix |
| S47 | `.gitignore`: `public/sw.js*`, `public/swe-worker-*.js` (build output); dep เพิ่ม `@serwist/next` + `serwist` (dev) + `sharp` (dev, gen assets) | — |

**Known gap:** offline = อ่าน dashboard/หน้าที่ cache ไว้เท่านั้น (ตั้งใจตาม §MVP); background sync ของ mutation ไม่ทำ.

### Phase 5 deltas

| # | Change | เหตุผล |
|---|---|---|
| S48 | **Rate limiting** (`lib/rate-limit.ts`) — fixed-window, in-memory Map (best-effort บน serverless หลาย instance); ผูกใน `action()` wrapper (60 writes/นาที/user), security search (30/นาที), `/api/export` (5/นาที → 429); prod อัปเกรดเป็น `@upstash/ratelimit` (signature เดียวกัน) | §P |
| S49 | **CSP + headers** ใน `next.config.ts`: `default-src 'self'`, `connect-src 'self'` (frankfurter/Finnhub เรียก server-side), `img-src` เพิ่ม `*.googleusercontent.com` (avatar), `frame-ancestors 'none'`, `object-src 'none'`, `upgrade-insecure-requests`, + `Strict-Transport-Security`. `'unsafe-inline'` ยังคงไว้ (Next bootstrap + Tailwind) — nonce-based เป็นสเต็ปถัดไป | §P, §20 |
| S50 | **Dark mode** — `User.theme` (มีอยู่แล้ว) + cookie `wally-theme` → SSR ตั้ง `<html data-theme>` (ไม่ FOUC); `ThemeToggle` 3 ทาง (Light/Dark/System) ใน Settings, สลับสดไม่ reload + persist ผ่าน `setTheme` action; globals.css รองรับ `[data-theme]` + `prefers-color-scheme` อยู่แล้ว | §19 |
| S51 | **Error boundaries** — `app/(app)/error.tsx` (i18n, ปุ่ม try again), `app/global-error.tsx` (last-resort, neutral, ไม่มี i18n provider) | UX hardening |
| S52 | **E2E (Playwright)** — `playwright.config.ts` + `e2e/global-setup.ts` (seed test user+session) + `e2e/smoke.spec.ts` (5 tests: landing, protected redirect, offline page, authed dashboard via session cookie, สลับภาษา); `pnpm e2e` | roadmap |
| S53 | Unit tests เพิ่ม — `analytics.test.ts` (`monthRange` tz-math ข้ามเดือน/ปี, `pctDelta`), `rate-limit.test.ts`; `monthRange` รับ `now` param เพื่อทดสอบได้ | roadmap "unit test balance/holdings/fx" |
| S54 | **Postgres RLS — deferred** (roadmap ทำเครื่องหมาย "เสริม"). เหตุผล: Prisma ต้อง `SET LOCAL app.user_id` ต่อ request ในทรานแซกชันเดียว ซึ่งเปราะกับ Neon pooled connection; ปัจจุบัน isolation บังคับที่ service layer ทุก query (มี integration test ยืนยัน) + `requireUser()`. SQL sketch: `ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY; CREATE POLICY owner ON "Transaction" USING ("userId" = current_setting('app.user_id', true));` + Prisma `$extends` ที่ครอบทุก query ด้วย `$transaction` ที่ set ตัวแปร — ทำเมื่อเปิด multi-tenant จริง | §20 |

**Tests:** 43 unit/integration + 5 e2e passing.

**Roadmap complete (Phase 0–5).** เหลือ backlog: Reports page (§15), Recurring transactions (§9, schema พร้อม), CSV import, receipt attachment, budget/goals, Sentry DSN, nonce-CSP, RLS.
