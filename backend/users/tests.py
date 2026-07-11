from unittest import mock

from django.core import mail, signing
from django.test import TestCase, override_settings

from .models import SMEProfile, StudentProfile, User
from .services import (
    EMAIL_VERIFY_SALT,
    confirm_email_verification,
    issue_email_verification,
    login_with_google,
    vet_student,
    verify_sme,
)


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


class EmailVerificationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="student1", password="x", role="student", email="s1@siswa.um.edu.my"
        )

    def test_issue_sends_email_with_link(self):
        issue_email_verification(self.user)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("/auth/verify?token=", mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].to, ["s1@siswa.um.edu.my"])

    def test_issue_skips_blank_email(self):
        self.user.email = ""
        self.user.save()
        issue_email_verification(self.user)
        self.assertEqual(len(mail.outbox), 0)

    def test_confirm_roundtrip(self):
        token = signing.dumps({"uid": self.user.pk}, salt=EMAIL_VERIFY_SALT)
        user = confirm_email_verification(token)
        self.assertTrue(user.is_verified)

    def test_confirm_rejects_garbage(self):
        with self.assertRaises(ValueError):
            confirm_email_verification("not-a-token")

    def test_confirm_rejects_wrong_salt(self):
        token = signing.dumps({"uid": self.user.pk}, salt="other-salt")
        with self.assertRaises(ValueError):
            confirm_email_verification(token)


@override_settings(GOOGLE_CLIENT_ID="test-client-id")
class GoogleLoginTests(TestCase):
    CLAIMS = {"email": "aisyah@gmail.com", "email_verified": True}

    def test_not_configured(self):
        with override_settings(GOOGLE_CLIENT_ID=""):
            with self.assertRaisesMessage(ValueError, "not configured"):
                login_with_google("tok")

    @mock.patch("users.services._verify_google_token", return_value=CLAIMS)
    def test_new_user_requires_role(self, _):
        with self.assertRaisesMessage(ValueError, "Choose a role"):
            login_with_google("tok")

    @mock.patch("users.services._verify_google_token", return_value=CLAIMS)
    def test_new_user_created_with_profile(self, _):
        user = login_with_google("tok", role="student")
        self.assertEqual(user.email, "aisyah@gmail.com")
        self.assertEqual(user.role, "student")
        self.assertTrue(user.is_verified)
        self.assertFalse(user.has_usable_password())
        self.assertTrue(StudentProfile.objects.filter(user=user).exists())

    @mock.patch("users.services._verify_google_token", return_value=CLAIMS)
    def test_existing_user_logs_in_without_role(self, _):
        existing = User.objects.create_user(
            username="aisyah", password="x", role="student", email="aisyah@gmail.com"
        )
        user = login_with_google("tok")
        self.assertEqual(user.pk, existing.pk)
        self.assertEqual(User.objects.filter(email__iexact="aisyah@gmail.com").count(), 1)

    @mock.patch(
        "users.services._verify_google_token",
        return_value={"email": "x@gmail.com", "email_verified": False},
    )
    def test_unverified_google_email_rejected(self, _):
        with self.assertRaises(ValueError):
            login_with_google("tok", role="student")

    @mock.patch("users.services._verify_google_token", return_value=CLAIMS)
    def test_username_collision_gets_suffix(self, _):
        User.objects.create_user(username="aisyah", password="x", role="sme", email="other@x.my")
        user = login_with_google("tok", role="student")
        self.assertEqual(user.username, "aisyah2")


class ResumeParserTests(TestCase):
    SAMPLE = (
        "Daniel Lim\n"
        "daniel@siswa.um.edu.my · linkedin.com/in/daniel-lim · https://daniellim.dev\n\n"
        "Final-year computer science student at Sunway University with a passion for "
        "building clean web interfaces and data-driven products for Malaysian SMEs.\n\n"
        "EDUCATION\n"
        "Sunway University — BSc Computer Science, expected graduation 2028\n\n"
        "SKILLS\n"
        "React, TypeScript, Python, Figma, SEO\n\n"
        "LANGUAGES\n"
        "English, Bahasa Melayu, Mandarin\n"
    )

    def test_extracts_university(self):
        from .services import parse_resume_text

        s = parse_resume_text(self.SAMPLE)
        self.assertIn("Sunway University", s["university"])

    def test_extracts_graduation_year(self):
        from .services import parse_resume_text

        self.assertEqual(parse_resume_text(self.SAMPLE)["graduation_year"], 2028)

    def test_extracts_skills(self):
        from .services import parse_resume_text

        skills = parse_resume_text(self.SAMPLE)["skills"]
        for expected in ("React", "TypeScript", "Python", "Figma", "SEO"):
            self.assertIn(expected, skills)

    def test_extracts_languages(self):
        from .services import parse_resume_text

        langs = parse_resume_text(self.SAMPLE)["languages"]
        self.assertIn("EN", langs)
        self.assertIn("BM", langs)
        self.assertIn("中文", langs)

    def test_extracts_linkedin_and_portfolio(self):
        from .services import parse_resume_text

        s = parse_resume_text(self.SAMPLE)
        self.assertEqual(s["linkedin_url"], "https://linkedin.com/in/daniel-lim")
        self.assertEqual(s["portfolio_url"], "https://daniellim.dev")

    def test_extracts_bio_paragraph(self):
        from .services import parse_resume_text

        self.assertIn("Final-year computer science student", parse_resume_text(self.SAMPLE)["bio"])

    def test_empty_text_returns_empty_dict(self):
        from .services import parse_resume_text

        self.assertEqual(parse_resume_text(""), {})
