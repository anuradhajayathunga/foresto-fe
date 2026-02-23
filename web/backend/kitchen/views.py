from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.mixins import RestaurantScopedQuerysetMixin
from kitchen.models import MenuItemProduction, MenuItemWaste, KitchenPurchaseRequest, KitchenPurchaseRequestLine
from kitchen.serializers import (
    MenuItemProductionSerializer,
    MenuItemWasteSerializer,
    MenuItemProductionUpsertSerializer,
    MenuItemWasteUpsertSerializer,
    ForecastSuggestSerializer,
    ProductionBulkUpsertSerializer,
    ConvertKitchenPurchaseRequestToDraftSerializer,
    KitchenPurchaseRequestSerializer,
    PlanAlertCheckSerializer,
)
from kitchen.services_forecasting import get_menu_item_suggestions_from_forecasting_app
from kitchen.services_planning import build_low_stock_alerts_for_plan
from menu.models import MenuItem


class KitchenBaseFiltersMixin:
    def _apply_filters(self, qs):
        qp = self.request.query_params
        date_from = qp.get("date_from")
        date_to = qp.get("date_to")
        menu_item_id = qp.get("menu_item")

        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if menu_item_id:
            qs = qs.filter(menu_item_id=menu_item_id)
        return qs

class MenuItemProductionViewSet(RestaurantScopedQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MenuItemProductionSerializer
    queryset = (
        MenuItemProduction.objects
        .select_related("restaurant", "menu_item", "menu_item__category")
        .all()
    )

    @action(detail=False, methods=["post"], url_path="upsert")
    def upsert(self, request):
        s = MenuItemProductionUpsertSerializer(data=request.data, context={"request": request})
        s.is_valid(raise_exception=True)
        obj = s.create_or_update()

        # Return alert for this plan row (planned qty)
        alerts = build_low_stock_alerts_for_plan(
            restaurant_id=request.user.restaurant_id,
            plan_rows=[{
                "menu_item_id": obj.menu_item_id,
                "planned_qty": obj.planned_qty,
            }],
        )

        return Response({
            "production": MenuItemProductionSerializer(obj, context={"request": request}).data,
            "low_stock_alerts": alerts,
        })
    @action(detail=False, methods=["post"], url_path="forecast-suggest")
    def forecast_suggest(self, request):
        s = ForecastSuggestSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        target_date = s.validated_data["date"]
        save_to_production = s.validated_data["save_to_production"]

        user = request.user
        restaurant = getattr(user, "restaurant", None)
        if not restaurant:
            return Response({"detail": "User has no restaurant assigned."}, status=400)

        try:
            suggestions = get_menu_item_suggestions_from_forecasting_app(
                restaurant_id=restaurant.id,
                target_date=target_date,
            )
        except FileNotFoundError:
            # ML model artifact missing
            return Response({"detail": "Forecast model unavailable."}, status=503)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        except Exception:
            return Response({"detail": "Failed to generate forecast suggestions."}, status=500)

        menu_items = {
            m.id: m
            for m in MenuItem.objects.filter(
                restaurant=restaurant,
                is_available=True,
            ).select_related("category")
        }

        rows = []
        with transaction.atomic():
            for mid, rec in suggestions.items():
                mi = menu_items.get(mid)
                if not mi:
                    continue

                if save_to_production:
                    prod, _ = MenuItemProduction.objects.update_or_create(
                        restaurant=restaurant,
                        date=target_date,
                        menu_item=mi,
                        defaults={
                            "suggested_qty": rec["suggested_qty"],
                            "suggestion_basis": rec["basis"],
                        },
                    )
                    rows.append(MenuItemProductionSerializer(prod, context={"request": request}).data)
                else:
                    rows.append(
                        {
                            "date": str(target_date),
                            "menu_item": mi.id,
                            "menu_item_name": mi.name,
                            "category_name": getattr(mi.category, "name", None),
                            "suggested_qty": str(rec["suggested_qty"]),
                            "suggestion_basis": rec["basis"],
                        }
                    )

        return Response(
            {
                "date": str(target_date),
                "count": len(rows),
                "save_to_production": save_to_production,
                "results": rows,
            }
        )

    @action(detail=False, methods=["post"], url_path="plan-alerts")
    def plan_alerts(self, request):
        s = PlanAlertCheckSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        rows = s.validated_data["rows"]
        alert_data = build_low_stock_alerts_for_plan(
            restaurant_id=request.user.restaurant_id,
            plan_rows=rows,
        )

        created_request = None
        if s.validated_data.get("create_purchase_request") and alert_data["ingredient_alerts"]:
            created_request = self._create_purchase_request_from_alerts(
                request=request,
                source_plan_date=s.validated_data.get("date"),
                note=s.validated_data.get("note", ""),
                alert_data=alert_data,
            )

        resp = {
            "alerts": alert_data,
            "purchase_request": KitchenPurchaseRequestSerializer(created_request).data if created_request else None,
        }
        return Response(resp)

    def _create_purchase_request_from_alerts(self, request, source_plan_date, note, alert_data):
        with transaction.atomic():
            pr = KitchenPurchaseRequest.objects.create(
                restaurant=request.user.restaurant,
                request_date=timezone.localdate(),
                source_plan_date=source_plan_date,
                note=note or "Auto-created from kitchen plan low-stock alerts",
                created_by=request.user,
            )

            from inventory.models import InventoryItem  # local import to avoid circular issues in some setups
            items_map = {
                i.id: i for i in InventoryItem.objects.filter(
                    restaurant=request.user.restaurant,
                    id__in=[a["item_id"] for a in alert_data["ingredient_alerts"]],
                )
            }

            for a in alert_data["ingredient_alerts"]:
                item = items_map.get(a["item_id"])
                if not item:
                    continue
                KitchenPurchaseRequestLine.objects.create(
                    purchase_request=pr,
                    restaurant=request.user.restaurant,
                    item=item,
                    required_qty=a["required_qty"],
                    current_stock=a["current_stock"],
                    reorder_level=a["reorder_level"],
                    suggested_purchase_qty=a["suggested_purchase_qty"],
                    reason="LOW_STOCK" if a["severity"] == "LOW" else "SHORTAGE",
                )
        return pr

class MenuItemWasteViewSet(KitchenBaseFiltersMixin, RestaurantScopedQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MenuItemWasteSerializer
    queryset = (
        MenuItemWaste.objects
        .select_related("restaurant", "menu_item", "menu_item__category")
        .all()
    )

    def get_queryset(self):
        return self._apply_filters(super().get_queryset())

    @action(detail=False, methods=["post"])
    def upsert(self, request):
        s = MenuItemWasteUpsertSerializer(data=request.data, context={"request": request})
        s.is_valid(raise_exception=True)
        obj = s.create_or_update()
        return Response(MenuItemWasteSerializer(obj, context={"request": request}).data)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        qs = self.get_queryset()
        total = qs.aggregate(
            total_waste=Coalesce(Sum("waste_qty"), Value(0), output_field=DecimalField(max_digits=12, decimal_places=2))
        )
        by_reason = (
            qs.values("reason")
            .annotate(total_waste=Coalesce(Sum("waste_qty"), Value(0), output_field=DecimalField(max_digits=12, decimal_places=2)))
            .order_by("-total_waste")
        )
        return Response({"total_waste": total["total_waste"], "by_reason": list(by_reason)})

    @action(detail=False, methods=["get"], url_path="waste-vs-sales")
    def waste_vs_sales(self, request):
        """
        Returns per-item waste + sold qty for a date/date range.
        Uses sales.SaleItem joined to Sale.sold_at and Sale.status=PAID.
        """
        user = request.user
        restaurant_id = getattr(user, "restaurant_id", None)
        if not restaurant_id:
            return Response({"detail": "User has no restaurant assigned."}, status=400)

        qp = request.query_params
        date_from = qp.get("date_from")
        date_to = qp.get("date_to")
        if not date_from or not date_to:
            return Response({"detail": "date_from and date_to are required."}, status=400)

        waste_qs = self.get_queryset().filter(date__gte=date_from, date__lte=date_to)
        waste_map = {}
        for row in waste_qs.values("menu_item_id", "menu_item__name").annotate(
            waste_qty=Coalesce(Sum("waste_qty"), Value(0), output_field=DecimalField(max_digits=12, decimal_places=2))
        ):
            waste_map[row["menu_item_id"]] = {
                "menu_item_id": row["menu_item_id"],
                "menu_item_name": row["menu_item__name"],
                "waste_qty": row["waste_qty"],
            }

        sold_rows = (
            SaleItem.objects.filter(
                restaurant_id=restaurant_id,
                sale__restaurant_id=restaurant_id,
                sale__status="PAID",
                sale__sold_at__date__gte=date_from,
                sale__sold_at__date__lte=date_to,
                menu_item__isnull=False,
            )
            .values("menu_item_id", "menu_item__name")
            .annotate(sold_qty=Coalesce(Sum("qty"), Value(0), output_field=DecimalField(max_digits=12, decimal_places=2)))
        )

        # merge
        result = {}
        for mid, row in waste_map.items():
            result[mid] = {
                "menu_item_id": row["menu_item_id"],
                "menu_item_name": row["menu_item_name"],
                "sold_qty": 0,
                "waste_qty": row["waste_qty"],
            }

        for row in sold_rows:
            mid = row["menu_item_id"]
            if mid not in result:
                result[mid] = {
                    "menu_item_id": mid,
                    "menu_item_name": row["menu_item__name"],
                    "sold_qty": row["sold_qty"],
                    "waste_qty": 0,
                }
            else:
                result[mid]["sold_qty"] = row["sold_qty"]

        # derived waste%
        out = []
        for row in result.values():
            sold = row["sold_qty"] or 0
            waste = row["waste_qty"] or 0
            prepared_like = (sold or 0) + (waste or 0)
            waste_rate_pct = (float(waste) / float(prepared_like) * 100) if prepared_like else 0.0
            row["waste_rate_pct"] = round(waste_rate_pct, 2)
            out.append(row)

        out.sort(key=lambda x: x["waste_qty"], reverse=True)
        return Response({"count": len(out), "results": out})
    
    @action(detail=False, methods=["post"], url_path="bulk-upsert")
    def bulk_upsert(self, request):
        s = ProductionBulkUpsertSerializer(data=request.data, context={"request": request})
        s.is_valid(raise_exception=True)
        v = s.validated_data

        restaurant = request.user.restaurant
        date_val = v["date"]
        rows = v["rows"]

        menu_ids = [int(r["menu_item"]) for r in rows]
        menu_map = {
            m.id: m
            for m in MenuItem.objects.filter(
                id__in=menu_ids,
                restaurant=restaurant,
            ).select_related("category")
        }

        saved = []
        plan_rows_for_alerts = []

        with transaction.atomic():
            for row in rows:
                mid = int(row["menu_item"])
                mi = menu_map.get(mid)
                if not mi:
                    continue  # validated already, just safety

                defaults = {
                    "planned_qty": row["planned_qty"],
                }
                if "prepared_qty" in row:
                    defaults["prepared_qty"] = row["prepared_qty"]
                if "suggested_qty" in row:
                    defaults["suggested_qty"] = row["suggested_qty"]
                if "suggestion_basis" in row:
                    defaults["suggestion_basis"] = row.get("suggestion_basis", "")
                if "note" in row:
                    defaults["note"] = row.get("note", "")

                obj, _ = MenuItemProduction.objects.update_or_create(
                    restaurant=restaurant,
                    date=date_val,
                    menu_item=mi,
                    defaults=defaults,
                )
                saved.append(obj)

                plan_rows_for_alerts.append(
                    {
                        "menu_item_id": mi.id,
                        "planned_qty": obj.planned_qty,
                    }
                )

            alerts = None
            created_pr = None

            if v.get("return_alerts", True):
                alerts = build_low_stock_alerts_for_plan(
                    restaurant_id=restaurant.id,
                    plan_rows=plan_rows_for_alerts,
                )

                if v.get("create_purchase_request") and alerts.get("ingredient_alerts"):
                    created_pr = self._create_purchase_request_from_alerts(
                        request=request,
                        source_plan_date=date_val,
                        note=v.get("purchase_request_note", ""),
                        alert_data=alerts,
                    )

        out = MenuItemProductionSerializer(saved, many=True, context={"request": request}).data
        return Response(
            {
                "date": str(date_val),
                "count": len(out),
                "results": out,
                "alerts": alerts,
                "purchase_request": KitchenPurchaseRequestSerializer(created_pr).data if created_pr else None,
            },
            status=status.HTTP_200_OK,
        )

class KitchenPurchaseRequestViewSet(RestaurantScopedQuerysetMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = KitchenPurchaseRequestSerializer
    queryset = (
        KitchenPurchaseRequest.objects
        .select_related("restaurant", "created_by")
        .prefetch_related("lines", "lines__item")
        .all()
    )

    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, pk=None):
        obj = self.get_object()
        if obj.status != KitchenPurchaseRequest.Status.DRAFT:
            return Response({"detail": "Only DRAFT can be submitted."}, status=400)
        obj.status = KitchenPurchaseRequest.Status.SUBMITTED
        obj.save(update_fields=["status"])
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=["post"], url_path="convert-to-purchase-draft")
    def convert_to_purchase_draft(self, request, pk=None):
        pr = self.get_object()

        if pr.status in [KitchenPurchaseRequest.Status.CANCELLED, KitchenPurchaseRequest.Status.CONVERTED]:
            return Response({"detail": f"Cannot convert request in status {pr.status}."}, status=400)

        s = ConvertKitchenPurchaseRequestToDraftSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        v = s.validated_data

        # Local imports avoid hard circular imports at module load time
        from purchases.models import Supplier, PurchaseInvoice, PurchaseLine
        from purchases.serializers import PurchaseInvoiceOutSerializer

        supplier_qs = Supplier.objects.filter(pk=v["supplier"], restaurant_id=pr.restaurant_id)
        supplier = supplier_qs.first()
        if not supplier:
            return Response({"supplier": "Supplier not found in this restaurant."}, status=400)

        lines = list(pr.lines.select_related("item").all())
        draft_lines = []

        for line in lines:
            qty = Decimal(str(line.suggested_purchase_qty or 0)).quantize(Decimal("0.01"))
            if qty <= 0:
                continue
            draft_lines.append((line.item, qty))

        if not draft_lines:
            return Response({"detail": "No lines with suggested_purchase_qty > 0 to convert."}, status=400)

        invoice_date = v.get("invoice_date") or timezone.localdate()
        extra_note = (v.get("note") or "").strip()

        with transaction.atomic():
            invoice = PurchaseInvoice.objects.create(
                restaurant=pr.restaurant,
                supplier=supplier,
                invoice_no=(v.get("invoice_no") or "").strip(),
                invoice_date=invoice_date,
                status=PurchaseInvoice.Status.DRAFT,
                discount=Decimal("0.00"),
                tax=Decimal("0.00"),
                note=(
                    f"Draft from KitchenPurchaseRequest #{pr.id}"
                    + (f" | plan_date={pr.source_plan_date}" if pr.source_plan_date else "")
                    + (f" | {extra_note}" if extra_note else "")
                ),
                created_by=request.user,
            )

            subtotal = Decimal("0.00")
            for idx, (item, qty) in enumerate(draft_lines):
                unit_cost = Decimal(str(getattr(item, "cost_per_unit", Decimal("0.00")) or Decimal("0.00"))).quantize(Decimal("0.01"))
                line_total = (qty * unit_cost).quantize(Decimal("0.01"))
                subtotal += line_total

                PurchaseLine.objects.create(
                    invoice=invoice,
                    restaurant=pr.restaurant,   # IMPORTANT for tenant consistency
                    item=item,
                    qty=qty,
                    unit_cost=unit_cost,
                    line_total=line_total,
                    sort_order=idx,
                )

            invoice.subtotal = subtotal.quantize(Decimal("0.01"))
            invoice.total = invoice.subtotal  # discount/tax zero in draft
            invoice.save(update_fields=["subtotal", "total"])

            # Mark source request converted
            pr.status = KitchenPurchaseRequest.Status.CONVERTED
            if extra_note:
                pr.note = ((pr.note or "").strip() + ("\n" if pr.note else "") + f"Converted to PurchaseInvoice #{invoice.id}: {extra_note}")
                pr.save(update_fields=["status", "note"])
            else:
                pr.save(update_fields=["status"])

        out = PurchaseInvoiceOutSerializer(invoice, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)