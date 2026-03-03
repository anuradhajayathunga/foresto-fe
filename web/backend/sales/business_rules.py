from collections import defaultdict
from decimal import Decimal

from django.db.models import DecimalField, Sum, Value
from django.db.models.functions import Coalesce

from kitchen.models import MenuItemProduction, MenuItemWaste
from sales.models import Sale, SaleItem


AUTO_WASTE_NOTE_PREFIX = "Auto-calculated from prepared_qty - paid_sales_qty"


def _to_decimal(value) -> Decimal:
    if value is None:
        return Decimal("0.00")
    return Decimal(str(value))


def _prepared_qty_map(restaurant_id: int, target_date, menu_item_ids: list[int]) -> dict[int, Decimal]:
    if not menu_item_ids:
        return {}

    rows = (
        MenuItemProduction.objects.filter(
            restaurant_id=restaurant_id,
            date=target_date,
            menu_item_id__in=menu_item_ids,
        )
        .values("menu_item_id")
        .annotate(
            prepared_qty=Coalesce(
                Sum("prepared_qty"),
                Value(Decimal("0.00")),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            )
        )
    )
    return {int(r["menu_item_id"]): _to_decimal(r["prepared_qty"]).quantize(Decimal("0.01")) for r in rows}


def _paid_sold_qty_map(
    restaurant_id: int,
    target_date,
    menu_item_ids: list[int],
    exclude_sale_id: int | None = None,
) -> dict[int, Decimal]:
    if not menu_item_ids:
        return {}

    qs = SaleItem.objects.filter(
        restaurant_id=restaurant_id,
        sale__restaurant_id=restaurant_id,
        sale__status=Sale.Status.PAID,
        sale__sold_at__date=target_date,
        menu_item_id__in=menu_item_ids,
    )
    if exclude_sale_id:
        qs = qs.exclude(sale_id=exclude_sale_id)

    rows = qs.values("menu_item_id").annotate(
        sold_qty=Coalesce(
            Sum("qty"),
            Value(Decimal("0.00")),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )
    )
    return {int(r["menu_item_id"]): _to_decimal(r["sold_qty"]).quantize(Decimal("0.01")) for r in rows}


def get_prepared_limit_errors(
    *,
    restaurant_id: int,
    target_date,
    incoming_qty_by_menu: dict[int, Decimal],
    exclude_sale_id: int | None = None,
) -> list[str]:
    menu_item_ids = sorted({int(mid) for mid in incoming_qty_by_menu.keys() if mid})
    if not menu_item_ids:
        return []

    prepared_map = _prepared_qty_map(restaurant_id, target_date, menu_item_ids)
    sold_map = _paid_sold_qty_map(restaurant_id, target_date, menu_item_ids, exclude_sale_id)

    errors: list[str] = []
    for menu_item_id in menu_item_ids:
        prepared = prepared_map.get(menu_item_id, Decimal("0.00"))
        already_sold = sold_map.get(menu_item_id, Decimal("0.00"))
        incoming = _to_decimal(incoming_qty_by_menu.get(menu_item_id, Decimal("0.00")))
        total_after = (already_sold + incoming).quantize(Decimal("0.01"))

        if total_after > prepared:
            errors.append(
                (
                    f"menu_item_id={menu_item_id}: paid sales {total_after} exceed prepared_qty {prepared} "
                    f"for date {target_date}."
                )
            )

    return errors


def calculate_unsold_waste_qty(*, restaurant_id: int, target_date, menu_item_id: int) -> Decimal:
    prepared = _prepared_qty_map(restaurant_id, target_date, [menu_item_id]).get(menu_item_id, Decimal("0.00"))
    sold = _paid_sold_qty_map(restaurant_id, target_date, [menu_item_id]).get(menu_item_id, Decimal("0.00"))

    waste = prepared - sold
    if waste < 0:
        waste = Decimal("0.00")
    return waste.quantize(Decimal("0.01"))


def sync_auto_unsold_waste_for_date(*, restaurant_id: int, target_date, menu_item_ids: list[int]) -> None:
    unique_ids = sorted({int(mid) for mid in menu_item_ids if mid})
    if not unique_ids:
        return

    prepared_map = _prepared_qty_map(restaurant_id, target_date, unique_ids)
    sold_map = _paid_sold_qty_map(restaurant_id, target_date, unique_ids)
    existing_wastes = {
        w.menu_item_id: w
        for w in MenuItemWaste.objects.filter(
            restaurant_id=restaurant_id,
            date=target_date,
            menu_item_id__in=unique_ids,
        )
    }

    for menu_item_id in unique_ids:
        prepared = prepared_map.get(menu_item_id, Decimal("0.00"))
        sold = sold_map.get(menu_item_id, Decimal("0.00"))

        waste_qty = prepared - sold
        if waste_qty < 0:
            waste_qty = Decimal("0.00")
        waste_qty = waste_qty.quantize(Decimal("0.01"))

        existing = existing_wastes.get(menu_item_id)
        if existing:
            locked_by_manual_reason = bool(existing.reason) and existing.reason != MenuItemWaste.Reason.UNSOLD
            locked_by_manual_note = bool((existing.note or "").strip()) and not existing.note.startswith(AUTO_WASTE_NOTE_PREFIX)
            if locked_by_manual_reason or locked_by_manual_note:
                continue

            existing.waste_qty = waste_qty
            existing.reason = MenuItemWaste.Reason.UNSOLD
            existing.note = f"{AUTO_WASTE_NOTE_PREFIX}; prepared={prepared}; sold={sold}"
            existing.save(update_fields=["waste_qty", "reason", "note"])
            continue

        if prepared <= 0 and sold <= 0:
            continue

        MenuItemWaste.objects.create(
            restaurant_id=restaurant_id,
            date=target_date,
            menu_item_id=menu_item_id,
            waste_qty=waste_qty,
            reason=MenuItemWaste.Reason.UNSOLD,
            note=f"{AUTO_WASTE_NOTE_PREFIX}; prepared={prepared}; sold={sold}",
        )


def aggregate_incoming_menu_qty(items: list[dict]) -> dict[int, Decimal]:
    incoming = defaultdict(lambda: Decimal("0.00"))
    for row in items:
        menu_item = row.get("menu_item")
        if not menu_item:
            continue
        menu_item_id = getattr(menu_item, "id", None) or row.get("menu_item_id")
        if not menu_item_id:
            continue

        qty = _to_decimal(row.get("qty") or Decimal("0.00"))
        incoming[int(menu_item_id)] += qty

    return {k: v.quantize(Decimal("0.01")) for k, v in incoming.items()}