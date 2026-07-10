# SkillBridge — Architecture & Build Specification

> Student‑to‑SME services marketplace for Malaysia.
> This document describes the **implemented** system — a Django + Strawberry GraphQL backend and a Next.js + Apollo frontend — plus the remaining work. It replaces the original prescriptive Django+HTMX build plan, which was superseded by the architecture actually built.

---

## 0. Product Summary (from the concept)

SkillBridge connects Malaysian university students with local SMEs that need affordable digital work: graphic design, content writing, social media, web development, and data tasks.

- **Wedge:** one campus talent pool serving nearby SMEs.
- **Revenue model:** flat **2% fee charged to the business only**, on top of the task price. Students keep **100%** of what they earn.
- **Moat:** vetting data on each student + deepening SME relationships → recurring managed marketplace, not a one‑off gig board.
- **Scale path:** Campus → Klang Valley → national → SEA.
- **Trust mechanics baked into the design:** escrow-style payment holding (released only on approval), "campus‑vetted" student badges, "SSM verified" business badges.

---

## 1. Architecture (as built)

| Decision | Choice | Notes |
|---|---|---|
| Backend framework | **Django 6.0** | Apps: `users`, `projects`, `engagements`, `payments`, `api`, `core` (settings) |
| API layer | **Strawberry GraphQL** — single endpoint `POST /graphql/` | Schema lives in `backend/api/` (`schema.py`, `queries.py`, `mutations.py`, `types.py`) |
| Frontend | **Next.js (app router) + Apollo Client** in `frontend/` | Tailwind v4 CSS-first tokens in `frontend/app/globals.css` |
| Auth | **Django session auth** via GraphQL mutations (`register`/`login`/`logout`), plus **Google Sign-In** (`loginWithGoogle`) and **email verification** (`verifyEmail`/`resendVerification`); custom `users.User` with `role` (student / sme / admin) | Apollo sends `credentials: "include"`; CORS restricted to `http://localhost:3000` with credentials. Google button activates when `GOOGLE_CLIENT_ID`/`NEXT_PUBLIC_GOOGLE_CLIENT_ID` are set; Apple login is future work |
| Database | SQLite in dev; Postgres via env vars in `core/settings.py` | Switch is automatic when `DB_NAME`/`DB_USER` etc. are set |
| File storage | Local `media/` (dev); uploads via `POST /api/upload/<engagement_id>/` | S3/R2 + presigned uploads is future work — do not proxy multi-GB files through Django in production |
| Chat | Apollo **polling** on the Office screen | Upgrade path: Django Channels / WebSockets |
| Payments / escrow | **Gateway abstraction** (`payments/gateway.py`): redirect + webhook flow with a **dev simulator** (default, no keys) and a **Billplz driver** (sandbox by default, enabled via `PAYMENT_GATEWAY=billplz` + keys). `Transaction` + `LedgerEntry` track state; funds custody stays with the gateway | See §11 — no real money moves until Billplz keys are configured |
| Background jobs | None | Add Celery + Redis when async email/notifications are needed |

---
## 1.2 Design System & Visual Language

The visual identity of SkillBridge is clean, trustworthy, and modern, designed to feel like a premium SaaS product rather than a traditional, cluttered gig board. When building the frontend templates (Django + HTML/CSS), adhere to these core UI/UX principles derived from the design files:

**1. Color Palette**
* **Primary Brand (Action & Focus):** Vibrant Indigo/Purple. Used for primary buttons, active states, and the main logo. (Reference: The gradient `linear-gradient(135deg, #4E3FE3, #7B62F2)` mentioned in the models).
* **Backgrounds:** Very light, cool gray/blue (e.g., `#F7F9FC`) for the main application background. This ensures that the white content cards pop out.
* **Cards & Surfaces:** Pure White (`#FFFFFF`).
* **Text:** Dark slate/charcoal for primary text (high legibility), medium gray for secondary text and descriptions.
* **Semantic Accents:** * *Green:* Used for "Delivered" statuses, checkmarks, and positive highlights (e.g., "RM 0" fee for students).
    * *Orange:* Used for SME-specific actions/labels (e.g., "I'm a business" CTA) to visually separate them from student actions.

**2. Typography**
* **Font Family:** A clean, modern sans-serif (e.g., Inter, SF Pro, or Roboto). 
* **Hierarchy:** Strong contrast in font weights. Main headings are bold and prominent, while standard paragraph text is light and breathable.

**3. Core UI Components**
* **Cards:** The fundamental building block. Every task, profile, and stat block is a card. They feature **large border-radiuses** (approx. 16px - 24px) and **soft, diffuse drop shadows** (no harsh borders).
* **Buttons:** Pill-shaped (fully rounded ends). Primary actions use the solid indigo color; secondary actions are often subtle outlines or text-only links.
* **Chips & Tags:** Used extensively for categories, skills, and statuses. These are small, pill-shaped elements with light backgrounds and colored text (e.g., a light purple background with dark purple text for design skills).
* **Progress Tracker:** The escrow/engagement state (Reached out → Agreed → In progress → Delivered → Completed) is represented as a horizontal timeline with connected dots. Active/completed steps are solid indigo; future steps are gray.

**4. Layout Patterns**
* **Dashboard Structure:** The main app uses a sticky top navigation bar featuring the logo, primary links (Home, Office, Wallet), role-switcher, and user avatar.
* **Detail Pages (Task/Profile):** Utilizes an asymmetrical two-column layout. The left column (roughly 65-70% width) holds the heavy content (descriptions, required skills), while the right sidebar contains sticky, actionable summaries (Cost breakdown, Quick facts, CTAs).
* **Spacing:** Generous padding inside cards and significant margins between sections. Avoid dense, cramped text blocks.
---

> **§1.2 above, together with the reference screenshots in `docs/images/*.png`, is the authoritative design spec for the frontend.** The screenshots show the target look of Landing, Auth, Student Home, Task Detail, Student Profile Detail, and Office.

---

## 2. Screens Inventory

Every screen from the original prototype is implemented as a Next.js route.

| # | Screen | Route | Source |
|---|---|---|---|
| 01 | **Landing** | `/` | `frontend/app/page.tsx` |
| 02 | **Auth** (sign up / sign in, role-aware) | `/auth` | `frontend/app/auth/page.tsx` |
| 03 | **Student Home** (task marketplace) | `/home` (role = student) | `frontend/src/components/StudentHome.tsx` |
| 04 | **Task Detail** | `/home/tasks/[id]` | `frontend/app/home/tasks/[id]/page.tsx` |
| 05 | **SME Home** (talent marketplace) | `/home` (role = sme) | `frontend/src/components/SmeHome.tsx` |
| 06 | **Student Profile Detail** | `/home/talent/[id]` | `frontend/app/home/talent/[id]/page.tsx` |
| 07 | **Office** (messaging + 5-step tracker) | `/office` | `frontend/app/office/page.tsx` |
| 08 | **Wallet** (role-aware earnings/spend) | `/wallet` | `frontend/app/wallet/page.tsx` |
| + | **My Tasks** (SME project management, beyond the original 8) | `/my-tasks`, `/my-tasks/new` | `frontend/app/my-tasks/` |

---

## 3. Getting Started

```bash
# Backend (Terminal 1)
cd backend
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data   # demo marketplace — see §16
python manage.py runserver        # http://localhost:8000

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev                       # http://localhost:3000
```

GraphiQL is available at `http://localhost:8000/graphql/`, Django admin at `/admin/`.

---

## 4. Project Structure

```
Skills_Bridge/
├── backend/
│   ├── core/                    # Django settings, root urls, wsgi/asgi
│   ├── api/                     # GraphQL: schema.py, queries.py, mutations.py, types.py, views.py (upload)
│   ├── users/                   # User (custom, role-based), StudentProfile, SMEProfile, vetting
│   ├── projects/                # Project (task), milestones, saved items, reviews, seed command
│   │   └── management/commands/seed_demo_data.py
│   ├── engagements/             # Engagement (thread + state machine), Message, Attachment
│   │   └── services.py          # status transition rules
│   ├── payments/                # Transaction (escrow), LedgerEntry
│   │   └── services.py          # fee calc, fund/release escrow, wallet stats
│   ├── media/                   # dev uploads
│   └── manage.py
├── frontend/
│   ├── app/                     # Next.js routes (see §2)
│   │   └── globals.css          # Tailwind v4 design tokens (@theme)
│   └── src/
│       ├── components/          # Navbar, TaskCard, StudentCard, Chip, CostBreakdown, StudentHome, SmeHome, ...
│       ├── graphql/             # queries.ts, mutations.ts, types.ts
│       └── lib/                 # apollo-client.ts, categories.ts, format.ts, errors.ts
└── docs/
    ├── skills/SKILL.md          # this file
    └── images/*.png             # design reference screenshots (see §1.2)
```

---

## 5. Data Models (implemented)

### 5.1 `users`

- **`User(AbstractUser)`** — `role` (`student` / `sme` / `admin`), `phone`, `is_verified`, `avatar`, `created_at`. Registered as `AUTH_USER_MODEL`.
- **`StudentProfile`** — one-to-one with User: `university`, `major`, `graduation_year`, `primary_category` (Design/Writing/Social Media/Web/Data/Video), `skills` (JSON list), `bio`, `portfolio_url`, `languages`, `price_low`/`price_high`, `availability_status`/`available_from`, `rating`/`rating_count`, and the vetting fields **`is_vetted`, `vetted_at`, `vetted_by`** (manual admin workflow — the product's moat).
- **`SMEProfile`** — one-to-one with User: `company_name`, `industry`, `location`, `website`, `description`, **`ssm_number`, `is_verified`** (SSM = Companies Commission of Malaysia; the number is public registry data, so exposing it via the API is acceptable), `rating`/`rating_count`.

### 5.2 `projects`

- **`Project`** — the "Task" from the prototype: `sme` FK, optional `assigned_student`, `title`, `description`(+`_extra`), `category` (5 verticals), `budget` (fixed price paid to the student), `deadline`, `status` (open / in_progress / completed / cancelled / disputed), `required_skills` + `looking_for_bullets` (JSON lists).
- **`ProjectMilestone`** — label, note, due_date, order.
- **`SavedTask`** (student ↔ project, unique) / **`SavedStudent`** (sme ↔ student, unique) — bookmark toggles.
- **`Review`** — reviewer/reviewee (User FKs), optional project + engagement, integer `rating`, `comment`; `projects/services.py` recomputes the profile's aggregate rating on submit.

### 5.3 `engagements`

- **`Engagement`** — one thread = one SME↔student relationship, optionally tied to a Project: `status` (**reached_out → agreed → in_progress → delivered → completed**), `agreed_price`. The Office screen's 5-step tracker renders this field directly — there is no separate UI enum to drift out of sync.
- **`Message`** — engagement FK, sender, text, ordered by `created_at`.
- **`Attachment`** — message FK, `file` (to `engagement_files/%Y/%m/`), `original_name`, `size_bytes`.

### 5.4 `payments`

- **`Transaction`** — the escrow hold, one-to-one with Engagement: `amount`, `platform_fee`, `status` (pending / held / released / refunded / failed), `payment_reference` (currently `"TEST-MODE"`). Tracks state, not real bank balances — custody stays with the (future) licensed gateway.
- **`LedgerEntry`** — append-only: `user`, `engagement`, `kind` (earning / spend / fee), `amount`. Backs all Wallet stats and the month-over-month chart.

---

## 6. GraphQL API Surface

Single endpoint: `POST /graphql/` (session-cookie auth). Non-GraphQL endpoints: `POST /api/upload/<engagement_id>/` (multipart file upload), `GET|POST /api/payments/dev-checkout/<tx_id>/` (dev gateway's simulated checkout, signed URL), `POST /api/payments/webhook/` (gateway callback, signature-verified), and `/admin/`.

**Queries** (`backend/api/queries.py`):

| Query | Args | Notes |
|---|---|---|
| `me` | — | `null` when anonymous |
| `projects` | `search, status, category, minPrice, maxPrice, sort` | defaults to `status=open`; `sort: "price"` orders by budget desc, else newest first |
| `project(id)` / `myProjects` | | `myProjects` requires SME role |
| `savedTaskIds` / `savedStudentIds` | — | role-scoped bookmark id lists |
| `students` | `search, category, minPrice, maxPrice, minRating` | talent marketplace; ordered by rating desc |
| `student(id)` | | |
| `engagements` / `engagement(id)` | | participant-scoped |
| `walletStats` | — | role-aware stats + 6-month series from `payments.services.wallet_stats_for` |

**Mutations** (`backend/api/mutations.py`), with permission classes `IsAuthenticated` / `IsStudent` / `IsSME` / `IsAdmin` / `IsSMEOrAdmin`:

- **Auth:** `register(username, email, password, role)` (creates the matching profile, logs in, and sends the verification email), `login`, `logout`, `loginWithGoogle(idToken, role?)` (role only needed for first-time users), `verifyEmail(token)`, `resendVerification`
- **Profiles:** `updateStudentProfile(...)`, `updateSmeProfile(...)`
- **Tasks:** `createProject(...)` (SME), `updateProjectStatus(projectId, status)` (SME owns it, or admin), `saveTask` / `unsaveTask` (student)
- **Talent:** `saveStudent` / `unsaveStudent` (SME)
- **Office:** `reachOut(message, projectId?, studentId?)` (creates or reuses the Engagement + first message), `sendMessage(engagementId, text)`, `advanceEngagementStatus(engagementId, status, agreedPrice?)` (status `completed` routes through `approve_completion` — approval and escrow release are one atomic operation)
- **Reviews:** `submitReview(engagementId, rating, comment)`
- **Payments:** `fundEscrow(engagementId)` (SME; requires status past `reached_out`; returns `{ transaction, checkoutUrl }` — the browser redirects to the checkout and the gateway's webhook flips the transaction to HELD), `releasePayment(engagementId)` (admin backstop)
- **Vetting (admin):** `vetStudent(studentId, vetted)` and `verifySme(smeId, verified)` — see §9

---

## 7. Business Logic — Fee Calculation

Implemented in `backend/payments/services.py` (`PLATFORM_FEE_RATE = Decimal("0.02")`, `ROUND_HALF_UP` to 2 dp):

- Student-side platform fee is **always RM 0** — `calculate_student_payout(price) == price`.
- Business-side fee is **always** `round(price * 0.02, 2)` (`calculate_fee`), total charge = price + fee (`calculate_business_total`) — nothing hidden.
- Cost-breakdown copy differs by role ("Held in escrow when terms are agreed — released to you on approval" for students; "Funded into escrow… released to the student when you approve" for businesses).

Covered by tests in `backend/payments/tests.py`.

---

## 8. Engagement / Escrow State Machine

```
REACHED_OUT → AGREED → IN_PROGRESS → DELIVERED → COMPLETED
```

Enforced server-side in `backend/engagements/services.py` (`ALLOWED_TRANSITIONS`; client-submitted statuses are never trusted). Only the SME (or admin) can move `delivered → completed`, and that transition **is** the escrow release: `payments.services.approve_completion` atomically completes the engagement, flips the `Transaction` from `HELD` to `RELEASED` (guarded by `select_for_update`, releasable exactly once), and writes the student's `EARNING` ledger entry. `fund_escrow` creates the `HELD` transaction plus the business's `SPEND` and platform `FEE` entries.

---

## 9. Authentication & Vetting

- **Session auth** via GraphQL (`register`/`login`/`logout`); the `role` is chosen at signup and the matching profile row is created immediately.
- **Email verification:** `register` sends a signed link (`users/services.py`: `issue_email_verification` / `confirm_email_verification`, 3-day expiry) pointing at `/auth/verify?token=…` on the frontend. Dev uses the console email backend — the link prints to the runserver log. The Home screen shows a resend banner while `me.isVerified` is false.
- **Google Sign-In:** the frontend renders the official GIS button when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set and posts the ID token to `loginWithGoogle` (`users/services.py`: `login_with_google`, audience-checked against `GOOGLE_CLIENT_ID`). Existing users match by email; new users need the role from the auth screen's switch. Without the env vars the button stays disabled and the mutation returns "not configured". Apple login is **future work**.
- **Vetting is a manual admin workflow, not automatic** — deliberately, per the concept.
  - Services: `backend/users/services.py` — `vet_student(profile, admin_user, vetted)` (sets/clears `is_vetted`, `vetted_at`, `vetted_by`) and `verify_sme(profile, admin_user, verified)` (refuses to verify a blank `ssm_number`).
  - GraphQL: `vetStudent` / `verifySme` mutations, `IsAdmin`-gated (superusers count as admins). These exist as the integration point for a future admin UI.
  - Django admin: bulk actions on `StudentProfile` (`mark_vetted` / reverse) and `SMEProfile` (`verify_companies` / reverse), both delegating to the same services.
  - Marketplace: the `students` query accepts `vettedOnly: true`; badges ("Campus-vetted", "SSM verified") render wherever profiles appear.

---

## 10. Office (Messaging)

- Thread list + detail live in one page (`frontend/app/office/page.tsx`), split into "Tasks in progress" / "Reach outs" tabs by engagement status.
- New messages arrive via **Apollo polling** (upgrade path: Django Channels + WebSockets).
- File uploads bypass GraphQL: the browser `POST`s multipart data to `/api/upload/<engagement_id>/` (`backend/api/views.py`), which creates the `Message` + `Attachment`. For anything approaching the design's 2 GB limit, move to presigned S3/R2 uploads before production — do not proxy large files through Django.

---

## 11. Payments & Escrow — Read This Before Building It

The integration layer is built (`payments/gateway.py` + `payments/views.py`): `fundEscrow` returns a checkout URL, the user pays on the gateway's page, and the webhook (signature-verified) flips the `Transaction` from `PENDING` to `HELD` and writes the ledger rows — idempotently, with a retry path after failures. Two drivers exist: the **dev simulator** (default; a local checkout page with "simulate success/failure" buttons, exercising the exact same code path) and **Billplz** (sandbox by default; set `PAYMENT_GATEWAY=billplz` plus the `BILLPLZ_*` keys). No real money moves until Billplz keys are configured. Going live still involves two separate problems:

1. **Technical:** charging a card/FPX, holding funds, releasing on approval, refunding on dispute.
2. **Regulatory:** in Malaysia, holding client money in escrow is a regulated activity (Bank Negara Malaysia oversees money-services businesses and e-money). You generally do **not** want SkillBridge itself to custody business funds directly — sit on top of a licensed payment gateway or trust-account provider that already handles fund custody and compliance.

Practical path:
- **Next step:** obtain Billplz sandbox keys and flip `PAYMENT_GATEWAY=billplz` — the driver, webhook and ledger writes are already wired; the release step stays gated behind business approval + admin oversight.
- **Later:** move to a marketplace/split-payment product (Billplz alternatives, plus Stripe Connect outside MY) that natively holds funds per transaction and releases to a connected student payout account; add refunds/disputes on top of the existing `REFUNDED` status.
- Talk to a lawyer/licensed payment partner before advertising "escrow" publicly at scale — that's the one piece of this build that isn't just an engineering decision.

---

## 12. Wallet Screen — Data Sources

`payments.services.wallet_stats_for(user)` computes everything the screen needs, role-aware:

- **Student:** this-month earnings, lifetime earnings, active engagement count, 6-month `EARNING` series for the bar chart.
- **Business:** this-month spend, escrow currently held, fees paid this month, 6-month `SPEND` series.
- Fee banner is role-conditional ("RM 0 paid in platform fees" vs "Flat 2% is the only fee you pay — RM {x} this month", where x = sum of this month's `FEE` entries).

---

## 13. Search & Filtering

Both marketplaces are driven by GraphQL query args (see §6) mapped from the UI's chips and cycling filter buttons:

- Free-text `search` on title (tasks) / bio + username (students) — `icontains` for now; Postgres full-text is a later upgrade.
- Category/skill chips: single-select, "All" clears the filter.
- Price bands (kept from the prototype, tuned to RM): tasks `Under RM 400` / `RM 400–800` / `RM 800+`; students `Under RM 500` / `RM 500–1,000` / `RM 1,000+` — sent as `minPrice`/`maxPrice`.
- `minRating` for talent; `sort: "price"` vs newest for tasks; `vettedOnly` for the campus-vetted filter.
- Save/unsave toggles one `SavedTask`/`SavedStudent` row via mutation; saved ids come from `savedTaskIds`/`savedStudentIds`.

---

## 14. Testing

Plain Django `TestCase`, run from `backend/` with:

```bash
python manage.py test
```

- `payments/tests.py` — fee math (rounding edge cases), escrow released once and only after funding, the gateway funding lifecycle (PENDING→HELD/FAILED, idempotent webhooks, retry-after-failure), the dev-checkout view's signature gate, Billplz X-Signature math.
- `engagements/tests.py` — every disallowed transition raises; only the SME can complete.
- `projects/tests.py` — reviews and rating recomputation.
- `users/tests.py` + `api/tests.py` — vetting services, admin-gated GraphQL mutations/`vettedOnly` filter, email-verification tokens, and Google login (token verification mocked).

These five areas (fee math, transitions, escrow integrity, vetting permissions, funding lifecycle) are the rules that must never silently break.

---

## 15. Settings & Environment

Dev needs **no** environment variables — SQLite and permissive defaults kick in. `backend/core/settings.py` reads env vars when present:

```bash
# Postgres (optional — SQLite is the fallback)
POSTGRES_DB= POSTGRES_USER= POSTGRES_PASSWORD= POSTGRES_HOST= POSTGRES_PORT=

# Cross-service URLs (defaults suit local dev)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Payments (§11) — dev simulator needs nothing; Billplz sandbox needs:
PAYMENT_GATEWAY=dev            # or: billplz
BILLPLZ_API_KEY= BILLPLZ_COLLECTION_ID= BILLPLZ_XSIGNATURE_KEY=
BILLPLZ_BASE_URL=https://www.billplz-sandbox.com

# Auth (§9)
GOOGLE_CLIENT_ID=              # backend audience check
NEXT_PUBLIC_GOOGLE_CLIENT_ID=  # frontend GIS button (frontend/.env.local)
EMAIL_BACKEND=                 # default: console (dev)
DEFAULT_FROM_EMAIL=

# Future work: S3/R2 credentials (§10)
```

CORS allows `http://localhost:3000` with credentials; adjust for staging/production domains. Never commit real secrets.

---

## 16. Seed Data

```bash
python manage.py seed_demo_data
```

(`backend/projects/management/commands/seed_demo_data.py`) creates the full demo marketplace from the original prototype: 9 SMEs (Kopi Kita, Nadia's Kitchen, Batik Craft Co., …) with open tasks in Malaysian-SME voice, 9 students across UM, Sunway, UKM, Taylor's, USM, UiTM, UTAR, IIUM, MMU with bios/skills/price ranges/reviews, and sample engagement threads with messages for the Office screen. All demo accounts share the password `skillbridge-demo`; usernames are printed on completion. A couple of students are left **unvetted** (and one SME unverified) so the vetting workflow and `vettedOnly` filter are demoable.

---

## 17. Status & Roadmap

- [x] **Foundation:** custom User model, session auth, GraphQL schema, Next.js app shell
- [x] **Marketplace core:** Landing, Auth, Student Home, Task Detail, SME Home, Profile Detail, My Tasks
- [x] **Engagement flow:** Office screen, messages + attachments, server-enforced state machine
- [x] **Money (test mode):** Transaction + LedgerEntry, Wallet screen, fee math, atomic approve-and-release
- [x] **Vetting & trust:** vet/verify services + admin actions + GraphQL mutations, badges, vetted-only filter
- [x] **Payment gateway layer:** redirect+webhook funding flow, dev simulator, Billplz driver (needs keys to go live), retry-after-failure
- [x] **Auth extras:** Google Sign-In (needs client id to activate), email verification with resend banner
- [ ] **Go live on payments:** Billplz sandbox → production keys, refunds/disputes flow (§11)
- [ ] **Scale hardening:** S3/R2 presigned uploads, WebSockets chat, Postgres full-text search, Celery notifications
- [ ] **Launch prep:** production settings, HTTPS, backups, Sentry, staging for the single-campus pilot
- [ ] **Auth extras:** Apple Sign-In (paid developer account required)

---

## 18. Remaining Work (short list)

1. Go live on payments: Billplz sandbox keys → `PAYMENT_GATEWAY=billplz`, then a refunds/disputes flow (§11). The redirect+webhook layer is already built and tested.
2. Presigned uploads to object storage for large Office attachments (§10).
3. Google Cloud OAuth client id to activate the existing Google Sign-In; Apple Sign-In later (§9).
4. Admin-facing UI for vetting (the GraphQL mutations already exist; Django admin covers it today).
