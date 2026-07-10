"""Payment-gateway abstraction (spec §11).

Real custody of funds stays with the licensed provider; SkillBridge only
tracks state on `Transaction`. Two drivers:

- DevGateway (default): no keys, no network. "Checkout" is a local page that
  posts back into the same confirm/fail path a real webhook would hit, so the
  whole redirect→pay→webhook shape is exercised end-to-end in dev.
- BillplzGateway: creates a bill via the Billplz v3 API (sandbox by default)
  and verifies webhook X-Signatures. Enabled with PAYMENT_GATEWAY=billplz +
  the BILLPLZ_* env vars.
"""

import hashlib
import hmac
import os

from django.core import signing

DEV_CHECKOUT_SALT = "payments.dev-checkout"


class GatewayError(Exception):
    pass


class DevGateway:
    name = "dev"

    def create_checkout(self, tx) -> str:
        backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
        sig = signing.dumps({"tx": tx.pk}, salt=DEV_CHECKOUT_SALT)
        return f"{backend_url}/api/payments/dev-checkout/{tx.pk}/?sig={sig}"

    def verify_webhook(self, request) -> str:
        # Dev "webhooks" arrive from our own checkout page with the same
        # signed token that gated the page itself.
        sig = request.POST.get("sig", "")
        try:
            payload = signing.loads(sig, salt=DEV_CHECKOUT_SALT, max_age=24 * 3600)
        except signing.BadSignature as exc:
            raise GatewayError("Invalid dev checkout signature") from exc
        return f"DEV-{payload['tx']}"


class BillplzGateway:
    name = "billplz"

    def __init__(self):
        self.api_key = os.environ.get("BILLPLZ_API_KEY", "")
        self.collection_id = os.environ.get("BILLPLZ_COLLECTION_ID", "")
        self.xsignature_key = os.environ.get("BILLPLZ_XSIGNATURE_KEY", "")
        self.base_url = os.environ.get("BILLPLZ_BASE_URL", "https://www.billplz-sandbox.com")
        if not (self.api_key and self.collection_id and self.xsignature_key):
            raise GatewayError(
                "Billplz gateway needs BILLPLZ_API_KEY, BILLPLZ_COLLECTION_ID "
                "and BILLPLZ_XSIGNATURE_KEY"
            )

    def create_checkout(self, tx) -> str:
        import requests

        engagement = tx.engagement
        business = engagement.sme.user
        backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        total_sen = int((tx.amount + tx.platform_fee) * 100)  # Billplz wants sen

        resp = requests.post(
            f"{self.base_url}/api/v3/bills",
            auth=(self.api_key, ""),
            data={
                "collection_id": self.collection_id,
                "email": business.email or "billing@skillbridge.test",
                "name": engagement.sme.company_name or business.username,
                "amount": total_sen,
                "description": f"SkillBridge escrow — engagement #{engagement.pk}",
                "callback_url": f"{backend_url}/api/payments/webhook/",
                "redirect_url": f"{frontend_url}/office",
                "reference_1_label": "transaction_id",
                "reference_1": str(tx.pk),
            },
            timeout=15,
        )
        if resp.status_code not in (200, 201):
            raise GatewayError(f"Billplz bill creation failed: {resp.status_code} {resp.text[:200]}")
        bill = resp.json()
        tx.payment_reference = bill["id"]
        tx.save(update_fields=["payment_reference", "updated_at"])
        return bill["url"]

    def compute_x_signature(self, data: dict) -> str:
        """Billplz X-Signature: HMAC-SHA256 over 'key1value1|key2value2|…'
        with keys sorted case-insensitively, excluding x_signature itself."""
        source = "|".join(
            f"{key}{value}"
            for key, value in sorted(data.items(), key=lambda kv: kv[0].lower())
            if key != "x_signature"
        )
        return hmac.new(
            self.xsignature_key.encode(), source.encode(), hashlib.sha256
        ).hexdigest()

    def verify_webhook(self, request) -> str:
        data = {k: v for k, v in request.POST.items()}
        provided = data.get("x_signature", "")
        if not hmac.compare_digest(self.compute_x_signature(data), provided):
            raise GatewayError("Invalid Billplz X-Signature")
        if data.get("paid") not in ("true", "True"):
            raise GatewayError("Bill is not paid")
        return data["id"]


def get_gateway():
    kind = os.environ.get("PAYMENT_GATEWAY", "dev").lower()
    if kind == "billplz":
        return BillplzGateway()
    return DevGateway()
