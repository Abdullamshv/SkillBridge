from django.contrib import admin

from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display    = ("pk", "project", "amount", "platform_fee", "status", "created_at")
    list_filter     = ("status",)
    search_fields   = ("project__title", "payment_reference")
    readonly_fields = ("created_at", "updated_at")
