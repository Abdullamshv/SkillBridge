import os

from django.core import signing
from django.http import Http404, HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_POST

from .gateway import DEV_CHECKOUT_SALT, GatewayError, get_gateway
from .models import Transaction
from .services import confirm_escrow_funding, fail_escrow_funding

DEV_CHECKOUT_TEMPLATE = """<!doctype html>
<html><head><meta charset="utf-8"><title>SkillBridge — Dev Checkout</title>
<style>
  body {{ font-family: -apple-system, sans-serif; background: #F7F9FC; color: #17151F;
         display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
  .card {{ background: #fff; border-radius: 24px; padding: 40px; max-width: 420px; width: 100%;
           box-shadow: 0 4px 20px rgba(78,63,227,.07); text-align: center; }}
  .logo {{ width: 44px; height: 44px; border-radius: 12px; margin: 0 auto 16px;
           background: linear-gradient(135deg,#4E3FE3,#7B62F2); color: #fff;
           font-weight: 800; font-size: 22px; line-height: 44px; }}
  h1 {{ font-size: 20px; margin: 0 0 4px; }}
  p {{ color: #6B7280; font-size: 14px; margin: 4px 0; }}
  .amount {{ font-size: 32px; font-weight: 800; color: #4E3FE3; margin: 16px 0 2px; }}
  .row {{ display: flex; justify-content: space-between; font-size: 13px; color: #6B7280;
          border-top: 1px solid #E7E5F2; padding-top: 10px; margin-top: 14px; }}
  button {{ border: 0; border-radius: 999px; padding: 12px 24px; font-size: 14px; font-weight: 700;
            cursor: pointer; width: 100%; margin-top: 10px; }}
  .pay {{ background: #4E3FE3; color: #fff; }}
  .fail {{ background: #fff; color: #C0392B; border: 1px solid #E7E5F2; }}
  .note {{ font-size: 11px; color: #A5A2B8; margin-top: 16px; }}
</style></head><body>
<div class="card">
  <div class="logo">S</div>
  <h1>Dev checkout</h1>
  <p>{description}</p>
  <div class="amount">RM {total}</div>
  <p>task RM {amount} + 2% fee RM {fee}</p>
  <form method="post">
    <input type="hidden" name="sig" value="{sig}">
    <button class="pay" name="outcome" value="success">Simulate successful payment</button>
    <button class="fail" name="outcome" value="failure">Simulate failure</button>
  </form>
  <div class="row"><span>Gateway</span><span>dev simulator — no real money</span></div>
  <p class="note">This page stands in for Billplz. Set PAYMENT_GATEWAY=billplz + keys to use the real sandbox.</p>
</div>
</body></html>"""


def _require_dev_gateway():
    if os.environ.get("PAYMENT_GATEWAY", "dev").lower() != "dev":
        raise Http404


def _check_dev_signature(request, tx_id: int):
    sig = request.GET.get("sig") or request.POST.get("sig") or ""
    try:
        payload = signing.loads(sig, salt=DEV_CHECKOUT_SALT, max_age=24 * 3600)
    except signing.BadSignature:
        return None
    return sig if payload.get("tx") == tx_id else None


@csrf_exempt  # the signed `sig` token is the auth here, same posture as /graphql/
@require_http_methods(["GET", "POST"])
def dev_checkout(request, tx_id: int):
    """Local stand-in for the gateway's hosted checkout page."""
    _require_dev_gateway()
    sig = _check_dev_signature(request, tx_id)
    if sig is None:
        return JsonResponse({"error": "Invalid or expired checkout link"}, status=403)
    tx = get_object_or_404(
        Transaction.objects.select_related("engagement", "engagement__project"), pk=tx_id
    )

    if request.method == "POST":
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        try:
            if request.POST.get("outcome") == "success":
                confirm_escrow_funding(tx, payment_reference=f"DEV-{tx.pk}")
            else:
                fail_escrow_funding(tx)
        except ValueError as exc:
            return JsonResponse({"error": str(exc)}, status=400)
        return HttpResponseRedirect(f"{frontend_url}/office")

    title = tx.engagement.project.title if tx.engagement.project_id else "Direct engagement"
    return HttpResponse(DEV_CHECKOUT_TEMPLATE.format(
        description=f"Escrow for “{title}”",
        total=tx.amount + tx.platform_fee,
        amount=tx.amount,
        fee=tx.platform_fee,
        sig=sig,
    ))


@csrf_exempt  # gateway servers can't send CSRF tokens; the X-Signature is the auth
@require_POST
def payment_webhook(request):
    """Gateway callback: verify the signature, then confirm the matching
    PENDING transaction. Idempotent — retries are normal webhook behaviour."""
    gateway = get_gateway()
    try:
        reference = gateway.verify_webhook(request)
    except GatewayError as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    if gateway.name == "billplz":
        tx = Transaction.objects.filter(payment_reference=reference).first()
        if tx is None:  # fall back to our reference_1 passthrough
            tx_id = request.POST.get("reference_1", "")
            tx = Transaction.objects.filter(pk=tx_id).first() if tx_id.isdigit() else None
    else:
        tx = Transaction.objects.filter(pk=reference.removeprefix("DEV-")).first()
    if tx is None:
        return JsonResponse({"error": "Unknown transaction"}, status=404)

    try:
        confirm_escrow_funding(tx, payment_reference=reference)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=409)
    return JsonResponse({"ok": True})
