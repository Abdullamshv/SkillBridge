from django.utils import timezone

from .models import SMEProfile, StudentProfile


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
