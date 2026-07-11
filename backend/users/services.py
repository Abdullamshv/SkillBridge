import re

from django.conf import settings
from django.core import signing
from django.core.mail import send_mail
from django.utils import timezone

from .models import SMEProfile, StudentProfile, User

EMAIL_VERIFY_SALT = "users.email-verify"
EMAIL_VERIFY_MAX_AGE = 3 * 24 * 3600  # 3 days


def vet_student(profile: StudentProfile, admin_user, vetted: bool = True) -> StudentProfile:
    """Manual campus-vetting — the product's moat, so it is always an explicit
    admin decision, never automatic. Un-vetting clears the whole audit trail."""
    if vetted:
        profile.is_vetted = True
        profile.vetted_at = timezone.now()
        profile.vetted_by = admin_user
    else:
        profile.is_vetted = False
        profile.vetted_at = None
        profile.vetted_by = None
    profile.save(update_fields=["is_vetted", "vetted_at", "vetted_by"])
    return profile


def verify_sme(profile: SMEProfile, admin_user, verified: bool = True) -> SMEProfile:
    """SSM verification (Companies Commission of Malaysia). The badge means an
    admin checked the registration number, so there must be one to check."""
    if verified and not profile.ssm_number:
        raise ValueError("Cannot verify a company without an SSM number")
    profile.is_verified = verified
    profile.save(update_fields=["is_verified"])
    return profile


# ── Email verification ────────────────────────────────────────────────────


def issue_email_verification(user) -> None:
    """Send (or resend) the signed verification link. Console email backend in
    dev — the link prints to the runserver log."""
    if not user.email:
        return
    token = signing.dumps({"uid": user.pk}, salt=EMAIL_VERIFY_SALT)
    link = f"{settings.FRONTEND_URL}/auth/verify?token={token}"
    send_mail(
        subject="Confirm your SkillBridge email",
        message=(
            f"Hi {user.username},\n\n"
            f"Confirm your email to activate your SkillBridge account:\n\n{link}\n\n"
            f"The link is valid for 3 days. If you didn't sign up, ignore this email."
        ),
        from_email=None,  # DEFAULT_FROM_EMAIL
        recipient_list=[user.email],
    )


def confirm_email_verification(token: str):
    """Verify the signed token and mark the user's email as confirmed."""
    try:
        payload = signing.loads(
            token, salt=EMAIL_VERIFY_SALT, max_age=EMAIL_VERIFY_MAX_AGE)
    except signing.SignatureExpired as exc:
        raise ValueError(
            "This verification link has expired — request a new one") from exc
    except signing.BadSignature as exc:
        raise ValueError("Invalid verification link") from exc
    user = User.objects.get(pk=payload["uid"])
    if not user.is_verified:
        user.is_verified = True
        user.save(update_fields=["is_verified"])
    return user


# ── Google Sign-In ────────────────────────────────────────────────────────


def _verify_google_token(id_token_value: str) -> dict:
    """Validate a Google Identity Services ID token; returns its claims.
    Separate function so tests can mock it without network access."""
    if not settings.GOOGLE_CLIENT_ID:
        raise ValueError("Google login is not configured on this server")
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token as google_id_token

    try:
        return google_id_token.verify_oauth2_token(
            id_token_value, google_requests.Request(), settings.GOOGLE_CLIENT_ID, clock_skew_in_seconds=10
        )
    except Exception as exc:
        raise ValueError("Google sign-in failed — invalid token") from exc


def _unique_username(base: str) -> str:
    candidate = base[:140] or "user"
    suffix = 1
    while User.objects.filter(username=candidate).exists():
        suffix += 1
        candidate = f"{base[:140]}{suffix}"
    return candidate


def login_with_google(id_token_value: str, role: str | None = None):
    """Find-or-create a user from a verified Google ID token. New accounts
    need a role (the auth screen's student/business switch supplies it)."""
    claims = _verify_google_token(id_token_value)
    email = claims.get("email", "")
    if not email or not claims.get("email_verified", False):
        raise ValueError("Google account has no verified email")

    user = User.objects.filter(email__iexact=email).first()
    if user:
        return user

    if role not in ("student", "sme"):
        raise ValueError(
            "Choose a role (student or business) to finish signing up")
    user = User.objects.create_user(
        username=_unique_username(email.split("@")[0]),
        email=email,
        role=role,
        is_verified=True,  # Google already verified the address
    )
    user.set_unusable_password()
    user.save(update_fields=["password"])
    if role == "student":
        StudentProfile.objects.create(user=user)
    else:
        SMEProfile.objects.create(user=user)
    return user


# ── Resume parsing (profile autofill) ─────────────────────────────────────

# Heuristic keyword catalogs — no external APIs, good enough to pre-fill a
# form the student then reviews before saving.
_SKILL_KEYWORDS = [
    "Figma", "Photoshop", "Illustrator", "Canva", "UI/UX", "Branding",
    "Copywriting", "Content Writing", "Proofreading", "Translation",
    "Social Media", "Instagram", "TikTok", "Facebook Ads", "Google Ads", "SEO",
    "React", "Next.js", "Vue", "JavaScript", "TypeScript", "Python", "Django",
    "Node.js", "HTML", "CSS", "Tailwind", "WordPress", "Shopify",
    "SQL", "Excel", "Power BI", "Tableau", "Data Analysis", "Machine Learning",
    "Video Editing", "Premiere Pro", "After Effects", "CapCut", "Animation",
]

_LANGUAGE_MAP = [
    (("english",), "EN"),
    (("malay", "bahasa melayu", "bahasa malaysia"), "BM"),
    (("mandarin", "chinese", "中文"), "中文"),
    (("tamil", "தமிழ்"), "தமிழ்"),
    (("arabic", "العربية"), "العربية"),
]

# Capitalised words only around the keyword, so prose like "student at ..."
# doesn't leak into the captured name.
_UNIVERSITY_RE = re.compile(
    r"\b((?:[A-Z][\w'&.\-]*\s+){0,4}(?:University|Universiti|College)(?:\s+(?:of|[A-Z][\w'&.\-]*)){0,3})"
)
_YEAR_RE = re.compile(r"\b(20[2-4]\d)\b")
_LINKEDIN_RE = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-%.]+", re.IGNORECASE)
_URL_RE = re.compile(r"https?://[^\s<>\"')]+", re.IGNORECASE)


def parse_resume_text(text: str) -> dict:
    """Extract profile-field suggestions from raw resume text. Every value is
    best-effort; the frontend only fills fields the student left empty."""
    suggestions: dict = {}

    m = _UNIVERSITY_RE.search(text)
    if m:
        suggestions["university"] = m.group(1).strip()

    years = [int(y) for y in _YEAR_RE.findall(text)]
    if years:
        suggestions["graduation_year"] = max(years)

    lowered = text.lower()
    skills = [s for s in _SKILL_KEYWORDS if s.lower() in lowered]
    if skills:
        suggestions["skills"] = skills[:10]

    langs = [code for keywords, code in _LANGUAGE_MAP if any(k in lowered for k in keywords)]
    if langs:
        suggestions["languages"] = " · ".join(langs)

    m = _LINKEDIN_RE.search(text)
    if m:
        url = m.group(0)
        if not url.startswith("http"):
            url = f"https://{url}"
        suggestions["linkedin_url"] = url

    for url in _URL_RE.findall(text):
        if "linkedin.com" not in url.lower():
            suggestions["portfolio_url"] = url.rstrip(".,;")
            break

    # Bio: first prose paragraph (skip short header lines like name/contacts)
    for para in (p.strip() for p in text.split("\n\n")):
        line = " ".join(para.split())
        if len(line) >= 80 and not _URL_RE.search(line):
            suggestions["bio"] = line[:600]
            break

    return suggestions
