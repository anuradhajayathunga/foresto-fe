from decimal import Decimal
from smtplib import SMTPException

from django.conf import settings
from django.core.mail import send_mail

from .models import PurchaseInvoice


def get_purchase_email_template_meta(status: str) -> tuple[str, str]:
    if status == PurchaseInvoice.Status.REQUEST:
        return (
            "Purchase Order Request",
            "Please confirm item availability and expected delivery time.",
        )

    if status == PurchaseInvoice.Status.CONFIRMED:
        return (
            "Purchase Order Confirmed",
            "This purchase order has been confirmed in our system.",
        )

    return (
        "Purchase Order Update",
        f"Current order status: {status}.",
    )


def build_purchase_email_subject(invoice: PurchaseInvoice) -> str:
    title, _ = get_purchase_email_template_meta(invoice.status)
    return f"{title} - PO #{invoice.id}"


def build_purchase_email_body(invoice: PurchaseInvoice) -> str:
    lines = list(invoice.lines.select_related("item").all().order_by("sort_order", "id"))
    supplier_name = invoice.supplier.name
    _, action_line = get_purchase_email_template_meta(invoice.status)

    header = [
        "Purchase Order",
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


def send_purchase_order_email(to_email: str, subject: str, body: str) -> int:
    from_email = getattr(settings, "PURCHASE_EMAIL_FROM", "") or getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        "",
    )

    if not from_email:
        raise RuntimeError("Email sender is not configured.")

    try:
        return send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=[to_email],
            fail_silently=False,
        )
    except (SMTPException, OSError) as exc:
        raise RuntimeError(f"Email delivery failed: {exc}") from exc
