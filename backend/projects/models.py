from django.db import models


class Project(models.Model):
    class Status(models.TextChoices):
        OPEN        = "open",        "Open"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED   = "completed",   "Completed"
        CANCELLED   = "cancelled",   "Cancelled"
        DISPUTED    = "disputed",    "Disputed"

    class Category(models.TextChoices):
        DESIGN      = "design",      "Design"
        COPYWRITING = "copywriting", "Copywriting"
        DEVELOPMENT = "development", "Development"
        MARKETING   = "marketing",   "Marketing"
        OTHER       = "other",       "Other"

    sme              = models.ForeignKey("users.SMEProfile", on_delete=models.CASCADE, related_name="projects")
    assigned_student = models.ForeignKey("users.StudentProfile", on_delete=models.SET_NULL, null=True, blank=True, related_name="active_projects")
    title            = models.CharField(max_length=300)
    description      = models.TextField()
    category         = models.CharField(max_length=20, choices=Category.choices)
    budget           = models.DecimalField(max_digits=10, decimal_places=2)
    deadline         = models.DateField()
    status           = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} [{self.status}]"


class Proposal(models.Model):
    class Status(models.TextChoices):
        PENDING  = "pending",  "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"

    project         = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="proposals")
    student         = models.ForeignKey("users.StudentProfile", on_delete=models.CASCADE, related_name="proposals")
    cover_letter    = models.TextField()
    proposed_budget = models.DecimalField(max_digits=10, decimal_places=2)
    proposed_days   = models.PositiveSmallIntegerField()
    status          = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "student")

    def __str__(self):
        return f"{self.student} → {self.project.title} [{self.status}]"


class Review(models.Model):
    project    = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="reviews")
    reviewer   = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="reviews_given")
    reviewee   = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="reviews_received")
    rating     = models.PositiveSmallIntegerField()
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "reviewer")

    def __str__(self):
        return f"{self.reviewer} → {self.reviewee} ({self.rating}★)"
