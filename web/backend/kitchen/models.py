from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q

from accounts.models import Restaurant, User
from inventory.models import InventoryItem
from menu.models import MenuItem


class MenuItemProduction(models.Model):
    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.PROTECT, related_name="kitchen_productions", null=True, blank=True,
    )
    date = models.DateField()
    menu_item = models.ForeignKey(
        MenuItem, on_delete=models.PROTECT, related_name="kitchen_productions"
    )

    # Forecast / recommendation
    suggested_qty = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    suggestion_basis = models.CharField(max_length=120, blank=True, default="")  # e.g. AVG_14D / FORECAST_SERVICE

    # Kitchen entered values
    planned_qty = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    prepared_qty = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    note = models.TextField(blank=True, default="")

    class Meta:
        db_table = "kitchen_menuitemproduction"
        ordering = ["-date", "menu_item_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["restaurant", "date", "menu_item"],
                name="uniq_kitchen_prod_rest_date_menu",
            ),
            # models.CheckConstraint(check=Q(suggested_qty__gte=0), name="ck_kitchen_prod_suggested_gte_0"),
            # models.CheckConstraint(check=Q(planned_qty__gte=0), name="ck_kitchen_prod_planned_gte_0"),
            # models.CheckConstraint(check=Q(prepared_qty__gte=0), name="ck_kitchen_prod_prepared_gte_0"),
        ]
        indexes = [
            models.Index(fields=["restaurant", "date"], name="idx_kitchen_prod_rest_date"),
            models.Index(fields=["restaurant", "menu_item"], name="idx_kitchen_prod_rest_menu"),
        ]


class MenuItemWaste(models.Model):
    class Reason(models.TextChoices):
        UNSOLD = "UNSOLD", "Unsold"
        BURNT = "BURNT", "Burnt"
        RETURNED = "RETURNED", "Returned"
        EXPIRED = "EXPIRED", "Expired"

    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.PROTECT, related_name="kitchen_wastes", null=True, blank=True,
    )
    date = models.DateField()
    menu_item = models.ForeignKey(
        MenuItem, on_delete=models.PROTECT, related_name="kitchen_wastes"
    )
    waste_qty = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    reason = models.CharField(max_length=50, blank=True, default="", choices=Reason.choices)
    note = models.TextField(blank=True, default="")

    class Meta:
        db_table = "kitchen_menuitemwaste"
        ordering = ["-date", "menu_item_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["restaurant", "date", "menu_item"],
                name="uniq_kitchen_waste_rest_date_menu",
            ),
            # models.CheckConstraint(check=Q(waste_qty__gte=0), name="ck_kitchen_waste_qty_gte_0"),
        ]
        indexes = [
            models.Index(fields=["restaurant", "date"], name="idx_kitchen_waste_rest_date"),
            models.Index(fields=["restaurant", "menu_item"], name="idx_kitchen_waste_rest_menu"),
        ]


class KitchenPurchaseRequest(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        APPROVED = "APPROVED", "Approved"
        CONVERTED = "CONVERTED", "Converted"
        CANCELLED = "CANCELLED", "Cancelled"

    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.PROTECT, related_name="kitchen_purchase_requests", null=True, blank=True
    )
    request_date = models.DateField()
    source_plan_date = models.DateField(null=True, blank=True)  # production plan date this was based on
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    note = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="kitchen_purchase_requests_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "kitchen_purchaserequest"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["restaurant", "request_date"], name="idx_kpr_rest_req_date"),
            models.Index(fields=["restaurant", "status"], name="idx_kpr_rest_status"),
        ]


class KitchenPurchaseRequestLine(models.Model):
    purchase_request = models.ForeignKey(
        KitchenPurchaseRequest, on_delete=models.CASCADE, related_name="lines"
    )
    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.PROTECT, related_name="kitchen_purchase_request_lines", null=True, blank=True
    )
    item = models.ForeignKey(
        InventoryItem, on_delete=models.PROTECT, related_name="kitchen_purchase_request_lines"
    )
    required_qty = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))]
    )
    current_stock = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    reorder_level = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    suggested_purchase_qty = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))]
    )
    reason = models.CharField(max_length=30, blank=True, default="LOW_STOCK")
    note = models.TextField(blank=True, default="")

    class Meta:
        db_table = "kitchen_purchaserequestline"
        ordering = ["item__name"]
        constraints = [
            # models.CheckConstraint(check=Q(required_qty__gte=0), name="ck_kprl_required_gte_0"),
            # models.CheckConstraint(check=Q(current_stock__gte=0), name="ck_kprl_stock_gte_0"),
            # models.CheckConstraint(check=Q(suggested_purchase_qty__gte=0), name="ck_kprl_suggested_gte_0"),
        ]
        indexes = [
            models.Index(fields=["restaurant", "item"], name="idx_kprl_rest_item"),
            models.Index(fields=["purchase_request"], name="idx_kprl_req"),
        ]