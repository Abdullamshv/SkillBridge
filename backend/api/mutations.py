import datetime
from decimal import Decimal
from typing import Any, List, Optional

import strawberry

from .types import (
    ProjectType,
    ProposalType,
    SMEProfileType,
    StudentProfileType,
    TransactionType,
    UserType,
)

PLATFORM_RATE = Decimal("0.10")


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
        from users.models import User

        if role not in ("student", "sme"):
            raise ValueError("Role must be 'student' or 'sme'")
        if User.objects.filter(username=username).exists():
            raise ValueError("Username already taken")
        user = User.objects.create_user(
            username=username, email=email, password=password, role=role
        )
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
        skills: Optional[List[str]] = None,
        bio: Optional[str] = None,
        portfolio_url: Optional[str] = None,
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
        if skills is not None:
            profile.skills = skills
        if bio is not None:
            profile.bio = bio
        if portfolio_url is not None:
            profile.portfolio_url = portfolio_url
        profile.save()
        return StudentProfileType.from_model(profile)

    @strawberry.mutation(permission_classes=[IsSME])
    def update_sme_profile(
        self,
        info: strawberry.types.Info,
        company_name: Optional[str] = None,
        industry: Optional[str] = None,
        website: Optional[str] = None,
        description: Optional[str] = None,
    ) -> SMEProfileType:
        from users.models import SMEProfile

        profile, _ = SMEProfile.objects.select_related("user").get_or_create(
            user=info.context.request.user
        )
        if company_name is not None:
            profile.company_name = company_name
        if industry is not None:
            profile.industry = industry
        if website is not None:
            profile.website = website
        if description is not None:
            profile.description = description
        profile.save()
        return SMEProfileType.from_model(profile)

    # ── Projects ──────────────────────────────────────────────────────────

    @strawberry.mutation(permission_classes=[IsSME])
    def create_project(
        self,
        info: strawberry.types.Info,
        title: str,
        description: str,
        category: str,
        budget: str,
        deadline: datetime.date,
    ) -> ProjectType:
        from projects.models import Project
        from users.models import SMEProfile

        sme = SMEProfile.objects.select_related("user").get(user=info.context.request.user)
        project = Project.objects.create(
            sme=sme,
            title=title,
            description=description,
            category=category,
            budget=Decimal(budget),
            deadline=deadline,
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
        project = Project.objects.select_related(
            "sme", "sme__user",
            "assigned_student", "assigned_student__user",
        ).get(pk=project_id)
        if user.role == "sme" and project.sme.user_id != user.id:
            raise PermissionError("You can only update your own projects")
        project.status = status
        project.save()
        return ProjectType.from_model(project)

    # ── Proposals ─────────────────────────────────────────────────────────

    @strawberry.mutation(permission_classes=[IsStudent])
    def submit_proposal(
        self,
        info: strawberry.types.Info,
        project_id: strawberry.ID,
        cover_letter: str,
        proposed_budget: str,
        proposed_days: int,
    ) -> ProposalType:
        from projects.models import Project, Proposal
        from users.models import StudentProfile

        student = StudentProfile.objects.select_related("user").get(
            user=info.context.request.user
        )
        project = Project.objects.select_related("sme", "sme__user").get(
            pk=project_id, status="open"
        )
        proposal = Proposal.objects.create(
            project=project,
            student=student,
            cover_letter=cover_letter,
            proposed_budget=Decimal(proposed_budget),
            proposed_days=proposed_days,
        )
        proposal.project = project
        proposal.student = student
        return ProposalType.from_model(proposal)

    @strawberry.mutation(permission_classes=[IsSME])
    def accept_proposal(
        self,
        info: strawberry.types.Info,
        proposal_id: strawberry.ID,
    ) -> ProposalType:
        from django.db import transaction
        from projects.models import Project, Proposal

        with transaction.atomic():
            proposal = (
                Proposal.objects.select_related(
                    "project", "project__sme", "project__sme__user",
                    "project__assigned_student", "project__assigned_student__user",
                    "student", "student__user",
                )
                .select_for_update()
                .get(pk=proposal_id)
            )
            if proposal.project.sme.user_id != info.context.request.user.id:
                raise PermissionError("You can only accept proposals for your own projects")
            proposal.status = Proposal.Status.ACCEPTED
            proposal.save()
            project = proposal.project
            project.status = Project.Status.IN_PROGRESS
            project.assigned_student = proposal.student
            project.save()
            Proposal.objects.filter(project=project).exclude(pk=proposal_id).update(
                status=Proposal.Status.REJECTED
            )
        return ProposalType.from_model(proposal)

    @strawberry.mutation(permission_classes=[IsSME])
    def reject_proposal(
        self,
        info: strawberry.types.Info,
        proposal_id: strawberry.ID,
    ) -> ProposalType:
        from projects.models import Proposal

        proposal = Proposal.objects.select_related(
            "project", "project__sme", "project__sme__user",
            "student", "student__user",
        ).get(pk=proposal_id)
        if proposal.project.sme.user_id != info.context.request.user.id:
            raise PermissionError("You can only reject proposals for your own projects")
        proposal.status = Proposal.Status.REJECTED
        proposal.save()
        return ProposalType.from_model(proposal)

    # ── Payments ──────────────────────────────────────────────────────────

    @strawberry.mutation(permission_classes=[IsSME])
    def create_transaction(
        self,
        info: strawberry.types.Info,
        project_id: strawberry.ID,
        amount: str,
    ) -> TransactionType:
        from payments.models import Transaction
        from projects.models import Project

        project = Project.objects.select_related("sme", "sme__user").get(
            pk=project_id, sme__user=info.context.request.user
        )
        amount_decimal = Decimal(amount)
        tx = Transaction.objects.create(
            project=project,
            amount=amount_decimal,
            platform_fee=(amount_decimal * PLATFORM_RATE).quantize(Decimal("0.01")),
        )
        return TransactionType.from_model(tx)

    @strawberry.mutation(permission_classes=[IsAdmin])
    def release_payment(
        self,
        info: strawberry.types.Info,
        project_id: strawberry.ID,
    ) -> TransactionType:
        from django.db import transaction
        from payments.models import Transaction
        from projects.models import Project

        with transaction.atomic():
            tx = (
                Transaction.objects.select_for_update()
                .get(project_id=project_id, status=Transaction.Status.HELD)
            )
            tx.status = Transaction.Status.RELEASED
            tx.save()
            Project.objects.filter(pk=project_id).update(status=Project.Status.COMPLETED)
        return TransactionType.from_model(tx)
