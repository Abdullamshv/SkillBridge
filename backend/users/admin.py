from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin

from .models import SMEProfile, StudentProfile, User
from .services import vet_student, verify_sme


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display  = ("username", "email", "role", "is_verified", "is_active", "created_at")
    list_filter   = ("role", "is_verified", "is_active")
    search_fields = ("username", "email", "phone")
    fieldsets     = UserAdmin.fieldsets + (
        ("SkillBridge", {"fields": ("role", "phone", "is_verified", "avatar")}),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display  = ("user", "university", "major", "graduation_year", "is_vetted", "rating", "rating_count")
    list_filter   = ("university", "is_vetted", "primary_category")
    search_fields = ("user__username", "university", "major")
    actions       = ["mark_vetted", "remove_vetting"]

    @admin.action(description="Mark selected students as campus-vetted")
    def mark_vetted(self, request, queryset):
        for profile in queryset:
            vet_student(profile, request.user)

    @admin.action(description="Remove campus-vetting from selected students")
    def remove_vetting(self, request, queryset):
        for profile in queryset:
            vet_student(profile, request.user, vetted=False)


@admin.register(SMEProfile)
class SMEProfileAdmin(admin.ModelAdmin):
    list_display  = ("company_name", "user", "industry", "ssm_number", "is_verified", "rating", "rating_count")
    list_filter   = ("industry", "is_verified")
    search_fields = ("company_name", "user__username", "ssm_number")
    actions       = ["verify_companies", "unverify_companies"]

    @admin.action(description="Mark selected companies as SSM-verified")
    def verify_companies(self, request, queryset):
        skipped = []
        for profile in queryset:
            try:
                verify_sme(profile, request.user)
            except ValueError:
                skipped.append(profile.company_name or profile.user.username)
        if skipped:
            self.message_user(
                request,
                f"Skipped (no SSM number on file): {', '.join(skipped)}",
                level=messages.WARNING,
            )

    @admin.action(description="Remove SSM verification from selected companies")
    def unverify_companies(self, request, queryset):
        for profile in queryset:
            verify_sme(profile, request.user, verified=False)
