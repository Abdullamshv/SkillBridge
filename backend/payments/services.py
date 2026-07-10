import datetime

from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction as db_transaction
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

PLATFORM_FEE_RATE = Decimal("0.02")  # flat 2%, business side only

ZERO = Decimal("0.00")


def _money(value) -> Decimal:
    """Normalise aggregates (SQLite returns unquantized decimals) to 2 dp."""
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_fee(task_price: Decimal) -> Decimal:
    return (task_price * PLATFORM_FEE_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_business_total(task_price: Decimal) -> Decimal:
    return task_price + calculate_fee(task_price)


def calculate_student_payout(task_price: Decimal) -> Decimal:
    return task_price  # students keep 100%, always


def _escrow_amount(engagement):
    amount = engagement.agreed_price
    if amount is None and engagement.project_id:
        amount = engagement.project.budget
    if amount is None:
        raise ValueError("Agree on a price before funding escrow")
    return amount


def initiate_escrow_funding(engagement):
    """Start funding: create (or reuse after a failure) the PENDING
    Transaction and get a checkout URL from the gateway. No ledger writes
    happen here — money only counts once the gateway confirms."""
    from payments.gateway import get_gateway
    from payments.models import Transaction

    amount = _escrow_amount(engagement)
    fee = calculate_fee(amount)
    with db_transaction.atomic():
        tx = (
            Transaction.objects.select_for_update()
            .filter(engagement=engagement)
            .first()
        )
        if tx is None:
            tx = Transaction.objects.create(
                engagement=engagement, amount=amount, platform_fee=fee,
                status=Transaction.Status.PENDING,
            )
        elif tx.status in (Transaction.Status.PENDING, Transaction.Status.FAILED):
            # Retry reuses the one-per-engagement row with a fresh amount.
            tx.amount = amount
            tx.platform_fee = fee
            tx.status = Transaction.Status.PENDING
            tx.payment_reference = ""
            tx.save(update_fields=["amount", "platform_fee", "status", "payment_reference", "updated_at"])
        else:
            raise ValueError("Escrow is already funded for this engagement")

    checkout_url = get_gateway().create_checkout(tx)
    return tx, checkout_url


def confirm_escrow_funding(tx, payment_reference=""):
    """Gateway confirmed payment: PENDING→HELD plus the business's SPEND and
    platform FEE ledger rows — exactly once. Re-delivered webhooks are no-ops."""
    from payments.models import LedgerEntry, Transaction

    with db_transaction.atomic():
        tx = Transaction.objects.select_for_update().select_related(
            "engagement", "engagement__sme", "engagement__sme__user"
        ).get(pk=tx.pk)
        if tx.status == Transaction.Status.HELD:
            return tx  # idempotent — webhook retries are normal
        if tx.status not in (Transaction.Status.PENDING, Transaction.Status.FAILED):
            raise ValueError(f"Cannot confirm funding from status '{tx.status}'")
        tx.status = Transaction.Status.HELD
        if payment_reference:
            tx.payment_reference = payment_reference
        tx.save(update_fields=["status", "payment_reference", "updated_at"])

        engagement = tx.engagement
        business_user = engagement.sme.user
        LedgerEntry.objects.create(
            user=business_user, engagement=engagement,
            kind=LedgerEntry.Kind.SPEND, amount=tx.amount + tx.platform_fee,
        )
        LedgerEntry.objects.create(
            user=business_user, engagement=engagement,
            kind=LedgerEntry.Kind.FEE, amount=tx.platform_fee,
        )
    return tx


def fail_escrow_funding(tx):
    """Gateway reported failure/cancellation: PENDING→FAILED. The business can
    retry — initiate_escrow_funding reuses the row."""
    from payments.models import Transaction

    with db_transaction.atomic():
        tx = Transaction.objects.select_for_update().get(pk=tx.pk)
        if tx.status != Transaction.Status.PENDING:
            raise ValueError(f"Cannot fail funding from status '{tx.status}'")
        tx.status = Transaction.Status.FAILED
        tx.save(update_fields=["status", "updated_at"])
    return tx


def fund_escrow(engagement):
    """Instant initiate+confirm shortcut — used by tests and seed data, and
    equivalent to what the dev gateway does when you click 'simulate success'."""
    from payments.models import Transaction

    if Transaction.objects.filter(
        engagement=engagement, status=Transaction.Status.HELD
    ).exists():
        raise ValueError("Escrow is already funded for this engagement")
    tx, _ = initiate_escrow_funding(engagement)
    return confirm_escrow_funding(tx, payment_reference="TEST-MODE")


def release_escrow(engagement):
    """Release a HELD escrow to the student — exactly once, only from HELD."""
    from payments.models import LedgerEntry, Transaction

    with db_transaction.atomic():
        tx = (
            Transaction.objects.select_for_update()
            .get(engagement=engagement, status=Transaction.Status.HELD)
        )
        tx.status = Transaction.Status.RELEASED
        tx.save(update_fields=["status", "updated_at"])
        LedgerEntry.objects.create(
            user=engagement.student.user,
            engagement=engagement,
            kind=LedgerEntry.Kind.EARNING,
            amount=tx.amount,  # 100% of the task price — fee was business-side
        )
    return tx


def approve_completion(engagement, actor):
    """Business approval is one operation: the delivered→completed transition
    and the escrow release happen together (spec §8) — an engagement can never
    be completed while money is still held, or released twice."""
    from engagements.models import Engagement
    from engagements.services import advance_status
    from payments.models import Transaction

    with db_transaction.atomic():
        if not Transaction.objects.filter(
            engagement=engagement, status=Transaction.Status.HELD
        ).exists():
            raise ValueError("Escrow must be funded before completion can be approved")
        advance_status(engagement, Engagement.Status.COMPLETED, actor)
        return release_escrow(engagement)


def _month_series(entries_qs, months_back: int = 6):
    """Last N calendar months of ledger sums, oldest first."""
    now = timezone.now()
    buckets = []
    year, month = now.year, now.month
    for _ in range(months_back):
        buckets.append((year, month))
        month -= 1
        if month == 0:
            year, month = year - 1, 12
    buckets.reverse()

    start = timezone.make_aware(datetime.datetime(buckets[0][0], buckets[0][1], 1))
    sums = {
        (row["month"].year, row["month"].month): row["total"]
        for row in entries_qs.filter(created_at__gte=start)
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(total=Sum("amount"))
    }
    return [
        {
            "label": datetime.date(y, m, 1).strftime("%b"),
            "value": _money(sums.get((y, m), ZERO)),
        }
        for (y, m) in buckets
    ]


def wallet_stats_for(user):
    """Role-aware numbers behind the Wallet screen (spec §12)."""
    from engagements.models import Engagement
    from payments.models import LedgerEntry, Transaction

    now = timezone.now()
    month_start = timezone.make_aware(datetime.datetime(now.year, now.month, 1))
    active_statuses = (
        Engagement.Status.AGREED,
        Engagement.Status.IN_PROGRESS,
        Engagement.Status.DELIVERED,
    )

    if user.role == "student":
        entries = LedgerEntry.objects.filter(user=user, kind=LedgerEntry.Kind.EARNING)
        held = Transaction.objects.filter(
            engagement__student__user=user, status=Transaction.Status.HELD
        ).aggregate(t=Sum("amount"))["t"] or ZERO
        active = Engagement.objects.filter(
            student__user=user, status__in=active_statuses
        ).select_related("project")
        fees_this_month = ZERO
    else:
        entries = LedgerEntry.objects.filter(user=user, kind=LedgerEntry.Kind.SPEND)
        held = Transaction.objects.filter(
            engagement__sme__user=user, status=Transaction.Status.HELD
        ).aggregate(t=Sum("amount"))["t"] or ZERO
        active = Engagement.objects.filter(
            sme__user=user, status__in=active_statuses
        ).select_related("project")
        fees_this_month = LedgerEntry.objects.filter(
            user=user, kind=LedgerEntry.Kind.FEE, created_at__gte=month_start
        ).aggregate(t=Sum("amount"))["t"] or ZERO

    this_month = entries.filter(created_at__gte=month_start).aggregate(t=Sum("amount"))["t"] or ZERO
    active_total = sum(
        (
            e.agreed_price
            if e.agreed_price is not None
            else (e.project.budget if e.project_id else ZERO)
        )
        for e in active
    ) or ZERO

    return {
        "this_month_total": _money(this_month),
        "escrow_held": _money(held),
        "active_total": _money(active_total),
        "active_count": active.count(),
        "fees_this_month": _money(fees_this_month),
        "months": _month_series(entries),
    }
