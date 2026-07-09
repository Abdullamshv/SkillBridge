import json

from django.test import TestCase

from users.models import SMEProfile, StudentProfile, User

VET_STUDENT = """
mutation ($id: ID!, $vetted: Boolean!) {
  vetStudent(studentId: $id, vetted: $vetted) { id isVetted vettedAt }
}
"""

VERIFY_SME = """
mutation ($id: ID!, $verified: Boolean!) {
  verifySme(smeId: $id, verified: $verified) { id isVerified }
}
"""

STUDENTS_QUERY = """
query ($vettedOnly: Boolean) {
  students(vettedOnly: $vettedOnly) { id isVetted }
}
"""


class GraphQLTestCase(TestCase):
    def gql(self, query, variables=None):
        response = self.client.post(
            "/graphql/",
            data=json.dumps({"query": query, "variables": variables or {}}),
            content_type="application/json",
        )
        return response.json()


class VettingMutationTests(GraphQLTestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username="admin1", password="x", role="admin")
        student_user = User.objects.create_user(username="student1", password="x", role="student")
        self.student = StudentProfile.objects.create(user=student_user)
        sme_user = User.objects.create_user(username="sme1", password="x", role="sme")
        self.sme = SMEProfile.objects.create(
            user=sme_user, company_name="Acme", ssm_number="SSM-123456"
        )

    def test_non_admin_cannot_vet(self):
        self.client.force_login(self.student.user)
        data = self.gql(VET_STUDENT, {"id": str(self.student.pk), "vetted": True})
        self.assertIn("Admin role required", str(data["errors"]))
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_vetted)

    def test_admin_can_vet_and_unvet(self):
        self.client.force_login(self.admin)
        data = self.gql(VET_STUDENT, {"id": str(self.student.pk), "vetted": True})
        self.assertNotIn("errors", data)
        self.assertTrue(data["data"]["vetStudent"]["isVetted"])
        self.assertIsNotNone(data["data"]["vetStudent"]["vettedAt"])

        data = self.gql(VET_STUDENT, {"id": str(self.student.pk), "vetted": False})
        self.assertFalse(data["data"]["vetStudent"]["isVetted"])
        self.assertIsNone(data["data"]["vetStudent"]["vettedAt"])

    def test_superuser_with_blank_role_counts_as_admin(self):
        # `createsuperuser` leaves role="" — IsAdmin must still let them in.
        superuser = User.objects.create_superuser(username="root", password="x", email="")
        self.assertEqual(superuser.role, "")
        self.client.force_login(superuser)
        data = self.gql(VET_STUDENT, {"id": str(self.student.pk), "vetted": True})
        self.assertNotIn("errors", data)
        self.assertTrue(data["data"]["vetStudent"]["isVetted"])

    def test_admin_can_verify_sme(self):
        self.client.force_login(self.admin)
        data = self.gql(VERIFY_SME, {"id": str(self.sme.pk), "verified": True})
        self.assertNotIn("errors", data)
        self.assertTrue(data["data"]["verifySme"]["isVerified"])

    def test_verify_sme_without_ssm_number_fails(self):
        self.sme.ssm_number = ""
        self.sme.save()
        self.client.force_login(self.admin)
        data = self.gql(VERIFY_SME, {"id": str(self.sme.pk), "verified": True})
        self.assertIn("SSM number", str(data["errors"]))
        self.sme.refresh_from_db()
        self.assertFalse(self.sme.is_verified)


class VettedOnlyFilterTests(GraphQLTestCase):
    def setUp(self):
        admin = User.objects.create_user(username="admin1", password="x", role="admin")
        for i, vetted in enumerate([True, True, False]):
            user = User.objects.create_user(
                username=f"student{i}", password="x", role="student"
            )
            profile = StudentProfile.objects.create(user=user)
            if vetted:
                from users.services import vet_student

                vet_student(profile, admin)

    def test_default_returns_everyone(self):
        data = self.gql(STUDENTS_QUERY, {"vettedOnly": None})
        self.assertEqual(len(data["data"]["students"]), 3)

    def test_vetted_only_filters(self):
        data = self.gql(STUDENTS_QUERY, {"vettedOnly": True})
        students = data["data"]["students"]
        self.assertEqual(len(students), 2)
        self.assertTrue(all(s["isVetted"] for s in students))
