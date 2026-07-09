from django.db import transaction as db_transaction
from django.db.models import Avg, Count


def recompute_rating_for(user):
    """Refresh the denormalised rating/rating_count on the user's profile from
    the reviews they have received."""
    from projects.models import Review

    agg = Review.objects.filter(reviewee=user).aggregate(
        avg=Avg("rating"), n=Count("id")
    )
    rating = round(agg["avg"] or 0, 2)
    count = agg["n"]
    if user.role == "student" and hasattr(user, "student_profile"):
        profile = user.student_profile
    elif user.role == "sme" and hasattr(user, "sme_profile"):
        profile = user.sme_profile
    else:
        return
    profile.rating = rating
    profile.rating_count = count
    profile.save(update_fields=["rating", "rating_count"])


def submit_review(engagement, reviewer, rating: int, comment: str = ""):
    """Either participant reviews the other, once, after completion."""
    from engagements.models import Engagement
    from projects.models import Review

    if reviewer.id == engagement.sme.user_id:
        reviewee = engagement.student.user
    elif reviewer.id == engagement.student.user_id:
        reviewee = engagement.sme.user
    else:
        raise PermissionError("Only participants can review this engagement")

    if engagement.status != Engagement.Status.COMPLETED:
        raise ValueError("Reviews open once the engagement is completed")
    if not 1 <= rating <= 5:
        raise ValueError("Rating must be between 1 and 5")

    with db_transaction.atomic():
        if Review.objects.filter(engagement=engagement, reviewer=reviewer).exists():
            raise ValueError("You have already reviewed this engagement")
        review = Review.objects.create(
            project=engagement.project,
            engagement=engagement,
            reviewer=reviewer,
            reviewee=reviewee,
            rating=rating,
            comment=comment,
        )
        recompute_rating_for(reviewee)
    return review
