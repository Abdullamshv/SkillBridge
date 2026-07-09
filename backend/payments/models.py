from django.db import models


class Transaction(models.Model):
    """Money conceptually 'in escrow' for one Engagement. Real custody of funds
    happens at a licensed payment gateway (Billplz/ToyyibPay/CHIP) once that's
    wired up — this model tracks state, not actual bank balances."""

    class Status(models.TextChoices):
        PENDING  = "pending",  "Awaiting funding"
        HELD     = "held",     "Funded / held"
        RELEASED = "released", "Released"
        REFUNDED = "refunded", "Refunded"
        FAILED   = "failed",   "Failed"

    engagement        = models.OneToOneField("engagements.Engagement", on_delete=models.PROTECT, related_name="transaction")
    amount            = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee      = models.DecimalField(max_digits=10, decimal_places=2)
    status            = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    payment_reference = models.CharField(max_length=200, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Transaction #{self.pk} — {self.engagement} [{self.status}]"


class LedgerEntry(models.Model):
    """Append-only record backing the Wallet screen's stat cards and
    month-over-month chart."""

    class Kind(models.TextChoices):
        EARNING = "earning", "Student earning"  # positive, student side
        SPEND   = "spend",   "Business spend"    # positive, business side (price + fee)
        FEE     = "fee",     "Platform fee"       # platform revenue record

    user       = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="ledger_entries")
    engagement = models.ForeignKey("engagements.Engagement", on_delete=models.SET_NULL, null=True, blank=True, related_name="ledger_entries")
    kind       = models.CharField(max_length=10, choices=Kind.choices)
    amount     = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} {self.kind} {self.amount}"
