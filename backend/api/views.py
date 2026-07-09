from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

# Dev cap — production should switch to presigned S3/R2 uploads for anything
# approaching the product's 2 GB limit (see README) rather than raising this.
MAX_UPLOAD_BYTES = 50 * 1024 * 1024


@csrf_exempt  # session-authenticated + participant-checked, same posture as /graphql/
@require_POST
def upload_attachment(request, engagement_id: int):
    from engagements.models import Attachment, Engagement, Message

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=403)

    try:
        engagement = Engagement.objects.select_related("sme", "student").get(pk=engagement_id)
    except Engagement.DoesNotExist:
        return JsonResponse({"error": "Engagement not found"}, status=404)
    if request.user.id not in (engagement.sme.user_id, engagement.student.user_id):
        return JsonResponse({"error": "Not a participant in this engagement"}, status=403)

    upload = request.FILES.get("file")
    if upload is None:
        return JsonResponse({"error": "No file provided"}, status=400)
    if upload.size > MAX_UPLOAD_BYTES:
        return JsonResponse(
            {"error": f"File exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB dev upload limit"},
            status=400,
        )

    message = Message.objects.create(
        engagement=engagement,
        sender=request.user,
        text=request.POST.get("text", ""),
    )
    Attachment.objects.create(
        message=message,
        file=upload,
        original_name=upload.name,
        size_bytes=upload.size,
    )
    return JsonResponse({"ok": True, "messageId": message.id})
