from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone

from kitchen.models import MenuItemWaste
from menu.models import RecipeLine
from sales.models import SaleItem
from .models import InventoryItem


def _d(v) -> Decimal:
    try:
        return Decimal(str(v or 0))
    except Exception:
        return Decimal("0")


def update_buffer_sizes_from_waste_rates(
    *,
    restaurant_id: int,
    lookback_days: int = 14,
    buffer_days: int = 3,
    alpha: Decimal | float = Decimal("0.60"),
    dry_run: bool = False,
):
    """Auto-update ingredient buffer_size from recent UNSOLD waste patterns.

    Strategy:
    - Estimate ingredient waste equivalent using menu waste and recipe quantities.
    - Convert to average daily ingredient waste over lookback window.
    - Set buffer target as avg_daily_waste * buffer_days.
    - Smooth changes with EMA-like blend: new = old*(1-alpha) + target*alpha.
    """

    lookback_days = max(1, int(lookback_days))
    buffer_days = max(1, int(buffer_days))
    alpha_d = _d(alpha)
    if alpha_d < 0:
        alpha_d = Decimal("0")
    if alpha_d > 1:
        alpha_d = Decimal("1")

    end_date = timezone.localdate()
    start_date = end_date - timedelta(days=lookback_days - 1)

    waste_rows = (
        MenuItemWaste.objects.filter(
            restaurant_id=restaurant_id,
            date__gte=start_date,
            date__lte=end_date,
            reason=MenuItemWaste.Reason.UNSOLD,
        )
        .values("menu_item_id")
        .annotate(waste_qty=Coalesce(Sum("waste_qty"), Decimal("0")))
    )

    sold_rows = (
        SaleItem.objects.filter(
            restaurant_id=restaurant_id,
            sale__restaurant_id=restaurant_id,
            sale__status="PAID",
            sale__sold_at__date__gte=start_date,
            sale__sold_at__date__lte=end_date,
            menu_item_id__isnull=False,
        )
        .values("menu_item_id")
        .annotate(sold_qty=Sum("qty"))
    )

    waste_by_menu = {int(r["menu_item_id"]): _d(r["waste_qty"]) for r in waste_rows}
    sold_by_menu = {int(r["menu_item_id"]): _d(r["sold_qty"]) for r in sold_rows}

    menu_ids = sorted(set(waste_by_menu.keys()) | set(sold_by_menu.keys()))
    if not menu_ids:
        return {
            "restaurant_id": restaurant_id,
            "start_date": str(start_date),
            "end_date": str(end_date),
            "lookback_days": lookback_days,
            "updated": 0,
            "items": [],
        }

    recipe_lines = (
        RecipeLine.objects.filter(
            menu_item_id__in=menu_ids,
            menu_item__restaurant_id=restaurant_id,
            ingredient__restaurant_id=restaurant_id,
        )
        .select_related("ingredient")
    )

    ingredient_waste_equiv = defaultdict(Decimal)

    for rl in recipe_lines:
        menu_id = int(rl.menu_item_id)
        menu_waste = waste_by_menu.get(menu_id, Decimal("0"))
        if menu_waste <= 0:
            continue

        ingredient_waste = (menu_waste * _d(rl.qty)).quantize(Decimal("0.01"))
        ingredient_waste_equiv[int(rl.ingredient_id)] += ingredient_waste

    if not ingredient_waste_equiv:
        return {
            "restaurant_id": restaurant_id,
            "start_date": str(start_date),
            "end_date": str(end_date),
            "lookback_days": lookback_days,
            "updated": 0,
            "items": [],
        }

    inv_map = {
        i.id: i
        for i in InventoryItem.objects.filter(
            restaurant_id=restaurant_id,
            id__in=list(ingredient_waste_equiv.keys()),
        )
    }

    updates = []
    item_summaries = []

    for ing_id, waste_equiv in ingredient_waste_equiv.items():
        ing = inv_map.get(ing_id)
        if not ing:
            continue

        current_buffer = _d(getattr(ing, "buffer_size", 0))
        avg_daily_waste = (waste_equiv / Decimal(str(lookback_days))).quantize(Decimal("0.01"))
        target_buffer = (avg_daily_waste * Decimal(str(buffer_days))).quantize(Decimal("0.01"))

        blended = (current_buffer * (Decimal("1") - alpha_d) + target_buffer * alpha_d).quantize(Decimal("0.01"))
        if blended < 0:
            blended = Decimal("0.00")

        if blended != current_buffer:
            ing.buffer_size = blended
            updates.append(ing)

        item_summaries.append(
            {
                "ingredient_id": ing.id,
                "ingredient_name": ing.name,
                "old_buffer_size": str(current_buffer),
                "target_buffer_size": str(target_buffer),
                "new_buffer_size": str(blended),
                "avg_daily_waste_equiv": str(avg_daily_waste),
            }
        )

    if updates and not dry_run:
        with transaction.atomic():
            InventoryItem.objects.bulk_update(updates, ["buffer_size", "updated_at"])

    return {
        "restaurant_id": restaurant_id,
        "start_date": str(start_date),
        "end_date": str(end_date),
        "lookback_days": lookback_days,
        "buffer_days": buffer_days,
        "alpha": str(alpha_d),
        "updated": len(updates),
        "items": item_summaries,
    }
