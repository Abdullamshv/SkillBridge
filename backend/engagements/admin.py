from django.contrib import admin

from .models import Attachment, Engagement, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("sender", "text", "created_at")


@admin.register(Engagement)
class EngagementAdmin(admin.ModelAdmin):
    list_display  = ("student", "sme", "project", "status", "agreed_price", "updated_at")
    list_filter   = ("status",)
    search_fields = ("student__user__username", "sme__company_name", "project__title")
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ("engagement", "sender", "created_at")
    search_fields = ("sender__username",)


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("original_name", "message", "size_bytes")
