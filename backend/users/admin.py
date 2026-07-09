from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import SMEProfile, StudentProfile, User


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
    actions       = ["mark_vetted"]

    @admin.action(description="Mark selected students as campus-vetted")
    def mark_vetted(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_vetted=True, vetted_at=timezone.now(), vetted_by=request.user)


@admin.register(SMEProfile)
class SMEProfileAdmin(admin.ModelAdmin):
    list_display  = ("company_name", "user", "industry", "is_verified", "rating", "rating_count")
    list_filter   = ("industry", "is_verified")
    search_fields = ("company_name", "user__username")
    actions       = ["verify_companies"]

    @admin.action(description="Mark selected companies as verified")
    def verify_companies(self, request, queryset):
        queryset.update(is_verified=True)
