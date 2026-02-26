from decimal import Decimal
from rest_framework import serializers

from inventory.models import InventoryItem
from core.tenant_utils import resolve_target_restaurant_for_request
from kitchen.models import (
    MenuItemProduction, MenuItemWaste,
    KitchenPurchaseRequest, KitchenPurchaseRequestLine,
)
from menu.models import MenuItem


class KitchenTenantMenuItemValidationMixin:
    def _get_target_restaurant(self):
        request = self.context.get("request")
        return resolve_target_restaurant_for_request(request, getattr(self, "initial_data", None) or {})

    def validate_menu_item(self, menu_item: MenuItem):
        restaurant = self._get_target_restaurant()
        if menu_item.restaurant_id != restaurant.id:
            raise serializers.ValidationError("Selected menu item does not belong to the selected restaurant.")
        return menu_item


class MenuItemWasteSerializer(KitchenTenantMenuItemValidationMixin, serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source="menu_item.name", read_only=True)
    category_name = serializers.CharField(source="menu_item.category.name", read_only=True)

    class Meta:
        model = MenuItemWaste
        fields = [
            "id",
            "date",
            "menu_item",
            "menu_item_name",
            "category_name",
            "waste_qty",
            "reason",
            "note",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        validated_data["restaurant"] = self._get_target_restaurant()
        return super().create(validated_data)


class MenuItemWasteUpsertSerializer(KitchenTenantMenuItemValidationMixin, serializers.Serializer):
    date = serializers.DateField()
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all())
    waste_qty = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    reason = serializers.ChoiceField(choices=MenuItemWaste.Reason.choices, required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)

    def create_or_update(self):
        data = self.validated_data
        restaurant = self._get_target_restaurant()
        obj, _ = MenuItemWaste.objects.update_or_create(
            restaurant=restaurant,
            date=data["date"],
            menu_item=data["menu_item"],
            defaults={
                "waste_qty": data["waste_qty"],
                "reason": data.get("reason", ""),
                "note": data.get("note", ""),
            },
        )
        return obj


class MenuItemProductionSerializer(KitchenTenantMenuItemValidationMixin, serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source="menu_item.name", read_only=True)
    category_name = serializers.CharField(source="menu_item.category.name", read_only=True)

    class Meta:
        model = MenuItemProduction
        fields = [
            "id", "date", "menu_item", "menu_item_name", "category_name",
            "suggested_qty", "suggestion_basis",
            "planned_qty", "prepared_qty",
            "created_at", "updated_at", "note",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MenuItemProductionUpsertSerializer(KitchenTenantMenuItemValidationMixin, serializers.Serializer):
    date = serializers.DateField()
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all())
    planned_qty = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, min_value=0)
    prepared_qty = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, min_value=0)
    suggested_qty = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, min_value=0)
    suggestion_basis = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)

    def validate_menu_item(self, menu_item):
        restaurant = self._get_target_restaurant()
        if menu_item.restaurant_id != restaurant.id:
            raise serializers.ValidationError("Menu item does not belong to the selected restaurant.")
        return menu_item

    def create_or_update(self):
        data = self.validated_data
        restaurant = self._get_target_restaurant()
        obj, _ = MenuItemProduction.objects.update_or_create(
            restaurant=restaurant,
            date=data["date"],
            menu_item=data["menu_item"],
            defaults={
                "planned_qty": data.get("planned_qty", Decimal("0.00")),
                "prepared_qty": data.get("prepared_qty", Decimal("0.00")),
                "suggested_qty": data.get("suggested_qty", Decimal("0.00")),
                "suggestion_basis": data.get("suggestion_basis", ""),
                "note": data.get("note", ""),
            },
        )
        return obj


class ForecastSuggestSerializer(serializers.Serializer):
    date = serializers.DateField()
    save_to_production = serializers.BooleanField(default=False)

    def validate_date(self, value):
        from django.utils import timezone
        if value <= timezone.localdate():
            raise serializers.ValidationError("date must be a future date (tomorrow or later).")
        return value


class PlanRowSerializer(serializers.Serializer):
    menu_item_id = serializers.IntegerField()
    planned_qty = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)


class PlanAlertCheckSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)  # optional if rows are ad-hoc
    rows = PlanRowSerializer(many=True)
    create_purchase_request = serializers.BooleanField(default=False)
    note = serializers.CharField(required=False, allow_blank=True)


class KitchenPurchaseRequestLineSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    unit = serializers.CharField(source="item.unit", read_only=True)

    class Meta:
        model = KitchenPurchaseRequestLine
        fields = [
            "id", "item", "item_name", "unit",
            "required_qty", "current_stock", "reorder_level",
            "suggested_purchase_qty", "reason", "note",
        ]


class KitchenPurchaseRequestSerializer(serializers.ModelSerializer):
    lines = KitchenPurchaseRequestLineSerializer(many=True, read_only=True)

    class Meta:
        model = KitchenPurchaseRequest
        fields = [
            "id", "request_date", "source_plan_date", "status", "note",
            "created_by", "created_at", "lines",
        ]
        read_only_fields = ["id", "created_by", "created_at", "lines"]


class ProductionBulkUpsertRowSerializer(serializers.Serializer):
    menu_item = serializers.IntegerField()
    planned_qty = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    prepared_qty = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, min_value=0)
    suggested_qty = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, min_value=0)
    suggestion_basis = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)


class ProductionBulkUpsertSerializer(KitchenTenantMenuItemValidationMixin, serializers.Serializer):
    date = serializers.DateField()
    rows = ProductionBulkUpsertRowSerializer(many=True)
    return_alerts = serializers.BooleanField(default=True)
    create_purchase_request = serializers.BooleanField(default=False)
    purchase_request_note = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        restaurant = self._get_target_restaurant()
        restaurant_id = restaurant.id

        rows = attrs.get("rows") or []
        if not rows:
            raise serializers.ValidationError({"rows": "At least one row is required."})

        menu_ids = [int(r["menu_item"]) for r in rows]
        if len(menu_ids) != len(set(menu_ids)):
            raise serializers.ValidationError({"rows": "Duplicate menu_item entries are not allowed in one request."})

        valid_ids = set(
            MenuItem.objects.filter(
                id__in=menu_ids,
                restaurant_id=restaurant_id,
            ).values_list("id", flat=True)
        )
        invalid = [mid for mid in menu_ids if mid not in valid_ids]
        if invalid:
            raise serializers.ValidationError({"rows": f"Menu items not in your restaurant: {invalid}"})

        return attrs


class ConvertKitchenPurchaseRequestToDraftSerializer(serializers.Serializer):
    supplier = serializers.IntegerField()
    invoice_date = serializers.DateField(required=False)
    invoice_no = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)