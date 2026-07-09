from django.test import TestCase

from engagements.models import Engagement
from engagements.services import advance_status
from users.models import SMEProfile, StudentProfile, User


class EngagementTransitionTests(TestCase):
    def setUp(self):
        student_user = User.objects.create_user(username="student1", password="x", role="student")
        sme_user = User.objects.create_user(username="sme1", password="x", role="sme")
        admin_user = User.objects.create_user(username="admin1", password="x", role="admin")
        self.student = StudentProfile.objects.create(
            user=student_user, university="UM", major="CS", graduation_year=2027,
        )
        self.sme = SMEProfile.objects.create(user=sme_user, company_name="Acme")
        self.student_user = student_user
        self.sme_user = sme_user
        self.admin_user = admin_user
        self.engagement = Engagement.objects.create(sme=self.sme, student=self.student)

    def test_valid_transition_succeeds(self):
        advance_status(self.engagement, Engagement.Status.AGREED, self.sme_user)
        self.assertEqual(self.engagement.status, Engagement.Status.AGREED)

    def test_skipping_a_step_is_rejected(self):
        with self.assertRaises(ValueError):
            advance_status(self.engagement, Engagement.Status.IN_PROGRESS, self.sme_user)

    def test_moving_backwards_is_rejected(self):
        advance_status(self.engagement, Engagement.Status.AGREED, self.sme_user)
        with self.assertRaises(ValueError):
            advance_status(self.engagement, Engagement.Status.REACHED_OUT, self.sme_user)

    def test_only_sme_or_admin_can_complete(self):
        advance_status(self.engagement, Engagement.Status.AGREED, self.sme_user)
        advance_status(self.engagement, Engagement.Status.IN_PROGRESS, self.sme_user)
        advance_status(self.engagement, Engagement.Status.DELIVERED, self.student_user)
        with self.assertRaises(PermissionError):
            advance_status(self.engagement, Engagement.Status.COMPLETED, self.student_user)

    def test_sme_can_complete(self):
        advance_status(self.engagement, Engagement.Status.AGREED, self.sme_user)
        advance_status(self.engagement, Engagement.Status.IN_PROGRESS, self.sme_user)
        advance_status(self.engagement, Engagement.Status.DELIVERED, self.student_user)
        advance_status(self.engagement, Engagement.Status.COMPLETED, self.sme_user)
        self.assertEqual(self.engagement.status, Engagement.Status.COMPLETED)

    def test_admin_can_complete(self):
        advance_status(self.engagement, Engagement.Status.AGREED, self.sme_user)
        advance_status(self.engagement, Engagement.Status.IN_PROGRESS, self.sme_user)
        advance_status(self.engagement, Engagement.Status.DELIVERED, self.student_user)
        advance_status(self.engagement, Engagement.Status.COMPLETED, self.admin_user)
        self.assertEqual(self.engagement.status, Engagement.Status.COMPLETED)
