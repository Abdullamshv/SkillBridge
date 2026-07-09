from django.contrib import admin

from .models import LedgerEntry, Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display    = ("pk", "engagement", "amount", "platform_fee", "status", "created_at")
    list_filter     = ("status",)
    search_fields   = ("engagement__student__user__username", "engagement__sme__company_name", "payment_reference")
    readonly_fields = ("created_at", "updated_at")


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display  = ("user", "kind", "amount", "engagement", "created_at")
    list_filter   = ("kind",)
    search_fields = ("user__username",)
