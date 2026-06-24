from django.db import models


class Transaction(models.Model):
    class Status(models.TextChoices):
        PENDING  = "pending",  "Pending"
        HELD     = "held",     "Held"
        RELEASED = "released", "Released"
        REFUNDED = "refunded", "Refunded"
        FAILED   = "failed",   "Failed"

    project           = models.OneToOneField("projects.Project", on_delete=models.PROTECT, related_name="transaction")
    amount            = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee      = models.DecimalField(max_digits=10, decimal_places=2)
    status            = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    payment_reference = models.CharField(max_length=200, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Transaction #{self.pk} — {self.project.title} [{self.status}]"
