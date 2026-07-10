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
        payload = signing.loads(token, salt=EMAIL_VERIFY_SALT, max_age=EMAIL_VERIFY_MAX_AGE)
    except signing.SignatureExpired as exc:
        raise ValueError("This verification link has expired — request a new one") from exc
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
            id_token_value, google_requests.Request(), settings.GOOGLE_CLIENT_ID
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
        raise ValueError("Choose a role (student or business) to finish signing up")
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
