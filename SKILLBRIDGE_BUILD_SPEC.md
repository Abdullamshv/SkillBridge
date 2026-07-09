# SkillBridge — Django Build Specification

> Student‑to‑SME services marketplace for Malaysia.
> This document is the engineering build spec derived from the product concept (`SkillBridge_Concept.pdf`) and the interactive HTML prototype (`SkillBridge_Screens.html`). Open this file in VSCode and follow it top to bottom — it's written as an actual build plan, not just a description.

---

## 0. Product Summary (from the concept)

SkillBridge connects Malaysian university students with local SMEs that need affordable digital work: graphic design, content writing, social media, web development, and data tasks.

- **Wedge:** one campus talent pool serving nearby SMEs.
- **Revenue model:** flat **2% fee charged to the business only**, on top of the task price. Students keep **100%** of what they earn.
- **Moat:** vetting data on each student + deepening SME relationships → recurring managed marketplace, not a one‑off gig board.
- **Scale path:** Campus → Klang Valley → national → SEA.
- **Trust mechanics baked into the design:** escrow-style payment holding (released only on approval), "campus‑vetted" student badges, "SSM verified" business badges.

Everything below is designed to make that model real, not just visual.

---

## 1. Assumptions & Architecture Decisions

The prototype is a single self‑contained HTML file with 8 client‑side "screens" toggled by state (no real backend, no persistence). To turn this into a real, working product I'm making the following default calls — flag anything you want changed before we dive in further:

| Decision | Choice | Why |
|---|---|---|
| Backend framework | **Django 5.x** (as requested) | Batteries-included: auth, ORM, admin, forms all needed here |
| Rendering approach | **Server-rendered Django templates** + **HTMX** for the interactive bits (filter chips, search, chat, save/unsave) | The prototype's interactivity (filters, tabs, chat) is simple state toggling — HTMX gives you that without standing up a separate SPA/build pipeline. Matches "actually working" fastest. |
| Database | **PostgreSQL** | Needed for real concurrency, JSON fields for flexible tag/skill lists, full-text search later |
| Auth | Django's built-in auth + **custom User model** (role field) + **django-allauth** for Google/Apple social login (prototype shows both buttons) | Avoids retrofitting a custom user model later — must be set up before first migration |
| File storage | Local disk for dev → **django-storages + S3-compatible bucket** (e.g. AWS S3 / Cloudflare R2 / Backblaze B2) for production | Prototype explicitly allows uploads up to 2GB per file — this must not touch Django's default in-memory/temp handling in production |
| Real-time chat | **Polling via HTMX (every 3–5s)** for MVP, upgrade path to **Django Channels + WebSockets** later | Keeps MVP infra simple (no Redis/ASGI needed on day one) |
| Payments / escrow | **Placeholder ledger model + manual admin release for MVP**, integration point left open for a licensed Malaysian payment gateway (Billplz, ToyyibPay, CHIP, or Stripe) | See §11 — this is a regulatory matter as much as a technical one, don't skip that section |
| Background jobs | Skip for MVP; add **Celery + Redis** when you need async email/notifications/payout batching | Not needed for the 8 screens themselves |

If you'd rather go **Django REST Framework + separate frontend (React/Vue)** instead of server-rendered templates (e.g. because you want a native mobile app soon), everything in §5–§9 (models, business logic, state machine) stays identical — only §6 (views/templates) and §10 (chat) change shape. Flag it and I'll re-cut those two sections.

---

## 2. Screens Inventory (what you're building)

Extracted directly from the prototype. Each maps to one Django template/view below.

| # | Screen | Purpose | Key dynamic content |
|---|---|---|---|
| 01 | **Landing** | Public marketing page | Hero, stats (100% / 2% / 5 verticals), student vs business value panels, closing CTA |
| 02 | **Auth** | Sign up / sign in, role-aware | Google/Apple OAuth buttons, email+password, role switch (student ⇄ business), signup-only email verification hint |
| 03 | **Student Home** | Task marketplace (student view) | Search, category chips, price/deadline filters, sort (Newest / Highest pay), save/unsave, task cards |
| 04 | **Task Detail** | Full task brief | Description, "who they're looking for" bullets, required skills, timeline/milestones, cost breakdown (fee = RM 0 for students), SME info + rating, "Message SME" CTA |
| 05 | **SME Home** | Talent marketplace (business view) | Search, skill chips, rating/price filters, student cards with save/unsave |
| 06 | **Student Profile Detail** | Full student profile | Bio, all skills, reviews from businesses, quick facts (uni, year, tasks completed, response time, languages), cost breakdown (task price + 2% fee), "Message student" CTA |
| 07 | **Office** | Messaging hub | Two tabs: "Tasks in progress" / "Reach outs", thread list, 5-step progress tracker (Reached out → Agreed → In progress → Delivered → Completed), chat thread with file drag‑and‑drop (up to 2GB) |
| 08 | **Wallet** | Earnings/spend dashboard, role-aware | Stat cards (role-dependent), fee banner, month-over-month bar chart |

---

## 3. Getting Started

```bash
# 1. Create project folder & virtual environment
mkdir skillbridge && cd skillbridge
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install core dependencies
pip install django psycopg2-binary python-decouple pillow \
            django-allauth django-htmx django-storages boto3 \
            django-widget-tweaks

# 3. Start the project and apps
django-admin startproject config .
python manage.py startapp accounts
python manage.py startapp tasks
python manage.py startapp office        # messaging
python manage.py startapp wallet
python manage.py startapp core          # shared/base templates, home, landing

# 4. Freeze requirements
pip freeze > requirements.txt
```

Open the folder in VSCode: `code .` — recommend the **Python**, **Django**, and **Pylance** extensions.

---

## 4. Project Structure

```
skillbridge/
├── config/                    # Django project settings
│   ├── settings/
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py
│   └── asgi.py / wsgi.py
├── accounts/                   # custom user, student/business profiles, vetting
│   ├── models.py
│   ├── views.py
│   ├── forms.py
│   ├── adapters.py            # allauth custom adapter (role-aware signup)
│   └── urls.py
├── tasks/                      # task marketplace (student home, task detail, SME home, profile detail)
│   ├── models.py
│   ├── views.py
│   ├── filters.py              # search/filter query logic
│   └── urls.py
├── office/                      # messaging: threads, messages, attachments
│   ├── models.py
│   ├── views.py
│   └── urls.py
├── wallet/                      # ledger, escrow, payouts, wallet dashboard
│   ├── models.py
│   ├── services.py             # fee calc, escrow state transitions
│   ├── views.py
│   └── urls.py
├── core/                        # landing page, base template, shared components
│   ├── views.py
│   └── templates/core/base.html
├── templates/
│   ├── core/landing.html
│   ├── accounts/auth.html
│   ├── tasks/student_home.html
│   ├── tasks/task_detail.html
│   ├── tasks/sme_home.html
│   ├── tasks/profile_detail.html
│   ├── office/office.html
│   ├── wallet/wallet.html
│   └── components/             # navbar, task_card.html, student_card.html, chip.html, etc.
├── static/
│   ├── css/
│   └── js/
├── media/                       # user uploads (dev only — S3 in prod)
├── fixtures/                    # seed data (see §16)
├── manage.py
└── requirements.txt
```

Registering the custom user model **must** happen before your first `makemigrations` — see §5.1.

---

## 5. Data Models

### 5.1 `accounts` app — Users, Profiles, Vetting

```python
# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        SME = "sme", "Business / SME"

    role = models.CharField(max_length=10, choices=Role.choices)
    email_verified = models.BooleanField(default=False)


class University(models.Model):
    name = models.CharField(max_length=150)
    short_name = models.CharField(max_length=20)  # "UM", "Sunway", "UKM"...

    def __str__(self):
        return self.name


class Skill(models.Model):
    name = models.CharField(max_length=80, unique=True)
    category = models.CharField(max_length=40)  # Design/Writing/Social Media/Web/Data/Video

    def __str__(self):
        return self.name


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    university = models.ForeignKey(University, on_delete=models.PROTECT)
    course = models.CharField(max_length=120)
    year_of_study = models.PositiveSmallIntegerField()
    bio = models.TextField()
    skills = models.ManyToManyField(Skill, related_name="students")
    price_low = models.DecimalField(max_digits=8, decimal_places=2)
    price_high = models.DecimalField(max_digits=8, decimal_places=2)
    languages = models.CharField(max_length=120, blank=True)  # "BM · EN"
    avatar_color = models.CharField(max_length=80, default="linear-gradient(135deg,#4E3FE3,#7B62F2)")

    # vetting — this is the moat
    is_vetted = models.BooleanField(default=False)
    vetted_at = models.DateTimeField(null=True, blank=True)
    vetted_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    AVAILABILITY_NOW = "now"
    AVAILABILITY_FROM = "from"
    availability_status = models.CharField(max_length=10, default=AVAILABILITY_NOW)
    available_from = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class BusinessProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="business_profile")
    company_name = models.CharField(max_length=150)
    location = models.CharField(max_length=100)   # "Kuala Lumpur", "Shah Alam"...
    about = models.TextField()
    logo_color = models.CharField(max_length=80, default="linear-gradient(135deg,#4E3FE3,#7B62F2)")

    # SSM = Suruhanjaya Syarikat Malaysia (Companies Commission of Malaysia)
    ssm_number = models.CharField(max_length=30, blank=True)
    ssm_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.company_name


class Review(models.Model):
    """Business → Student review, shown on the profile detail screen."""
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="reviews")
    business = models.ForeignKey(BusinessProfile, on_delete=models.CASCADE, related_name="reviews_given")
    task = models.ForeignKey("tasks.Task", on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1)  # e.g. 4.9
    quote = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

**Custom user setup — do this now, before any migration:**
```python
# config/settings/base.py
AUTH_USER_MODEL = "accounts.User"

INSTALLED_APPS = [
    ...,
    "django.contrib.sites",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.apple",
    "django_htmx",
    "widget_tweaks",
    "accounts", "tasks", "office", "wallet", "core",
]
SITE_ID = 1
```

### 5.2 `tasks` app — Marketplace

```python
# tasks/models.py
from django.db import models
from accounts.models import BusinessProfile, Skill

class Task(models.Model):
    class Category(models.TextChoices):
        GRAPHIC_DESIGN = "graphic_design", "Graphic Design"
        CONTENT_WRITING = "content_writing", "Content Writing"
        SOCIAL_MEDIA = "social_media", "Social Media"
        WEB_DEV = "web_dev", "Web Dev"
        DATA = "data", "Data"

    business = models.ForeignKey(BusinessProfile, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=Category.choices)
    price = models.DecimalField(max_digits=9, decimal_places=2)   # fixed price, paid to student
    deadline_days = models.PositiveSmallIntegerField()
    description = models.TextField()
    description_extra = models.TextField(blank=True)
    required_skills = models.ManyToManyField(Skill, related_name="tasks")
    looking_for_bullets = models.JSONField(default=list)  # list[str]

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class TaskMilestone(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="milestones")
    label = models.CharField(max_length=120)
    note = models.CharField(max_length=200, blank=True)
    due_date = models.DateField()
    order = models.PositiveSmallIntegerField(default=0)


class SavedTask(models.Model):
    student = models.ForeignKey("accounts.StudentProfile", on_delete=models.CASCADE, related_name="saved_tasks")
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ("student", "task")


class SavedStudent(models.Model):
    business = models.ForeignKey(BusinessProfile, on_delete=models.CASCADE, related_name="saved_students")
    student = models.ForeignKey("accounts.StudentProfile", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ("business", "student")
```

### 5.3 `office` app — Messaging / Engagement lifecycle

This is the core of the trust layer — the "Office" screen and the escrow state machine both hang off `Engagement`.

```python
# office/models.py
from django.db import models
from accounts.models import User

class Engagement(models.Model):
    """One thread = one working relationship between a business and a student,
    optionally tied to a specific Task."""
    class Status(models.TextChoices):
        REACHED_OUT = "reached_out", "Reached out"
        AGREED = "agreed", "Agreed"
        IN_PROGRESS = "in_progress", "In progress"
        DELIVERED = "delivered", "Delivered"
        COMPLETED = "completed", "Completed"

    task = models.ForeignKey("tasks.Task", on_delete=models.SET_NULL, null=True, blank=True)
    business = models.ForeignKey("accounts.BusinessProfile", on_delete=models.CASCADE, related_name="engagements")
    student = models.ForeignKey("accounts.StudentProfile", on_delete=models.CASCADE, related_name="engagements")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REACHED_OUT)
    agreed_price = models.DecimalField(max_digits=9, decimal_places=2, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Message(models.Model):
    engagement = models.ForeignKey(Engagement, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Attachment(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="engagement_files/%Y/%m/")
    original_name = models.CharField(max_length=255)
    size_bytes = models.BigIntegerField()
```

**The 5-step progress tracker in the prototype maps directly to `Engagement.Status`.** Don't build a separate status enum for the UI — drive the tracker straight off this field so it can never drift out of sync with the actual escrow state (see §8).

### 5.4 `wallet` app — Ledger, Escrow, Payouts

```python
# wallet/models.py
from django.db import models
from accounts.models import User

class EscrowHold(models.Model):
    """Money conceptually 'in escrow' for one Engagement. Real custody of
    funds happens at the payment gateway (see §11) — this model tracks state,
    not actual bank balances."""
    class Status(models.TextChoices):
        PENDING = "pending", "Awaiting funding"
        FUNDED = "funded", "Funded / held"
        RELEASED = "released", "Released to student"
        REFUNDED = "refunded", "Refunded to business"

    engagement = models.OneToOneField("office.Engagement", on_delete=models.CASCADE, related_name="escrow")
    task_price = models.DecimalField(max_digits=9, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=9, decimal_places=2)   # 2% of task_price, business side
    total_charged_to_business = models.DecimalField(max_digits=9, decimal_places=2)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    gateway_reference = models.CharField(max_length=120, blank=True)  # payment gateway's transaction id
    funded_at = models.DateTimeField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)


class LedgerEntry(models.Model):
    """Append-only record backing the Wallet screen's stats and month-over-month chart."""
    class Kind(models.TextChoices):
        EARNING = "earning", "Student earning"          # positive, student side
        SPEND = "spend", "Business spend"                # positive, business side (price + fee)
        FEE = "fee", "Platform fee"                        # platform revenue record

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ledger_entries")
    engagement = models.ForeignKey("office.Engagement", on_delete=models.SET_NULL, null=True, blank=True)
    kind = models.CharField(max_length=10, choices=Kind.choices)
    amount = models.DecimalField(max_digits=9, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 6. URLs & Views (per screen)

```python
# config/urls.py
urlpatterns = [
    path("", include("core.urls")),          # "/"                → landing
    path("auth/", include("accounts.urls")), # "/auth/signup/"     → auth (signup mode)
                                              # "/auth/signin/"     → auth (signin mode)
    path("home/", include("tasks.urls")),    # "/home/"            → student_home (role=student)
                                              # "/home/tasks/<id>/" → task_detail
                                              # "/home/talent/"     → sme_home (role=sme)
                                              # "/home/talent/<id>/"→ profile_detail
    path("office/", include("office.urls")), # "/office/"          → office
    path("wallet/", include("wallet.urls")), # "/wallet/"          → wallet
]
```

Route the **student vs business** version of `/home/` off `request.user.role` inside one view (mirrors the prototype's single `isStudentHome` / `isSmeHome` toggle) rather than duplicating URLs:

```python
# tasks/views.py
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import Task
from accounts.models import StudentProfile

@login_required
def home(request):
    if request.user.role == "student":
        return student_home(request)
    return sme_home(request)

def student_home(request):
    qs = Task.objects.filter(is_active=True)
    q = request.GET.get("q", "")
    cat = request.GET.get("cat", "All")
    price_f = request.GET.get("price", "0")
    sort = request.GET.get("sort", "new")

    if q:
        qs = qs.filter(title__icontains=q)  # upgrade to Postgres full-text search later
    if cat != "All":
        qs = qs.filter(category=cat)
    if price_f == "1":
        qs = qs.filter(price__lt=400)
    elif price_f == "2":
        qs = qs.filter(price__gte=400, price__lte=800)
    elif price_f == "3":
        qs = qs.filter(price__gt=800)

    qs = qs.order_by("-created_at") if sort == "new" else qs.order_by("-price")

    saved_ids = set(
        request.user.student_profile.saved_tasks.values_list("task_id", flat=True)
    )
    return render(request, "tasks/student_home.html", {
        "tasks": qs, "saved_ids": saved_ids, "q": q, "cat": cat,
    })
```

Each filter control (chips, price cycle button, sort toggle) becomes an **HTMX-powered GET request** that swaps just the task grid `<div>` — no full page reload, no JS framework needed, and it maps 1:1 onto the prototype's `setState` calls:

```html
<!-- templates/tasks/student_home.html (excerpt) -->
<div hx-get="{% url 'tasks:home' %}" hx-trigger="change" hx-target="#task-grid" hx-push-url="true">
  <input type="text" name="q" placeholder="Search tasks, skills, or businesses…" value="{{ q }}">
</div>
<div id="task-grid" hx-swap-oob="true">
  {% include "components/task_grid.html" %}
</div>
```

Repeat the same GET-param-driven-filter + HTMX-swap pattern for `sme_home` (skill/rating/price filters).

---

## 7. Business Logic — Fee Calculation

Pulled directly from the prototype's `renderVals()`:

```python
# wallet/services.py
from decimal import Decimal, ROUND_HALF_UP

PLATFORM_FEE_RATE = Decimal("0.02")  # flat 2%, business side only

def calculate_fee(task_price: Decimal) -> Decimal:
    return (task_price * PLATFORM_FEE_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def calculate_business_total(task_price: Decimal) -> Decimal:
    return task_price + calculate_fee(task_price)

def calculate_student_payout(task_price: Decimal) -> Decimal:
    return task_price  # students keep 100%, always
```

Rules to encode as tests (see §14), taken straight from the copy in the prototype:
- Student-side platform fee is **always RM 0**.
- Business-side fee is **always** `round(price * 0.02, 2)`, "nothing hidden" — never a hidden markup on top.
- Cost breakdown note differs by role ("Held in escrow when terms are agreed — released to you on approval" for students; "Funded into escrow... released to the student when you approve" for businesses).

---

## 8. Engagement / Escrow State Machine

```
REACHED_OUT → AGREED → IN_PROGRESS → DELIVERED → COMPLETED
```

| Transition | Triggered by | Side effect |
|---|---|---|
| `REACHED_OUT → AGREED` | Business confirms price/scope in chat | Create `EscrowHold` (status `PENDING`), prompt business to fund it |
| — funding — | Business completes payment via gateway | `EscrowHold.status = FUNDED`, `funded_at` set |
| `AGREED → IN_PROGRESS` | Student marks work started (or auto on funding) | none |
| `IN_PROGRESS → DELIVERED` | Student marks deliverable submitted | Notify business |
| `DELIVERED → COMPLETED` | **Business explicitly approves** | `EscrowHold.status = RELEASED`, `released_at` set, create `LedgerEntry` (EARNING for student, SPEND/FEE already recorded at funding) |

Enforce transitions server-side (never trust a client-submitted status):

```python
# office/services.py
ALLOWED_TRANSITIONS = {
    "reached_out": {"agreed"},
    "agreed": {"in_progress"},
    "in_progress": {"delivered"},
    "delivered": {"completed"},
}

def advance_status(engagement, new_status, actor):
    if new_status not in ALLOWED_TRANSITIONS.get(engagement.status, set()):
        raise ValueError(f"Cannot move from {engagement.status} to {new_status}")
    if new_status == "completed" and actor.role != "sme":
        raise PermissionError("Only the business can approve completion")
    engagement.status = new_status
    engagement.save()
```

---

## 9. Authentication & Vetting

- Custom `User.role` set at signup (student vs business) — matches the prototype's `authSwitchRole`.
- **django-allauth** for Google + Apple buttons already in the design (`accounts/adapters.py`: on social signup, redirect to a "which are you?" role-picker before creating the profile, since Google/Apple don't know the role).
- Email verification hint shown on signup (`verifyHint` in the prototype) → wire up allauth's mandatory email verification flow.
- **Vetting is a manual admin workflow, not automatic** — this is explicitly the product's moat per the concept doc. Build a Django Admin action:

```python
# accounts/admin.py
@admin.action(description="Mark selected students as campus-vetted")
def mark_vetted(modeladmin, request, queryset):
    from django.utils import timezone
    queryset.update(is_vetted=True, vetted_at=timezone.now(), vetted_by=request.user)

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "university", "is_vetted", "price_low", "price_high")
    list_filter = ("is_vetted", "university")
    actions = [mark_vetted]
```

Same pattern for `BusinessProfile.ssm_verified` (the "SSM verified" badge shown on Task Detail).

---

## 10. Office (Messaging)

- `GET /office/` — thread list (`Engagement.objects.filter(Q(business=... ) | Q(student=...))`, split into the two tabs by `status` (progress vs reach‑out group)).
- `GET /office/<engagement_id>/` — thread detail, HTMX-polled every 3–5s for new messages (`hx-trigger="every 4s"`).
- `POST /office/<engagement_id>/send/` — create `Message`, handle optional `Attachment`.
- File uploads: set `DATA_UPLOAD_MAX_MEMORY_SIZE` and `FILE_UPLOAD_MAX_MEMORY_SIZE` appropriately, but **for anything approaching the prototype's stated 2GB limit, don't route large files through Django's request body at all** — use presigned S3/R2 upload URLs from the browser directly to storage, then just save the resulting key/URL via a small confirmation POST. Trying to proxy multi-GB files through a Django view will fall over under real traffic.

---

## 11. Payments & Escrow — Read This Before Building It

The prototype's "escrow" is currently just copy on a screen. Making it real involves two separate problems:

1. **Technical:** charging a card/FPX, holding funds, releasing on approval, refunding on dispute.
2. **Regulatory:** in Malaysia, holding client money in escrow is a regulated activity (Bank Negara Malaysia oversees money-services businesses and e-money). You generally do **not** want SkillBridge itself to custody business funds directly — you want to sit on top of a licensed payment gateway or trust-account provider that already handles fund custody and compliance.

Practical path:
- **MVP:** collect payment via a gateway (Billplz, ToyyibPay, or CHIP all support Malaysian FPX/cards and have simple REST APIs) into the gateway's own held balance, record everything in `EscrowHold`/`LedgerEntry` locally, and gate the *release* step behind manual business approval + admin oversight. No real "split payment" logic needed yet — just don't auto-payout until approved.
- **Later:** move to a marketplace/split-payment product (several of the above gateways, plus Stripe Connect if you expand outside MY) that natively supports holding funds per transaction and releasing to a connected student payout account — this removes SkillBridge from directly touching the money.
- Talk to a lawyer/licensed payment partner before advertising "escrow" publicly at scale — that's outside what code alone can solve, and it's the one piece of this build that isn't just an engineering decision.

---

## 12. Wallet Screen — Data Sources

- **Student view:** `LedgerEntry` filtered `kind=EARNING`, grouped by month for the bar chart, `wStats` cards = this month's total, lifetime total, active engagements count.
- **Business view:** `LedgerEntry` filtered `kind=SPEND`/`FEE`, same shape.
- Fee banner text is role-conditional (`RM 0 paid in platform fees` vs `Flat 2% is the only fee you pay — RM {x} this month`) — compute `x` as `sum(FEE entries this month)`.

---

## 13. Search & Filtering — Implementation Notes

Both marketplaces (Student Home's task search, SME Home's talent search) use the same pattern:
- Free-text search on `title`/`bio` (start with `icontains`, upgrade to Postgres `SearchVector` once you have real volume).
- Category/skill chips: single-select, `All` clears the filter — model as a `?cat=` query param, default `All`.
- Cycling filter buttons (price, rating, deadline) step through a fixed list of options on each click, exactly like `PRICE_OPTS`/`RATE_OPTS` in the prototype — keep those exact option lists, they're already tuned to the RM price bands (`Under RM 400` / `RM 400–800` / `RM 800+` for tasks; `Under RM 500` / `RM 500–1,000` / `RM 1,000+` for students).
- Save/unsave (bookmark icon) — one `SavedTask`/`SavedStudent` row, toggled via a small HTMX `POST` that swaps just the icon's `fill`/`stroke`.

---

## 14. Testing Strategy

Priority order — these are the rules that must never silently break:

1. **Fee math** (`wallet/services.py`) — parametrize over prices including edge cases (RM 0.005 rounding, very large prices).
2. **Status transitions** (`office/services.py`) — assert every disallowed transition raises, assert only a business actor can mark `completed`.
3. **Escrow integrity** — an `EscrowHold` can only move to `RELEASED` once, and only after `FUNDED`.
4. **Filter/search views** — snapshot a fixed fixture set (see §16) and assert each chip/price-band filter returns the expected subset.
5. Standard Django `TestCase` + `pytest-django` recommended.

---

## 15. Settings & Environment Variables

```bash
# .env
DEBUG=True
SECRET_KEY=change-me
DATABASE_URL=postgres://user:pass@localhost:5432/skillbridge
ALLOWED_HOSTS=localhost,127.0.0.1

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=

# Storage (prod)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=

# Payment gateway (see §11)
PAYMENT_GATEWAY_API_KEY=
PAYMENT_GATEWAY_SECRET=
```

Use `python-decouple` or `django-environ` to load these into `settings/base.py` — never commit `.env`.

---

## 16. Seed Data

The prototype ships with a full, usable mock dataset — reuse it as Django **fixtures** so your dev environment looks exactly like the design from day one instead of an empty marketplace:

- **Categories (tasks):** All, Graphic Design, Content Writing, Social Media, Web Dev, Data
- **Skill categories (students):** All, Design, Writing, Social Media, Web, Data, Video
- 9 sample tasks (Kopi Kita, Nadia's Kitchen, Batik Craft Co., Urban Fit Studio, Green Grocer MY, Selangor Dental Care, TechNest Solutions, Lestari Farms, Kayu & Co.) with full descriptions, bullets, skills, and timelines already written in Malaysian-SME voice.
- 9 sample students across UM, Sunway, UKM, Taylor's, USM, UiTM, UTAR, IIUM, MMU — with bios, skill lists, price ranges, and realistic business reviews.
- Sample engagement threads with real conversational messages, useful for testing the Office screen and progress tracker without writing chat content by hand.

Recommended: write a `management/commands/seed_demo_data.py` in `core/` that creates all of the above via the ORM (rather than a raw fixtures JSON dump) so it's easy to tweak. Ask me if you want this generated as an actual script — the exact copy is in `SkillBridge_Screens.html`'s embedded data.

---

## 17. Build Roadmap

- [ ] **Phase 0 — Foundation:** project scaffold, custom User model, Postgres, base template, allauth wired up
- [ ] **Phase 1 — Marketplace core:** Landing, Auth, Student Home, Task Detail, SME Home, Profile Detail (read-only, seeded data, no messaging/payments yet)
- [ ] **Phase 2 — Engagement flow:** Office screen, Engagement + Message + Attachment models, status transitions, "Message SME/student" CTA wiring
- [ ] **Phase 3 — Money:** EscrowHold + LedgerEntry models, Wallet screen, manual-approval fund release, first payment gateway integration (test mode)
- [ ] **Phase 4 — Vetting & trust:** admin vetting workflow, SSM verification workflow, review submission after `COMPLETED`
- [ ] **Phase 5 — Hardening:** S3 file storage + presigned uploads, real-time chat upgrade (Channels), search upgrade (Postgres full-text), Celery for notifications
- [ ] **Phase 6 — Launch prep:** production settings, HTTPS, backups, error monitoring (Sentry), staging environment on your single-campus pilot

---

## 18. Next Steps

1. Confirm the architecture assumptions in §1 (server-rendered + HTMX vs DRF + separate frontend) — everything downstream depends on this.
2. Run the commands in §3, wire up the custom `User` model **before** your first migration (cannot be changed after).
3. Build Phase 1 first and get the 4 read-only marketplace screens rendering off seeded data — that alone gives you something demoable on campus.
4. Come back for the `seed_demo_data.py` script and/or the full HTMX template set for any screen once you're ready to fill them in — I have the exact copy, colors, and layout extracted from the prototype and can turn any of these sections into working templates next.
