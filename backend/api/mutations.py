import datetime
from decimal import Decimal
from typing import Any, List, Optional

import strawberry

from .types import (
    EngagementType,
    MessageType,
    ProjectType,
    ReviewType,
    SMEProfileType,
    StudentProfileType,
    TransactionType,
    UserType,
)


class IsAuthenticated(strawberry.BasePermission):
    message = "Authentication required"

    def has_permission(self, source: Any, info: strawberry.types.Info, **kwargs: Any) -> bool:
        return info.context.request.user.is_authenticated


class IsStudent(strawberry.BasePermission):
    message = "Student role required"

    def has_permission(self, source: Any, info: strawberry.types.Info, **kwargs: Any) -> bool:
        u = info.context.request.user
        return u.is_authenticated and u.role == "student"


class IsSME(strawberry.BasePermission):
    message = "SME role required"

    def has_permission(self, source: Any, info: strawberry.types.Info, **kwargs: Any) -> bool:
        u = info.context.request.user
        return u.is_authenticated and u.role == "sme"


class IsAdmin(strawberry.BasePermission):
    message = "Admin role required"

    def has_permission(self, source: Any, info: strawberry.types.Info, **kwargs: Any) -> bool:
        u = info.context.request.user
        return u.is_authenticated and u.role == "admin"


class IsSMEOrAdmin(strawberry.BasePermission):
    message = "SME or Admin role required"

    def has_permission(self, source: Any, info: strawberry.types.Info, **kwargs: Any) -> bool:
        u = info.context.request.user
        return u.is_authenticated and u.role in ("sme", "admin")


@strawberry.type
class Mutation:

    # ── Auth ──────────────────────────────────────────────────────────────

    @strawberry.mutation
    def register(
        self,
        info: strawberry.types.Info,
        username: str,
        email: str,
        password: str,
        role: str,
    ) -> UserType:
        from django.contrib.auth import login as auth_login
        from users.models import SMEProfile, StudentProfile, User

        if role not in ("student", "sme"):
            raise ValueError("Role must be 'student' or 'sme'")
        if User.objects.filter(username=username).exists():
            raise ValueError("Username already taken")
        user = User.objects.create_user(
            username=username, email=email, password=password, role=role
        )
        if role == "student":
            StudentProfile.objects.create(user=user)
        else:
            SMEProfile.objects.create(user=user)
        auth_login(info.context.request, user)
        return UserType.from_model(user)

    @strawberry.mutation
    def login(
        self,
        info: strawberry.types.Info,
        username: str,
        password: str,
    ) -> UserType:
        from django.contrib.auth import authenticate, login as auth_login

        user = authenticate(info.context.request, username=username, password=password)
        if not user:
            raise ValueError("Invalid credentials")
        auth_login(info.context.request, user)
        return UserType.from_model(user)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def logout(self, info: strawberry.types.Info) -> bool:
        from django.contrib.auth import logout as auth_logout

        auth_logout(info.context.request)
        return True

    # ── Profiles ──────────────────────────────────────────────────────────

    @strawberry.mutation(permission_classes=[IsStudent])
    def update_student_profile(
        self,
        info: strawberry.types.Info,
        university: Optional[str] = None,
        major: Optional[str] = None,
        graduation_year: Optional[int] = None,
        primary_category: Optional[str] = None,
        skills: Optional[List[str]] = None,
        bio: Optional[str] = None,
        portfolio_url: Optional[str] = None,
        languages: Optional[str] = None,
        price_low: Optional[str] = None,
        price_high: Optional[str] = None,
        availability_status: Optional[str] = None,
        available_from: Optional[datetime.date] = None,
    ) -> StudentProfileType:
        from users.models import StudentProfile

        profile, _ = StudentProfile.objects.select_related("user").get_or_create(
            user=info.context.request.user
        )
        if university is not None:
            profile.university = university
        if major is not None:
            profile.major = major
        if graduation_year is not None:
            profile.graduation_year = graduation_year
        if primary_category is not None:
            profile.primary_category = primary_category
        if skills is not None:
            profile.skills = skills
        if bio is not None:
            profile.bio = bio
        if portfolio_url is not None:
            profile.portfolio_url = portfolio_url
        if languages is not None:
            profile.languages = languages
        if price_low is not None:
            profile.price_low = Decimal(price_low)
        if price_high is not None:
            profile.price_high = Decimal(price_high)
        if availability_status is not None:
            profile.availability_status = availability_status
        if available_from is not None:
            profile.available_from = available_from
        profile.save()
        return StudentProfileType.from_model(profile)

    @strawberry.mutation(permission_classes=[IsSME])
    def update_sme_profile(
        self,
        info: strawberry.types.Info,
        company_name: Optional[str] = None,
        industry: Optional[str] = None,
        location: Optional[str] = None,
        website: Optional[str] = None,
        description: Optional[str] = None,
        ssm_number: Optional[str] = None,
    ) -> SMEProfileType:
        from users.models import SMEProfile

        profile, _ = SMEProfile.objects.select_related("user").get_or_create(
            user=info.context.request.user
        )
        if company_name is not None:
            profile.company_name = company_name
        if industry is not None:
            profile.industry = industry
        if location is not None:
            profile.location = location
        if website is not None:
            profile.website = website
        if description is not None:
            profile.description = description
        if ssm_number is not None:
            profile.ssm_number = ssm_number
        profile.save()
        return SMEProfileType.from_model(profile)

    # ── Tasks ─────────────────────────────────────────────────────────────

    @strawberry.mutation(permission_classes=[IsSME])
    def create_project(
        self,
        info: strawberry.types.Info,
        title: str,
        description: str,
        category: str,
        budget: str,
        deadline: datetime.date,
        description_extra: str = "",
        required_skills: Optional[List[str]] = None,
        looking_for_bullets: Optional[List[str]] = None,
    ) -> ProjectType:
        from projects.models import Project
        from users.models import SMEProfile

        sme = SMEProfile.objects.select_related("user").get(user=info.context.request.user)
        project = Project.objects.create(
            sme=sme,
            title=title,
            description=description,
            description_extra=description_extra,
            category=category,
            budget=Decimal(budget),
            deadline=deadline,
            required_skills=required_skills or [],
            looking_for_bullets=looking_for_bullets or [],
        )
        project.sme = sme
        return ProjectType.from_model(project)

    @strawberry.mutation(permission_classes=[IsSMEOrAdmin])
    def update_project_status(
        self,
        info: strawberry.types.Info,
        project_id: strawberry.ID,
        status: str,
    ) -> ProjectType:
        from projects.models import Project

        user = info.context.request.user
        if status not in Project.Status.values:
            raise ValueError(f"Invalid status '{status}'")
        project = Project.objects.select_related(
            "sme", "sme__user",
            "assigned_student", "assigned_student__user",
        ).get(pk=project_id)
        if user.role == "sme" and project.sme.user_id != user.id:
            raise PermissionError("You can only update your own projects")
        project.status = status
        project.save()
        return ProjectType.from_model(project)

    @strawberry.mutation(permission_classes=[IsStudent])
    def save_task(self, info: strawberry.types.Info, project_id: strawberry.ID) -> bool:
        from projects.models import SavedTask

        SavedTask.objects.get_or_create(
            student=info.context.request.user.student_profile, project_id=project_id
        )
        return True

    @strawberry.mutation(permission_classes=[IsStudent])
    def unsave_task(self, info: strawberry.types.Info, project_id: strawberry.ID) -> bool:
        from projects.models import SavedTask

        SavedTask.objects.filter(
            student=info.context.request.user.student_profile, project_id=project_id
        ).delete()
        return True

    # ── Talent ────────────────────────────────────────────────────────────

    @strawberry.mutation(permission_classes=[IsSME])
    def save_student(self, info: strawberry.types.Info, student_id: strawberry.ID) -> bool:
        from projects.models import SavedStudent

        SavedStudent.objects.get_or_create(
            sme=info.context.request.user.sme_profile, student_id=student_id
        )
        return True

    @strawberry.mutation(permission_classes=[IsSME])
    def unsave_student(self, info: strawberry.types.Info, student_id: strawberry.ID) -> bool:
        from projects.models import SavedStudent

        SavedStudent.objects.filter(
            sme=info.context.request.user.sme_profile, student_id=student_id
        ).delete()
        return True

    # ── Office (engagements) ─────────────────────────────────────────────────

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def reach_out(
        self,
        info: strawberry.types.Info,
        message: str,
        project_id: Optional[strawberry.ID] = None,
        student_id: Optional[strawberry.ID] = None,
    ) -> EngagementType:
        from engagements.models import Engagement, Message
        from projects.models import Project
        from users.models import SMEProfile, StudentProfile

        user = info.context.request.user
        project = None
        if user.role == "student":
            if not project_id:
                raise ValueError("project_id is required when a student reaches out")
            student = StudentProfile.objects.select_related("user").get(user=user)
            project = Project.objects.select_related("sme", "sme__user").get(pk=project_id)
            sme = project.sme
        elif user.role == "sme":
            if not student_id:
                raise ValueError("student_id is required when a business reaches out")
            sme = SMEProfile.objects.select_related("user").get(user=user)
            student = StudentProfile.objects.select_related("user").get(pk=student_id)
            if project_id:
                project = Project.objects.select_related("sme", "sme__user").filter(
                    pk=project_id, sme=sme
                ).first()
        else:
            raise PermissionError("Only students or businesses can reach out")

        engagement = Engagement.objects.select_related(
            "project", "sme", "sme__user", "student", "student__user",
        ).filter(sme=sme, student=student).first()
        if not engagement:
            engagement = Engagement.objects.create(project=project, sme=sme, student=student)

        Message.objects.create(engagement=engagement, sender=user, text=message)
        return EngagementType.from_model(engagement)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def send_message(
        self,
        info: strawberry.types.Info,
        engagement_id: strawberry.ID,
        text: str,
    ) -> MessageType:
        from engagements.models import Engagement, Message

        user = info.context.request.user
        engagement = Engagement.objects.select_related("sme__user", "student__user").get(pk=engagement_id)
        if user.id not in (engagement.sme.user_id, engagement.student.user_id):
            raise PermissionError("Not a participant in this engagement")
        message = Message.objects.create(engagement=engagement, sender=user, text=text)
        return MessageType.from_model(message)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def advance_engagement_status(
        self,
        info: strawberry.types.Info,
        engagement_id: strawberry.ID,
        status: str,
        agreed_price: Optional[str] = None,
    ) -> EngagementType:
        from django.db import transaction as db_transaction
        from engagements.models import Engagement
        from engagements.services import advance_status
        from payments.services import approve_completion

        user = info.context.request.user
        with db_transaction.atomic():
            engagement = (
                Engagement.objects.select_related(
                    "project", "sme", "sme__user", "student", "student__user",
                )
                .select_for_update()
                .get(pk=engagement_id)
            )
            if user.id not in (engagement.sme.user_id, engagement.student.user_id):
                raise PermissionError("Not a participant in this engagement")
            if agreed_price is not None:
                engagement.agreed_price = Decimal(agreed_price)
                engagement.save(update_fields=["agreed_price"])
            if status == Engagement.Status.COMPLETED:
                # Approval and escrow release are one operation (spec §8).
                approve_completion(engagement, user)
            else:
                advance_status(engagement, status, user)
        return EngagementType.from_model(engagement)

    # ── Reviews ───────────────────────────────────────────────────────────

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def submit_review(
        self,
        info: strawberry.types.Info,
        engagement_id: strawberry.ID,
        rating: int,
        comment: str = "",
    ) -> ReviewType:
        from engagements.models import Engagement
        from projects.services import submit_review as submit_review_service

        engagement = Engagement.objects.select_related(
            "project", "sme", "sme__user", "student", "student__user",
        ).get(pk=engagement_id)
        review = submit_review_service(
            engagement, info.context.request.user, rating, comment
        )
        return ReviewType.from_model(review)

    # ── Payments ──────────────────────────────────────────────────────────

    @strawberry.mutation(permission_classes=[IsSME])
    def fund_escrow(
        self,
        info: strawberry.types.Info,
        engagement_id: strawberry.ID,
    ) -> TransactionType:
        from engagements.models import Engagement
        from payments.services import fund_escrow as fund_escrow_service

        engagement = Engagement.objects.select_related(
            "project", "sme", "sme__user",
        ).get(pk=engagement_id, sme__user=info.context.request.user)
        if engagement.status == Engagement.Status.REACHED_OUT:
            raise ValueError("Agree on terms before funding escrow")
        tx = fund_escrow_service(engagement)
        return TransactionType.from_model(tx)

    @strawberry.mutation(permission_classes=[IsAdmin])
    def release_payment(
        self,
        info: strawberry.types.Info,
        engagement_id: strawberry.ID,
    ) -> TransactionType:
        """Admin backstop for manual release — same one-shot release path the
        business approval uses."""
        from engagements.models import Engagement
        from payments.services import approve_completion

        engagement = Engagement.objects.select_related(
            "project", "sme", "sme__user", "student", "student__user",
        ).get(pk=engagement_id)
        tx = approve_completion(engagement, info.context.request.user)
        return TransactionType.from_model(tx)
