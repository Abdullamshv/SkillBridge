# SkillBridge

Student-to-SME services marketplace for Malaysia. Students browse fixed-price
tasks posted by local businesses and keep **100%** of what they earn; businesses
pay a flat **2% fee** on top. Funds sit in escrow until the business approves
the delivered work.

Monorepo: **Django 6 + Strawberry GraphQL** backend, **Next.js 16 + Apollo**
frontend.

## Run it

Backend (from `backend/`):

```bash
python3.12 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data   # demo tasks, students, Office threads, wallet history
python manage.py runserver        # http://localhost:8000  (GraphQL at /graphql/)
```

Frontend (from `frontend/`):

```bash
npm install
npm run dev                       # http://localhost:3000
```

### Demo accounts

Every seeded account uses the password `skillbridge-demo`.

- Businesses: `kopi-kita`, `nadias-kitchen`, `batik-craft-co`, `green-grocer-my`, …
- Students: `aisyah-rahman`, `daniel-lim`, `nurul-izzati`, `priya-nair`, …

`kopi-kita` (business) and `aisyah-rahman` (student) have the richest demo data:
an in-progress Office thread with attachments and six months of wallet history.

## How the money flow works

```
reached_out → agreed → in_progress → delivered → completed
```

1. Either side reaches out from a task or a student profile — that opens an
   Office thread.
2. The business agrees terms (sets the price) and **funds escrow** — currently
   simulated test-mode funding (`payment_reference="TEST-MODE"`); this is the
   integration seam for a licensed Malaysian gateway (Billplz / ToyyibPay /
   CHIP).
3. The student starts, works, and marks the task delivered.
4. The business **approves** — approval and escrow release are one atomic
   operation (`payments/services.approve_completion`): the transaction flips to
   RELEASED and the student's earning is written to the ledger. Completion is
   impossible while escrow is unfunded, and release can only happen once.
5. After completion both sides can leave a review; profile ratings are
   recomputed from reviews.

All transitions are enforced server-side (`engagements/services.advance_status`);
the 2% fee math lives in one place (`payments/services.py`) and is covered by
tests (`python manage.py test`).

## Environment variables

Backend (all optional in dev):

| Variable | Default | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | insecure dev key | set a real one in production |
| `DJANGO_DEBUG` | `true` | set `false` in production |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | comma-separated |
| `POSTGRES_DB` (+`_USER`, `_PASSWORD`, `_HOST`, `_PORT`) | — (SQLite) | switch to Postgres; needs `pip install "psycopg[binary]"` |

Frontend: `NEXT_PUBLIC_GRAPHQL_URL` (default `http://localhost:8000/graphql/`).

## Known dev-mode limits & production upgrade paths

- **Payments** are simulated. Production needs a licensed Malaysian payment
  gateway integrated at `payments/services.fund_escrow` — and note that holding
  client money is a regulated activity in Malaysia (Bank Negara oversight);
  choose a gateway that custodies funds so SkillBridge never touches them
  directly.
- **Chat file uploads** go through `POST /api/upload/<engagement_id>/` with a
  50 MB cap and land on local disk (`backend/media/`). The product spec allows
  up to 2 GB per file — that requires presigned S3/R2 uploads direct from the
  browser (django-storages), not a bigger cap on this endpoint.
- **Chat updates** poll every 4 s. Upgrade path: Django Channels + WebSockets.
- **Auth** is username/password sessions. Google/Apple OAuth needs provider
  credentials (django-allauth is the intended route).
- **Vetting** ("campus-vetted" badge) is deliberately a manual Django-admin
  action (`StudentProfileAdmin → Mark selected students as campus-vetted`) —
  same for SSM verification of businesses. That's product policy, not a
  missing feature.
