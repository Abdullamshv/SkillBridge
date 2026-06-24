from typing import List, Optional

import strawberry

from .types import ProjectType, ProposalType, UserType


@strawberry.type
class Query:

    @strawberry.field
    def me(self, info: strawberry.types.Info) -> Optional[UserType]:
        user = info.context.request.user
        if not user.is_authenticated:
            return None
        return UserType.from_model(user)

    @strawberry.field
    def projects(
        self,
        info: strawberry.types.Info,
        status: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[ProjectType]:
        from projects.models import Project

        qs = Project.objects.select_related(
            "sme", "sme__user",
            "assigned_student", "assigned_student__user",
        )
        if status:
            qs = qs.filter(status=status)
        if category:
            qs = qs.filter(category=category)
        return [ProjectType.from_model(p) for p in qs]

    @strawberry.field
    def project(self, info: strawberry.types.Info, id: strawberry.ID) -> Optional[ProjectType]:
        from projects.models import Project

        try:
            p = Project.objects.select_related(
                "sme", "sme__user",
                "assigned_student", "assigned_student__user",
            ).get(pk=id)
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
        )
        return [ProjectType.from_model(p) for p in qs]

    @strawberry.field
    def my_proposals(self, info: strawberry.types.Info) -> List[ProposalType]:
        user = info.context.request.user
        if not user.is_authenticated or user.role != "student":
            raise PermissionError("Student access required")
        from projects.models import Proposal

        qs = Proposal.objects.filter(student=user.student_profile).select_related(
            "project", "project__sme", "project__sme__user",
            "project__assigned_student", "project__assigned_student__user",
            "student", "student__user",
        )
        return [ProposalType.from_model(p) for p in qs]
