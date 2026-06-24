import datetime
import strawberry
from typing import Any, List, Optional


@strawberry.type
class UserType:
    id: strawberry.ID
    username: str
    email: str
    role: str
    is_verified: bool
    avatar: Optional[str]
    created_at: datetime.datetime

    @classmethod
    def from_model(cls, user: Any) -> "UserType":
        return cls(
            id=strawberry.ID(str(user.id)),
            username=user.username,
            email=user.email,
            role=user.role,
            is_verified=user.is_verified,
            avatar=user.avatar.url if user.avatar else None,
            created_at=user.created_at,
        )


@strawberry.type
class StudentProfileType:
    id: strawberry.ID
    university: str
    major: str
    graduation_year: int
    skills: List[str]
    bio: str
    portfolio_url: str
    rating: float
    rating_count: int
    user: UserType

    @classmethod
    def from_model(cls, profile: Any) -> "StudentProfileType":
        return cls(
            id=strawberry.ID(str(profile.id)),
            university=profile.university,
            major=profile.major,
            graduation_year=profile.graduation_year,
            skills=list(profile.skills) if profile.skills else [],
            bio=profile.bio,
            portfolio_url=profile.portfolio_url,
            rating=float(profile.rating),
            rating_count=profile.rating_count,
            user=UserType.from_model(profile.user),
        )


@strawberry.type
class SMEProfileType:
    id: strawberry.ID
    company_name: str
    industry: str
    website: str
    description: str
    is_verified: bool
    rating: float
    rating_count: int
    user: UserType

    @classmethod
    def from_model(cls, sme: Any) -> "SMEProfileType":
        return cls(
            id=strawberry.ID(str(sme.id)),
            company_name=sme.company_name,
            industry=sme.industry,
            website=sme.website,
            description=sme.description,
            is_verified=sme.is_verified,
            rating=float(sme.rating),
            rating_count=sme.rating_count,
            user=UserType.from_model(sme.user),
        )


@strawberry.type
class ProjectType:
    id: strawberry.ID
    title: str
    description: str
    category: str
    budget: str
    deadline: datetime.date
    status: str
    created_at: datetime.datetime
    sme: SMEProfileType
    assigned_student: Optional[StudentProfileType]

    @classmethod
    def from_model(cls, project: Any) -> "ProjectType":
        return cls(
            id=strawberry.ID(str(project.id)),
            title=project.title,
            description=project.description,
            category=project.category,
            budget=str(project.budget),
            deadline=project.deadline,
            status=project.status,
            created_at=project.created_at,
            sme=SMEProfileType.from_model(project.sme),
            assigned_student=(
                StudentProfileType.from_model(project.assigned_student)
                if project.assigned_student_id
                else None
            ),
        )


@strawberry.type
class ProposalType:
    id: strawberry.ID
    cover_letter: str
    proposed_budget: str
    proposed_days: int
    status: str
    created_at: datetime.datetime
    project: ProjectType
    student: StudentProfileType

    @classmethod
    def from_model(cls, proposal: Any) -> "ProposalType":
        return cls(
            id=strawberry.ID(str(proposal.id)),
            cover_letter=proposal.cover_letter,
            proposed_budget=str(proposal.proposed_budget),
            proposed_days=proposal.proposed_days,
            status=proposal.status,
            created_at=proposal.created_at,
            project=ProjectType.from_model(proposal.project),
            student=StudentProfileType.from_model(proposal.student),
        )


@strawberry.type
class ReviewType:
    id: strawberry.ID
    rating: int
    comment: str
    created_at: datetime.datetime
    reviewer: UserType
    reviewee: UserType

    @classmethod
    def from_model(cls, review: Any) -> "ReviewType":
        return cls(
            id=strawberry.ID(str(review.id)),
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            reviewer=UserType.from_model(review.reviewer),
            reviewee=UserType.from_model(review.reviewee),
        )


@strawberry.type
class TransactionType:
    id: strawberry.ID
    amount: str
    platform_fee: str
    status: str
    payment_reference: str
    created_at: datetime.datetime

    @classmethod
    def from_model(cls, tx: Any) -> "TransactionType":
        return cls(
            id=strawberry.ID(str(tx.id)),
            amount=str(tx.amount),
            platform_fee=str(tx.platform_fee),
            status=tx.status,
            payment_reference=tx.payment_reference,
            created_at=tx.created_at,
        )
