from .models import Engagement

ALLOWED_TRANSITIONS = {
    Engagement.Status.REACHED_OUT: {Engagement.Status.AGREED},
    Engagement.Status.AGREED:      {Engagement.Status.IN_PROGRESS},
    Engagement.Status.IN_PROGRESS: {Engagement.Status.DELIVERED},
    Engagement.Status.DELIVERED:   {Engagement.Status.COMPLETED},
}


def advance_status(engagement: Engagement, new_status: str, actor) -> Engagement:
    """Server-side-enforced status transition — never trust a client-submitted
    status directly. Only the SME can mark an engagement completed (that's what
    releases escrow — see payments/services.py)."""
    allowed = ALLOWED_TRANSITIONS.get(engagement.status, set())
    if new_status not in allowed:
        raise ValueError(f"Cannot move from {engagement.status} to {new_status}")
    if new_status == Engagement.Status.COMPLETED and actor.role not in ("sme", "admin"):
        raise PermissionError("Only the business can approve completion")
    engagement.status = new_status
    engagement.save()
    return engagement
