import json
import re
from decimal import Decimal
from urllib import error, request

from django.conf import settings

from .models import PurchaseInvoice

_DIGIT_RE = re.compile(r"\D+")


def get_purchase_whatsapp_template_meta(status: str) -> tuple[str, str]:
    if status == PurchaseInvoice.Status.REQUEST:
        return (
            "*Purchase Order Request*",
            "Please confirm item availability and expected delivery time.",
        )

    if status == PurchaseInvoice.Status.CONFIRMED:
        return (
            "*Purchase Order Confirmed*",
            "This purchase order has been confirmed in our system.",
        )

    return (
        "*Purchase Order Update*",
        f"Current order status: {status}.",
    )


def normalize_whatsapp_phone(raw_phone: str, default_country_code: str = "") -> str:
    """
    Convert supplier phone into WhatsApp Cloud API target format (digits only, with country code).
    Example: +94 77 123 4567 -> 94771234567
    """
    if not raw_phone:
        return ""

    digits = _DIGIT_RE.sub("", raw_phone)
    if not digits:
        return ""

    cc = _DIGIT_RE.sub("", default_country_code or "")
    if cc:
        if digits.startswith(cc):
            return digits
        if digits.startswith("0"):
            return f"{cc}{digits[1:]}"

    return digits


def build_purchase_whatsapp_message(invoice: PurchaseInvoice) -> str:
    lines = list(invoice.lines.select_related("item").all().order_by("sort_order", "id"))
    supplier_name = invoice.supplier.name
    title, action_line = get_purchase_whatsapp_template_meta(invoice.status)

    header = [
        title,
        f"Supplier: {supplier_name}",
        f"PO Ref: #{invoice.id}",
        f"Date: {invoice.invoice_date}",
        f"Status: {invoice.status}",
        "",
        "Items:",
    ]

    body = []
    for line in lines:
        qty = Decimal(line.qty).quantize(Decimal("0.01"))
        unit_cost = Decimal(line.unit_cost).quantize(Decimal("0.01"))
        body.append(f"- {line.item.name}: {qty} x {unit_cost} = {line.line_total}")

    footer = [
        "",
        f"Subtotal: {invoice.subtotal}",
        f"Discount: {invoice.discount}",
        f"Tax: {invoice.tax}",
        f"Total: {invoice.total}",
    ]

    if invoice.note:
        footer.extend(["", f"Note: {invoice.note}"])

    footer.extend(["", action_line])

    return "\n".join(header + body + footer)


def send_whatsapp_text_message(to_phone: str, message_text: str) -> dict:
    """
    Send plain text via Meta WhatsApp Cloud API.
    Required settings:
    - WHATSAPP_ENABLED=true
    - WHATSAPP_API_BASE (default https://graph.facebook.com)
    - WHATSAPP_API_VERSION (default v21.0)
    - WHATSAPP_PHONE_NUMBER_ID
    - WHATSAPP_ACCESS_TOKEN
    """
    if not getattr(settings, "WHATSAPP_ENABLED", False):
        raise RuntimeError("WhatsApp integration is disabled.")

    phone_number_id = getattr(settings, "WHATSAPP_PHONE_NUMBER_ID", "")
    access_token = getattr(settings, "WHATSAPP_ACCESS_TOKEN", "")
    api_base = getattr(settings, "WHATSAPP_API_BASE", "https://graph.facebook.com")
    api_version = getattr(settings, "WHATSAPP_API_VERSION", "v21.0")

    if not phone_number_id or not access_token:
        raise RuntimeError("WhatsApp configuration missing in environment.")

    url = f"{api_base}/{api_version}/{phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone,
        "type": "text",
        "text": {"preview_url": False, "body": message_text},
    }

    req = request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
    )

    try:
        with request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {"ok": True}
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"WhatsApp API error ({exc.code}): {detail}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"WhatsApp API connection failed: {exc.reason}") from exc
