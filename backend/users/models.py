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
    class Category(models.TextChoices):
        DESIGN       = "Design",       "Design"
        WRITING      = "Writing",      "Writing"
        SOCIAL_MEDIA = "Social Media", "Social Media"
        WEB          = "Web",          "Web"
        DATA         = "Data",         "Data"
        VIDEO        = "Video",        "Video"

    class Availability(models.TextChoices):
        NOW  = "now",  "Available now"
        FROM = "from", "From a date"

    user            = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    university      = models.CharField(max_length=200, blank=True, default="")
    major           = models.CharField(max_length=200, blank=True, default="")
    graduation_year = models.PositiveSmallIntegerField(default=0)
    primary_category = models.CharField(max_length=20, choices=Category.choices, blank=True)
    skills          = models.JSONField(default=list)
    bio             = models.TextField(blank=True)
    portfolio_url   = models.URLField(blank=True)
    languages       = models.CharField(max_length=120, blank=True)  # "BM · EN"
    price_low       = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    price_high      = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    availability_status = models.CharField(max_length=10, choices=Availability.choices, default=Availability.NOW)
    available_from  = models.DateField(null=True, blank=True)
    rating          = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    rating_count    = models.PositiveIntegerField(default=0)

    # vetting — manual admin workflow only, this is the product's moat
    is_vetted  = models.BooleanField(default=False)
    vetted_at  = models.DateTimeField(null=True, blank=True)
    vetted_by  = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    def __str__(self):
        return f"{self.user.username} — {self.university}"


class SMEProfile(models.Model):
    user         = models.OneToOneField(User, on_delete=models.CASCADE, related_name="sme_profile")
    company_name = models.CharField(max_length=200, blank=True, default="")
    industry     = models.CharField(max_length=100, blank=True, default="")
    location     = models.CharField(max_length=100, blank=True)  # "Kuala Lumpur", "Shah Alam"...
    website      = models.URLField(blank=True)
    description  = models.TextField(blank=True)

    # SSM = Suruhanjaya Syarikat Malaysia (Companies Commission of Malaysia)
    ssm_number   = models.CharField(max_length=30, blank=True)
    is_verified  = models.BooleanField(default=False)
    rating       = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    rating_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.company_name
