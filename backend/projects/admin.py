from django.contrib import admin

from .models import Project, Proposal, Review


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display  = ("title", "sme", "category", "budget", "deadline", "status", "created_at")
    list_filter   = ("status", "category")
    search_fields = ("title", "sme__company_name")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display  = ("student", "project", "proposed_budget", "proposed_days", "status", "created_at")
    list_filter   = ("status",)
    search_fields = ("student__user__username", "project__title")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ("reviewer", "reviewee", "project", "rating", "created_at")
    list_filter   = ("rating",)
    search_fields = ("reviewer__username", "reviewee__username")
