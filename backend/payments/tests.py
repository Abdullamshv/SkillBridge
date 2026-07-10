import datetime

from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from engagements.models import Engagement
from engagements.services import advance_status
from payments.models import LedgerEntry, Transaction
from payments.services import (
    approve_completion,
    calculate_business_total,
    calculate_fee,
    calculate_student_payout,
    confirm_escrow_funding,
    fail_escrow_funding,
    fund_escrow,
    initiate_escrow_funding,
    release_escrow,
    wallet_stats_for,
)
from projects.models import Project
from users.models import SMEProfile, StudentProfile, User


def make_parties():
    student_user = User.objects.create_user(username="student1", password="x", role="student")
    sme_user = User.objects.create_user(username="sme1", password="x", role="sme")
    student = StudentProfile.objects.create(
        user=student_user, university="UM", major="CS", graduation_year=2027,
    )
    sme = SMEProfile.objects.create(user=sme_user, company_name="Acme")
    return student_user, sme_user, student, sme


class FeeMathTests(TestCase):
    def test_flat_two_percent(self):
        self.assertEqual(calculate_fee(Decimal("100.00")), Decimal("2.00"))

    def test_rounds_half_up(self):
        # 12.345 -> fee 0.2469 -> rounds to 0.25
        self.assertEqual(calculate_fee(Decimal("12.345")), Decimal("0.25"))

    def test_small_price_rounding(self):
        self.assertEqual(calculate_fee(Decimal("0.50")), Decimal("0.01"))

    def test_zero_price(self):
        self.assertEqual(calculate_fee(Decimal("0")), Decimal("0.00"))

    def test_large_price(self):
        self.assertEqual(calculate_fee(Decimal("999999.99")), Decimal("20000.00"))

    def test_business_total_is_price_plus_fee(self):
        price = Decimal("350.00")
        self.assertEqual(
            calculate_business_total(price), price + calculate_fee(price)
        )

    def test_student_always_keeps_full_price(self):
        for price in (Decimal("0"), Decimal("280.00"), Decimal("1200.00")):
            self.assertEqual(calculate_student_payout(price), price)


class EscrowLifecycleTests(TestCase):
    def setUp(self):
        self.student_user, self.sme_user, self.student, self.sme = make_parties()
        self.project = Project.objects.create(
            sme=self.sme, title="Task", description="d",
            category=Project.Category.GRAPHIC_DESIGN,
            budget=Decimal("350.00"),
            deadline=timezone.now().date() + datetime.timedelta(days=7),
        )
        self.engagement = Engagement.objects.create(
            sme=self.sme, student=self.student, project=self.project,
            status=Engagement.Status.AGREED, agreed_price=Decimal("350.00"),
        )

    def test_fund_creates_held_tx_and_business_ledger_rows(self):
        tx = fund_escrow(self.engagement)
        self.assertEqual(tx.status, Transaction.Status.HELD)
        self.assertEqual(tx.amount, Decimal("350.00"))
        self.assertEqual(tx.platform_fee, Decimal("7.00"))

        spend = LedgerEntry.objects.get(user=self.sme_user, kind=LedgerEntry.Kind.SPEND)
        fee = LedgerEntry.objects.get(user=self.sme_user, kind=LedgerEntry.Kind.FEE)
        self.assertEqual(spend.amount, Decimal("357.00"))
        self.assertEqual(fee.amount, Decimal("7.00"))
        self.assertEqual(LedgerEntry.objects.count(), 2)  # no student earning yet

    def test_double_fund_rejected(self):
        fund_escrow(self.engagement)
        with self.assertRaises(ValueError):
            fund_escrow(self.engagement)

    def test_fund_falls_back_to_project_budget(self):
        self.engagement.agreed_price = None
        self.engagement.save()
        tx = fund_escrow(self.engagement)
        self.assertEqual(tx.amount, Decimal("350.00"))

    def test_approve_without_funding_rejected(self):
        advance_status(self.engagement, Engagement.Status.IN_PROGRESS, self.student_user)
        advance_status(self.engagement, Engagement.Status.DELIVERED, self.student_user)
        with self.assertRaises(ValueError):
            approve_completion(self.engagement, self.sme_user)
        self.engagement.refresh_from_db()
        self.assertEqual(self.engagement.status, Engagement.Status.DELIVERED)

    def test_full_lifecycle_releases_exactly_once(self):
        fund_escrow(self.engagement)
        advance_status(self.engagement, Engagement.Status.IN_PROGRESS, self.student_user)
        advance_status(self.engagement, Engagement.Status.DELIVERED, self.student_user)
        tx = approve_completion(self.engagement, self.sme_user)

        self.assertEqual(tx.status, Transaction.Status.RELEASED)
        self.engagement.refresh_from_db()
        self.assertEqual(self.engagement.status, Engagement.Status.COMPLETED)
        earning = LedgerEntry.objects.get(user=self.student_user, kind=LedgerEntry.Kind.EARNING)
        self.assertEqual(earning.amount, Decimal("350.00"))  # 100%, no fee

        with self.assertRaises(ValueError):
            approve_completion(self.engagement, self.sme_user)
        self.assertEqual(
            LedgerEntry.objects.filter(kind=LedgerEntry.Kind.EARNING).count(), 1
        )

    def test_release_requires_held(self):
        with self.assertRaises(Transaction.DoesNotExist):
            release_escrow(self.engagement)


class GatewayFundingTests(TestCase):
    """The redirect+webhook funding path used by real gateways (spec §11)."""

    def setUp(self):
        self.student_user, self.sme_user, self.student, self.sme = make_parties()
        self.engagement = Engagement.objects.create(
            sme=self.sme, student=self.student,
            status=Engagement.Status.AGREED, agreed_price=Decimal("100.00"),
        )

    def test_initiate_creates_pending_without_ledger(self):
        tx, checkout_url = initiate_escrow_funding(self.engagement)
        self.assertEqual(tx.status, Transaction.Status.PENDING)
        self.assertIn(f"/api/payments/dev-checkout/{tx.pk}/", checkout_url)
        self.assertEqual(LedgerEntry.objects.count(), 0)

    def test_confirm_moves_to_held_and_writes_ledger_once(self):
        tx, _ = initiate_escrow_funding(self.engagement)
        confirm_escrow_funding(tx, payment_reference="DEV-1")
        confirm_escrow_funding(tx, payment_reference="DEV-1")  # webhook retry
        tx.refresh_from_db()
        self.assertEqual(tx.status, Transaction.Status.HELD)
        self.assertEqual(LedgerEntry.objects.filter(kind=LedgerEntry.Kind.SPEND).count(), 1)
        self.assertEqual(LedgerEntry.objects.filter(kind=LedgerEntry.Kind.FEE).count(), 1)

    def test_fail_then_reinitiate_reuses_row(self):
        tx, _ = initiate_escrow_funding(self.engagement)
        fail_escrow_funding(tx)
        tx.refresh_from_db()
        self.assertEqual(tx.status, Transaction.Status.FAILED)

        tx2, _ = initiate_escrow_funding(self.engagement)
        self.assertEqual(tx2.pk, tx.pk)  # OneToOne row reused
        self.assertEqual(tx2.status, Transaction.Status.PENDING)
        self.assertEqual(Transaction.objects.count(), 1)

    def test_initiate_rejected_when_already_held(self):
        fund_escrow(self.engagement)
        with self.assertRaises(ValueError):
            initiate_escrow_funding(self.engagement)

    def test_approve_rejected_while_pending(self):
        initiate_escrow_funding(self.engagement)
        advance_status(self.engagement, Engagement.Status.IN_PROGRESS, self.student_user)
        advance_status(self.engagement, Engagement.Status.DELIVERED, self.student_user)
        with self.assertRaises(ValueError):
            approve_completion(self.engagement, self.sme_user)

    def test_fail_only_from_pending(self):
        tx, _ = initiate_escrow_funding(self.engagement)
        confirm_escrow_funding(tx)
        with self.assertRaises(ValueError):
            fail_escrow_funding(tx)


class DevCheckoutViewTests(TestCase):
    def setUp(self):
        self.student_user, self.sme_user, self.student, self.sme = make_parties()
        self.engagement = Engagement.objects.create(
            sme=self.sme, student=self.student,
            status=Engagement.Status.AGREED, agreed_price=Decimal("100.00"),
        )
        self.tx, self.checkout_url = initiate_escrow_funding(self.engagement)
        # strip scheme+host — Django test client wants the path
        self.path = self.checkout_url.split("localhost:8000")[1]

    def test_page_requires_valid_signature(self):
        res = self.client.get(f"/api/payments/dev-checkout/{self.tx.pk}/?sig=forged")
        self.assertEqual(res.status_code, 403)

    def test_page_renders_with_signature(self):
        res = self.client.get(self.path)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Simulate successful payment", res.content)

    def test_success_confirms_and_redirects(self):
        sig = self.path.split("sig=")[1]
        res = self.client.post(
            f"/api/payments/dev-checkout/{self.tx.pk}/",
            {"sig": sig, "outcome": "success"},
        )
        self.assertEqual(res.status_code, 302)
        self.tx.refresh_from_db()
        self.assertEqual(self.tx.status, Transaction.Status.HELD)
        self.assertEqual(LedgerEntry.objects.count(), 2)

    def test_failure_marks_failed(self):
        sig = self.path.split("sig=")[1]
        self.client.post(
            f"/api/payments/dev-checkout/{self.tx.pk}/",
            {"sig": sig, "outcome": "failure"},
        )
        self.tx.refresh_from_db()
        self.assertEqual(self.tx.status, Transaction.Status.FAILED)
        self.assertEqual(LedgerEntry.objects.count(), 0)


class BillplzSignatureTests(TestCase):
    def test_x_signature_math(self):
        import os
        from unittest import mock

        from payments.gateway import BillplzGateway

        env = {
            "BILLPLZ_API_KEY": "key",
            "BILLPLZ_COLLECTION_ID": "col",
            "BILLPLZ_XSIGNATURE_KEY": "secret",
        }
        with mock.patch.dict(os.environ, env):
            gw = BillplzGateway()
        # independent reference computation
        import hashlib
        import hmac as hmac_lib

        data = {"id": "abc123", "paid": "true", "amount": "10200"}
        source = "|".join(f"{k}{v}" for k, v in sorted(data.items()))
        expected = hmac_lib.new(b"secret", source.encode(), hashlib.sha256).hexdigest()
        self.assertEqual(gw.compute_x_signature({**data, "x_signature": "ignored"}), expected)


class WalletStatsTests(TestCase):
    def setUp(self):
        self.student_user, self.sme_user, self.student, self.sme = make_parties()
        self.engagement = Engagement.objects.create(
            sme=self.sme, student=self.student,
            status=Engagement.Status.AGREED, agreed_price=Decimal("100.00"),
        )
        fund_escrow(self.engagement)  # SPEND 102, FEE 2 this month, HELD 100

    def test_business_stats(self):
        stats = wallet_stats_for(self.sme_user)
        self.assertEqual(stats["this_month_total"], Decimal("102.00"))
        self.assertEqual(stats["fees_this_month"], Decimal("2.00"))
        self.assertEqual(stats["escrow_held"], Decimal("100.00"))
        self.assertEqual(stats["active_count"], 1)
        self.assertEqual(stats["active_total"], Decimal("100.00"))
        self.assertEqual(len(stats["months"]), 6)
        self.assertEqual(stats["months"][-1]["value"], Decimal("102.00"))

    def test_student_stats_before_and_after_release(self):
        stats = wallet_stats_for(self.student_user)
        self.assertEqual(stats["this_month_total"], Decimal("0.00"))
        self.assertEqual(stats["escrow_held"], Decimal("100.00"))

        advance_status(self.engagement, Engagement.Status.IN_PROGRESS, self.student_user)
        advance_status(self.engagement, Engagement.Status.DELIVERED, self.student_user)
        approve_completion(self.engagement, self.sme_user)

        stats = wallet_stats_for(self.student_user)
        self.assertEqual(stats["this_month_total"], Decimal("100.00"))
        self.assertEqual(stats["escrow_held"], Decimal("0.00"))
        self.assertEqual(stats["active_count"], 0)

    def test_old_entries_stay_out_of_this_month(self):
        old = LedgerEntry.objects.create(
            user=self.sme_user, kind=LedgerEntry.Kind.SPEND, amount=Decimal("999.00")
        )
        LedgerEntry.objects.filter(pk=old.pk).update(
            created_at=timezone.now() - datetime.timedelta(days=90)
        )
        stats = wallet_stats_for(self.sme_user)
        self.assertEqual(stats["this_month_total"], Decimal("102.00"))
