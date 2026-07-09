from django.contrib import admin

from .models import Project, ProjectMilestone, Review, SavedStudent, SavedTask


class ProjectMilestoneInline(admin.TabularInline):
    model = ProjectMilestone
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display  = ("title", "sme", "category", "budget", "deadline", "status", "created_at")
    list_filter   = ("status", "category")
    search_fields = ("title", "sme__company_name")
    readonly_fields = ("created_at", "updated_at")
    inlines = [ProjectMilestoneInline]


@admin.register(SavedTask)
class SavedTaskAdmin(admin.ModelAdmin):
    list_display  = ("student", "project", "created_at")
    search_fields = ("student__user__username", "project__title")


@admin.register(SavedStudent)
class SavedStudentAdmin(admin.ModelAdmin):
    list_display  = ("sme", "student", "created_at")
    search_fields = ("sme__company_name", "student__user__username")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ("reviewer", "reviewee", "project", "rating", "created_at")
    list_filter   = ("rating",)
    search_fields = ("reviewer__username", "reviewee__username")
