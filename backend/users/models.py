from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        SME     = "sme",     "SME"
        ADMIN   = "admin",   "Admin"

    role        = models.CharField(max_length=10, choices=Role.choices)
    phone       = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    avatar      = models.ImageField(upload_to="avatars/", blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class StudentProfile(models.Model):
    user            = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    university      = models.CharField(max_length=200)
    major           = models.CharField(max_length=200)
    graduation_year = models.PositiveSmallIntegerField()
    skills          = models.JSONField(default=list)
    bio             = models.TextField(blank=True)
    portfolio_url   = models.URLField(blank=True)
    rating          = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    rating_count    = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} — {self.university}"


class SMEProfile(models.Model):
    user         = models.OneToOneField(User, on_delete=models.CASCADE, related_name="sme_profile")
    company_name = models.CharField(max_length=200)
    industry     = models.CharField(max_length=100)
    website      = models.URLField(blank=True)
    description  = models.TextField(blank=True)
    is_verified  = models.BooleanField(default=False)
    rating       = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    rating_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.company_name
