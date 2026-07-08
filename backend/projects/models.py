from django.db import models


class Project(models.Model):
    """A fixed-price task posted by an SME. Students reach out directly (see the
    `engagements` app) rather than bidding — the price on a Project is what the
    student gets paid, not a starting point for negotiation."""

    class Status(models.TextChoices):
        OPEN        = "open",        "Open"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED   = "completed",   "Completed"
        CANCELLED   = "cancelled",   "Cancelled"
        DISPUTED    = "disputed",    "Disputed"

    class Category(models.TextChoices):
        GRAPHIC_DESIGN   = "graphic_design",   "Graphic Design"
        CONTENT_WRITING  = "content_writing",  "Content Writing"
        SOCIAL_MEDIA     = "social_media",     "Social Media"
        WEB_DEV          = "web_dev",          "Web Dev"
        DATA             = "data",             "Data"

    sme              = models.ForeignKey("users.SMEProfile", on_delete=models.CASCADE, related_name="projects")
    assigned_student = models.ForeignKey("users.StudentProfile", on_delete=models.SET_NULL, null=True, blank=True, related_name="active_projects")
    title            = models.CharField(max_length=300)
    description      = models.TextField()
    description_extra = models.TextField(blank=True)
    category         = models.CharField(max_length=20, choices=Category.choices)
    budget           = models.DecimalField(max_digits=10, decimal_places=2)  # fixed price, paid to student
    deadline         = models.DateField()
    status           = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    required_skills  = models.JSONField(default=list)      # list[str]
    looking_for_bullets = models.JSONField(default=list)   # list[str]
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} [{self.status}]"


class ProjectMilestone(models.Model):
    project  = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="milestones")
    label    = models.CharField(max_length=120)
    note     = models.CharField(max_length=200, blank=True)
    due_date = models.DateField()
    order    = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.project.title} — {self.label}"


class SavedTask(models.Model):
    student    = models.ForeignKey("users.StudentProfile", on_delete=models.CASCADE, related_name="saved_tasks")
    project    = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="saved_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "project")


class SavedStudent(models.Model):
    sme        = models.ForeignKey("users.SMEProfile", on_delete=models.CASCADE, related_name="saved_students")
    student    = models.ForeignKey("users.StudentProfile", on_delete=models.CASCADE, related_name="saved_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("sme", "student")


class Review(models.Model):
    project    = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="reviews", null=True, blank=True)
    reviewer   = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="reviews_given")
    reviewee   = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="reviews_received")
    rating     = models.PositiveSmallIntegerField()
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "reviewer", "reviewee")

    def __str__(self):
        return f"{self.reviewer} → {self.reviewee} ({self.rating}★)"
