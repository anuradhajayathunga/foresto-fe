from decimal import Decimal
from smtplib import SMTPException

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail
from django.template.loader import render_to_string

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


def build_purchase_email_html(invoice: PurchaseInvoice, custom_message: str = "") -> str:
    lines = list(invoice.lines.select_related("item").all().order_by("sort_order", "id"))
    title, action_line = get_purchase_email_template_meta(invoice.status)

    status_display = (
        invoice.get_status_display()
        if hasattr(invoice, "get_status_display")
        else invoice.status
    )

    context = {
        "title": title,
        "supplier_name": invoice.supplier.name,
        "invoice_id": invoice.id,
        "invoice_no": invoice.invoice_no,
        "invoice_date": invoice.invoice_date,
        "status": status_display,
        "lines": [
            {
                "item_name": line.item.name,
                "qty": Decimal(line.qty).quantize(Decimal("0.01")),
                "unit_cost": Decimal(line.unit_cost).quantize(Decimal("0.01")),
                "line_total": Decimal(line.line_total).quantize(Decimal("0.01")),
            }
            for line in lines
        ],
        "subtotal": Decimal(invoice.subtotal).quantize(Decimal("0.01")),
        "discount": Decimal(invoice.discount).quantize(Decimal("0.01")),
        "tax": Decimal(invoice.tax).quantize(Decimal("0.01")),
        "total": Decimal(invoice.total).quantize(Decimal("0.01")),
        "note": (invoice.note or "").strip(),
        "action_line": action_line,
        "custom_message": (custom_message or "").strip(),
    }

    return render_to_string("purchases/purchase_order_email.html", context)


def send_purchase_order_email(to_email: str, subject: str, body: str, html_body: str = "") -> int:
    from_email = getattr(settings, "PURCHASE_EMAIL_FROM", "") or getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        "",
    )

    if not from_email:
        raise RuntimeError("Email sender is not configured.")

    try:
        if html_body.strip():
            message = EmailMultiAlternatives(
                subject=subject,
                body=body,
                from_email=from_email,
                to=[to_email],
            )
            message.attach_alternative(html_body, "text/html")
            return message.send(fail_silently=False)

        return send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=[to_email],
            fail_silently=False,
        )
    except (SMTPException, OSError) as exc:
        raise RuntimeError(f"Email delivery failed: {exc}") from exc
