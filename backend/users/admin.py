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
    list_display  = ("user", "university", "major", "graduation_year", "rating", "rating_count")
    list_filter   = ("university",)
    search_fields = ("user__username", "university", "major")


@admin.register(SMEProfile)
class SMEProfileAdmin(admin.ModelAdmin):
    list_display  = ("company_name", "user", "industry", "is_verified", "rating", "rating_count")
    list_filter   = ("industry", "is_verified")
    search_fields = ("company_name", "user__username")
    actions       = ["verify_companies"]

    @admin.action(description="Mark selected companies as verified")
    def verify_companies(self, request, queryset):
        queryset.update(is_verified=True)
