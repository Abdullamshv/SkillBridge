from decimal import Decimal

from django.test import TestCase

from engagements.models import Engagement
from payments.models import Transaction
from payments.services import (
    calculate_business_total,
    calculate_fee,
    calculate_student_payout,
)
from users.models import SMEProfile, StudentProfile, User


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


class EscrowIntegrityTests(TestCase):
    """A Transaction can only be released once, and only from HELD."""

    def setUp(self):
        student_user = User.objects.create_user(username="student1", password="x", role="student")
        sme_user = User.objects.create_user(username="sme1", password="x", role="sme")
        student = StudentProfile.objects.create(
            user=student_user, university="UM", major="CS", graduation_year=2027,
        )
        sme = SMEProfile.objects.create(user=sme_user, company_name="Acme")
        engagement = Engagement.objects.create(sme=sme, student=student)
        self.tx = Transaction.objects.create(
            engagement=engagement, amount=Decimal("100.00"), platform_fee=Decimal("2.00"),
            status=Transaction.Status.HELD,
        )

    def test_pending_transaction_cannot_be_released(self):
        self.tx.status = Transaction.Status.PENDING
        self.tx.save()
        with self.assertRaises(Transaction.DoesNotExist):
            Transaction.objects.get(pk=self.tx.pk, status=Transaction.Status.HELD)

    def test_release_then_re_release_is_rejected(self):
        held = Transaction.objects.get(pk=self.tx.pk, status=Transaction.Status.HELD)
        held.status = Transaction.Status.RELEASED
        held.save()
        with self.assertRaises(Transaction.DoesNotExist):
            Transaction.objects.get(pk=self.tx.pk, status=Transaction.Status.HELD)
