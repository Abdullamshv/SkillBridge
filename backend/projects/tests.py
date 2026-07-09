from decimal import Decimal

from django.test import TestCase

from engagements.models import Engagement
from projects.models import Review
from projects.services import submit_review
from users.models import SMEProfile, StudentProfile, User


class ReviewSubmissionTests(TestCase):
    def setUp(self):
        self.student_user = User.objects.create_user(username="student1", password="x", role="student")
        self.sme_user = User.objects.create_user(username="sme1", password="x", role="sme")
        self.outsider = User.objects.create_user(username="other", password="x", role="student")
        self.student = StudentProfile.objects.create(
            user=self.student_user, university="UM", major="CS", graduation_year=2027,
        )
        StudentProfile.objects.create(
            user=self.outsider, university="UKM", major="Law", graduation_year=2027,
        )
        self.sme = SMEProfile.objects.create(user=self.sme_user, company_name="Acme")
        self.engagement = Engagement.objects.create(
            sme=self.sme, student=self.student,
            status=Engagement.Status.COMPLETED, agreed_price=Decimal("100.00"),
        )

    def test_non_participant_rejected(self):
        with self.assertRaises(PermissionError):
            submit_review(self.engagement, self.outsider, 5, "great")

    def test_only_after_completion(self):
        self.engagement.status = Engagement.Status.DELIVERED
        self.engagement.save()
        with self.assertRaises(ValueError):
            submit_review(self.engagement, self.sme_user, 5, "great")

    def test_rating_bounds(self):
        for bad in (0, 6):
            with self.assertRaises(ValueError):
                submit_review(self.engagement, self.sme_user, bad, "x")

    def test_business_reviews_student_and_aggregates_update(self):
        submit_review(self.engagement, self.sme_user, 4, "solid work")
        self.student.refresh_from_db()
        self.assertEqual(self.student.rating, Decimal("4.00"))
        self.assertEqual(self.student.rating_count, 1)
        review = Review.objects.get(engagement=self.engagement, reviewer=self.sme_user)
        self.assertEqual(review.reviewee, self.student_user)

    def test_student_reviews_business_and_aggregates_update(self):
        submit_review(self.engagement, self.student_user, 5, "paid on time")
        self.sme.refresh_from_db()
        self.assertEqual(self.sme.rating, Decimal("5.00"))
        self.assertEqual(self.sme.rating_count, 1)

    def test_each_side_reviews_once(self):
        submit_review(self.engagement, self.sme_user, 5, "a")
        submit_review(self.engagement, self.student_user, 4, "b")  # other side OK
        with self.assertRaises(ValueError):
            submit_review(self.engagement, self.sme_user, 3, "again")
        self.assertEqual(Review.objects.filter(engagement=self.engagement).count(), 2)
