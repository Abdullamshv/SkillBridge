from typing import List, Optional

import strawberry

from .types import (
    EngagementType,
    ProjectType,
    StudentProfileType,
    UserType,
    WalletStatsType,
)


@strawberry.type
class Query:

    @strawberry.field
    def me(self, info: strawberry.types.Info) -> Optional[UserType]:
        user = info.context.request.user
        if not user.is_authenticated:
            return None
        return UserType.from_model(user)

    # ── Tasks (Student Home / Task Detail) ──────────────────────────────────

    @strawberry.field
    def projects(
        self,
        info: strawberry.types.Info,
        search: Optional[str] = None,
        status: Optional[str] = None,
        category: Optional[str] = None,
        min_price: Optional[str] = None,
        max_price: Optional[str] = None,
        sort: Optional[str] = None,
    ) -> List[ProjectType]:
        from projects.models import Project

        qs = Project.objects.select_related(
            "sme", "sme__user",
            "assigned_student", "assigned_student__user",
        ).prefetch_related("milestones")
        if search:
            qs = qs.filter(title__icontains=search)
        qs = qs.filter(status=status) if status else qs.filter(status=Project.Status.OPEN)
        if category:
            qs = qs.filter(category=category)
        if min_price:
            qs = qs.filter(budget__gte=min_price)
        if max_price:
            qs = qs.filter(budget__lte=max_price)
        qs = qs.order_by("-budget") if sort == "price" else qs.order_by("-created_at")
        return [ProjectType.from_model(p) for p in qs]

    @strawberry.field
    def project(self, info: strawberry.types.Info, id: strawberry.ID) -> Optional[ProjectType]:
        from projects.models import Project

        try:
            p = Project.objects.select_related(
                "sme", "sme__user",
                "assigned_student", "assigned_student__user",
            ).prefetch_related("milestones").get(pk=id)
            return ProjectType.from_model(p)
        except Project.DoesNotExist:
            return None

    @strawberry.field
    def my_projects(self, info: strawberry.types.Info) -> List[ProjectType]:
        user = info.context.request.user
        if not user.is_authenticated or user.role != "sme":
            raise PermissionError("SME access required")
        qs = user.sme_profile.projects.select_related(
            "sme", "sme__user",
            "assigned_student", "assigned_student__user",
        ).prefetch_related("milestones")
        return [ProjectType.from_model(p) for p in qs]

    @strawberry.field
    def saved_task_ids(self, info: strawberry.types.Info) -> List[strawberry.ID]:
        user = info.context.request.user
        if not user.is_authenticated or user.role != "student":
            return []
        return [
            strawberry.ID(str(pk))
            for pk in user.student_profile.saved_tasks.values_list("project_id", flat=True)
        ]

    # ── Talent (SME Home / Profile Detail) ───────────────────────────────────

    @strawberry.field
    def students(
        self,
        info: strawberry.types.Info,
        search: Optional[str] = None,
        category: Optional[str] = None,
        min_price: Optional[str] = None,
        max_price: Optional[str] = None,
        min_rating: Optional[float] = None,
    ) -> List[StudentProfileType]:
        from users.models import StudentProfile

        from django.db.models import Q

        qs = StudentProfile.objects.select_related("user")
        if search:
            qs = qs.filter(
                Q(bio__icontains=search) | Q(user__username__icontains=search)
            ).distinct()
        if category:
            qs = qs.filter(primary_category=category)
        if min_price:
            qs = qs.filter(price_high__gte=min_price)
        if max_price:
            qs = qs.filter(price_low__lte=max_price)
        if min_rating:
            qs = qs.filter(rating__gte=min_rating)
        return [StudentProfileType.from_model(s) for s in qs.order_by("-rating")]

    @strawberry.field
    def student(self, info: strawberry.types.Info, id: strawberry.ID) -> Optional[StudentProfileType]:
        from users.models import StudentProfile

        try:
            s = StudentProfile.objects.select_related("user").get(pk=id)
            return StudentProfileType.from_model(s)
        except StudentProfile.DoesNotExist:
            return None

    @strawberry.field
    def saved_student_ids(self, info: strawberry.types.Info) -> List[strawberry.ID]:
        user = info.context.request.user
        if not user.is_authenticated or user.role != "sme":
            return []
        return [
            strawberry.ID(str(pk))
            for pk in user.sme_profile.saved_students.values_list("student_id", flat=True)
        ]

    # ── Office (engagements) ─────────────────────────────────────────────────

    @strawberry.field
    def engagements(self, info: strawberry.types.Info) -> List[EngagementType]:
        from django.db.models import Q
        from engagements.models import Engagement

        user = info.context.request.user
        if not user.is_authenticated:
            raise PermissionError("Authentication required")
        qs = Engagement.objects.select_related(
            "project", "sme", "sme__user", "student", "student__user", "transaction",
        ).prefetch_related(
            "messages", "messages__sender", "messages__attachments",
            "reviews", "reviews__reviewer",
        )
        if user.role == "sme":
            qs = qs.filter(sme=user.sme_profile)
        elif user.role == "student":
            qs = qs.filter(student=user.student_profile)
        else:
            qs = qs.filter(Q(sme__user=user) | Q(student__user=user))
        return [EngagementType.from_model(e) for e in qs.order_by("-updated_at")]

    @strawberry.field
    def engagement(self, info: strawberry.types.Info, id: strawberry.ID) -> Optional[EngagementType]:
        from engagements.models import Engagement

        user = info.context.request.user
        if not user.is_authenticated:
            raise PermissionError("Authentication required")
        try:
            e = Engagement.objects.select_related(
                "project", "sme", "sme__user", "student", "student__user", "transaction",
            ).prefetch_related(
                "messages", "messages__sender", "messages__attachments",
                "reviews", "reviews__reviewer",
            ).get(pk=id)
        except Engagement.DoesNotExist:
            return None
        if user.id not in (e.sme.user_id, e.student.user_id):
            raise PermissionError("Not a participant in this engagement")
        return EngagementType.from_model(e)

    # ── Wallet ───────────────────────────────────────────────────────────────

    @strawberry.field
    def wallet_stats(self, info: strawberry.types.Info) -> WalletStatsType:
        from payments.services import wallet_stats_for

        user = info.context.request.user
        if not user.is_authenticated:
            raise PermissionError("Authentication required")
        return WalletStatsType.from_stats(wallet_stats_for(user))
