from django.db import models


class Engagement(models.Model):
    """One thread = one working relationship between an SME and a student,
    optionally tied to a specific Project (task posting). The Office screen's
    5-step tracker and the escrow state machine both hang off this model."""

    class Status(models.TextChoices):
        REACHED_OUT = "reached_out", "Reached out"
        AGREED      = "agreed",      "Agreed"
        IN_PROGRESS = "in_progress", "In progress"
        DELIVERED   = "delivered",   "Delivered"
        COMPLETED   = "completed",   "Completed"

    project      = models.ForeignKey("projects.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="engagements")
    sme          = models.ForeignKey("users.SMEProfile", on_delete=models.CASCADE, related_name="engagements")
    student      = models.ForeignKey("users.StudentProfile", on_delete=models.CASCADE, related_name="engagements")
    status       = models.CharField(max_length=20, choices=Status.choices, default=Status.REACHED_OUT)
    agreed_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student} ↔ {self.sme} [{self.status}]"


class Message(models.Model):
    engagement = models.ForeignKey(Engagement, on_delete=models.CASCADE, related_name="messages")
    sender     = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="messages_sent")
    text       = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender} @ {self.created_at:%Y-%m-%d %H:%M}"


class Attachment(models.Model):
    message       = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="attachments")
    file          = models.FileField(upload_to="engagement_files/%Y/%m/")
    original_name = models.CharField(max_length=255)
    size_bytes    = models.BigIntegerField()

    def __str__(self):
        return self.original_name
