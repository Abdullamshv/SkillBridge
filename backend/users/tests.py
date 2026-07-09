from django.test import TestCase

from .models import SMEProfile, StudentProfile, User
from .services import vet_student, verify_sme


def make_admin():
    return User.objects.create_user(username="admin1", password="x", role="admin")


class VetStudentTests(TestCase):
    def setUp(self):
        self.admin = make_admin()
        user = User.objects.create_user(username="student1", password="x", role="student")
        self.profile = StudentProfile.objects.create(user=user)

    def test_vet_sets_all_vetting_fields(self):
        vet_student(self.profile, self.admin)
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.is_vetted)
        self.assertIsNotNone(self.profile.vetted_at)
        self.assertEqual(self.profile.vetted_by, self.admin)

    def test_unvet_clears_all_vetting_fields(self):
        vet_student(self.profile, self.admin)
        vet_student(self.profile, self.admin, vetted=False)
        self.profile.refresh_from_db()
        self.assertFalse(self.profile.is_vetted)
        self.assertIsNone(self.profile.vetted_at)
        self.assertIsNone(self.profile.vetted_by)


class VerifySmeTests(TestCase):
    def setUp(self):
        self.admin = make_admin()
        user = User.objects.create_user(username="sme1", password="x", role="sme")
        self.profile = SMEProfile.objects.create(
            user=user, company_name="Acme", ssm_number="SSM-123456"
        )

    def test_verify_sets_flag(self):
        verify_sme(self.profile, self.admin)
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.is_verified)

    def test_unverify_clears_flag(self):
        verify_sme(self.profile, self.admin)
        verify_sme(self.profile, self.admin, verified=False)
        self.profile.refresh_from_db()
        self.assertFalse(self.profile.is_verified)

    def test_verify_requires_ssm_number(self):
        self.profile.ssm_number = ""
        self.profile.save()
        with self.assertRaises(ValueError):
            verify_sme(self.profile, self.admin)
        self.profile.refresh_from_db()
        self.assertFalse(self.profile.is_verified)

    def test_unverify_allowed_without_ssm_number(self):
        verify_sme(self.profile, self.admin)
        self.profile.ssm_number = ""
        self.profile.save()
        verify_sme(self.profile, self.admin, verified=False)
        self.profile.refresh_from_db()
        self.assertFalse(self.profile.is_verified)
