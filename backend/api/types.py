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
class StudentProfileType:
    id: strawberry.ID
    university: str
    major: str
    graduation_year: int
    primary_category: str
    skills: List[str]
    bio: str
    portfolio_url: str
    languages: str
    price_low: str
    price_high: str
    availability_status: str
    available_from: Optional[datetime.date]
    rating: float
    rating_count: int
    is_vetted: bool
    vetted_at: Optional[datetime.datetime]
    user: UserType
    reviews: List[ReviewType]

    @classmethod
    def from_model(cls, profile: Any) -> "StudentProfileType":
        return cls(
            id=strawberry.ID(str(profile.id)),
            university=profile.university,
            major=profile.major,
            graduation_year=profile.graduation_year,
            primary_category=profile.primary_category,
            skills=list(profile.skills) if profile.skills else [],
            bio=profile.bio,
            portfolio_url=profile.portfolio_url,
            languages=profile.languages,
            price_low=str(profile.price_low),
            price_high=str(profile.price_high),
            availability_status=profile.availability_status,
            available_from=profile.available_from,
            rating=float(profile.rating),
            rating_count=profile.rating_count,
            is_vetted=profile.is_vetted,
            vetted_at=profile.vetted_at,
            user=UserType.from_model(profile.user),
            reviews=[ReviewType.from_model(r) for r in profile.user.reviews_received.select_related("reviewer").all()],
        )


@strawberry.type
class SMEProfileType:
    id: strawberry.ID
    company_name: str
    industry: str
    location: str
    website: str
    description: str
    ssm_number: str
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
            location=sme.location,
            website=sme.website,
            description=sme.description,
            ssm_number=sme.ssm_number,
            is_verified=sme.is_verified,
            rating=float(sme.rating),
            rating_count=sme.rating_count,
            user=UserType.from_model(sme.user),
        )


@strawberry.type
class ProjectMilestoneType:
    id: strawberry.ID
    label: str
    note: str
    due_date: datetime.date
    order: int

    @classmethod
    def from_model(cls, milestone: Any) -> "ProjectMilestoneType":
        return cls(
            id=strawberry.ID(str(milestone.id)),
            label=milestone.label,
            note=milestone.note,
            due_date=milestone.due_date,
            order=milestone.order,
        )


@strawberry.type
class ProjectType:
    id: strawberry.ID
    title: str
    description: str
    description_extra: str
    category: str
    budget: str
    platform_fee: str
    business_total: str
    deadline: datetime.date
    status: str
    required_skills: List[str]
    looking_for_bullets: List[str]
    created_at: datetime.datetime
    sme: SMEProfileType
    assigned_student: Optional[StudentProfileType]
    milestones: List[ProjectMilestoneType]

    @classmethod
    def from_model(cls, project: Any) -> "ProjectType":
        from payments.services import calculate_business_total, calculate_fee

        return cls(
            id=strawberry.ID(str(project.id)),
            title=project.title,
            description=project.description,
            description_extra=project.description_extra,
            category=project.category,
            budget=str(project.budget),
            platform_fee=str(calculate_fee(project.budget)),
            business_total=str(calculate_business_total(project.budget)),
            deadline=project.deadline,
            status=project.status,
            required_skills=list(project.required_skills) if project.required_skills else [],
            looking_for_bullets=list(project.looking_for_bullets) if project.looking_for_bullets else [],
            created_at=project.created_at,
            sme=SMEProfileType.from_model(project.sme),
            assigned_student=(
                StudentProfileType.from_model(project.assigned_student)
                if project.assigned_student_id
                else None
            ),
            milestones=[ProjectMilestoneType.from_model(m) for m in project.milestones.all()],
        )


@strawberry.type
class AttachmentType:
    id: strawberry.ID
    original_name: str
    size_bytes: int
    url: str

    @classmethod
    def from_model(cls, attachment: Any) -> "AttachmentType":
        return cls(
            id=strawberry.ID(str(attachment.id)),
            original_name=attachment.original_name,
            size_bytes=attachment.size_bytes,
            url=attachment.file.url if attachment.file else "",
        )


@strawberry.type
class MessageType:
    id: strawberry.ID
    text: str
    created_at: datetime.datetime
    sender: UserType
    attachments: List[AttachmentType]

    @classmethod
    def from_model(cls, message: Any) -> "MessageType":
        return cls(
            id=strawberry.ID(str(message.id)),
            text=message.text,
            created_at=message.created_at,
            sender=UserType.from_model(message.sender),
            attachments=[AttachmentType.from_model(a) for a in message.attachments.all()],
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


@strawberry.type
class EngagementType:
    id: strawberry.ID
    status: str
    agreed_price: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime
    project: Optional[ProjectType]
    sme: SMEProfileType
    student: StudentProfileType
    messages: List[MessageType]
    transaction: Optional[TransactionType]
    reviewer_usernames: List[str]

    @classmethod
    def from_model(cls, engagement: Any) -> "EngagementType":
        tx = getattr(engagement, "transaction", None)  # reverse OneToOne may not exist
        return cls(
            id=strawberry.ID(str(engagement.id)),
            status=engagement.status,
            agreed_price=str(engagement.agreed_price) if engagement.agreed_price is not None else None,
            created_at=engagement.created_at,
            updated_at=engagement.updated_at,
            project=ProjectType.from_model(engagement.project) if engagement.project_id else None,
            sme=SMEProfileType.from_model(engagement.sme),
            student=StudentProfileType.from_model(engagement.student),
            messages=[MessageType.from_model(m) for m in engagement.messages.all()],
            transaction=TransactionType.from_model(tx) if tx else None,
            reviewer_usernames=[r.reviewer.username for r in engagement.reviews.all()],
        )


@strawberry.type
class LedgerEntryType:
    id: strawberry.ID
    kind: str
    amount: str
    created_at: datetime.datetime

    @classmethod
    def from_model(cls, entry: Any) -> "LedgerEntryType":
        return cls(
            id=strawberry.ID(str(entry.id)),
            kind=entry.kind,
            amount=str(entry.amount),
            created_at=entry.created_at,
        )


@strawberry.type
class WalletMonthType:
    label: str
    value: str


@strawberry.type
class WalletStatsType:
    this_month_total: str
    escrow_held: str
    active_total: str
    active_count: int
    fees_this_month: str
    months: List[WalletMonthType]

    @classmethod
    def from_stats(cls, stats: dict) -> "WalletStatsType":
        return cls(
            this_month_total=str(stats["this_month_total"]),
            escrow_held=str(stats["escrow_held"]),
            active_total=str(stats["active_total"]),
            active_count=stats["active_count"],
            fees_this_month=str(stats["fees_this_month"]),
            months=[
                WalletMonthType(label=m["label"], value=str(m["value"]))
                for m in stats["months"]
            ],
        )
