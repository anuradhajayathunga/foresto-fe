from collections import defaultdict
from decimal import Decimal

from inventory.models import InventoryItem
from menu.models import RecipeLine


def build_low_stock_alerts_for_plan(restaurant_id: int, plan_rows: list[dict]):
    """
    plan_rows: [{"menu_item_id": 1, "planned_qty": Decimal("10.00")}, ...]
    Returns:
      {
        "ingredient_alerts": [...],
        "summary": {...}
      }
    """
    # Normalize / aggregate planned qty per menu item
    menu_plan = defaultdict(lambda: Decimal("0.00"))
    for row in plan_rows:
        mid = int(row["menu_item_id"])
        qty = Decimal(str(row.get("planned_qty", 0) or 0))
        if qty > 0:
            menu_plan[mid] += qty

    if not menu_plan:
        return {"ingredient_alerts": [], "summary": {"total_shortage_items": 0}}

    recipe_lines = (
        RecipeLine.objects.filter(
            menu_item_id__in=list(menu_plan.keys()),
            menu_item__restaurant_id=restaurant_id,
            ingredient__restaurant_id=restaurant_id,
        )
        .select_related("ingredient", "menu_item")
    )

    # Ingredient required qty aggregation
    ingredient_required = defaultdict(lambda: Decimal("0.00"))
    ingredient_meta = {}

    for rl in recipe_lines:
        planned_menu_qty = menu_plan.get(rl.menu_item_id, Decimal("0.00"))
        req = planned_menu_qty * Decimal(str(rl.qty))
        ingredient_required[rl.ingredient_id] += req
        ingredient_meta[rl.ingredient_id] = {
            "item_id": rl.ingredient_id,
            "item_name": rl.ingredient.name,
            "unit": getattr(rl.ingredient, "unit", ""),
        }

    inv_items = {
        i.id: i for i in InventoryItem.objects.filter(
            id__in=list(ingredient_required.keys()),
            restaurant_id=restaurant_id,
        )
    }

    alerts = []
    for item_id, required_qty in ingredient_required.items():
        item = inv_items.get(item_id)
        if not item:
            continue

        current_stock = Decimal(str(item.current_stock or 0))
        reorder_level = Decimal(str(item.reorder_level or 0))
        projected_remaining = current_stock - required_qty

        # Suggested purchase:
        # if projected drops below reorder, buy up to (required + reorder - current)
        shortage_to_meet_plan = max(required_qty - current_stock, Decimal("0.00"))
        shortage_to_reorder_buffer = max((required_qty + reorder_level) - current_stock, Decimal("0.00"))
        suggested_purchase_qty = shortage_to_reorder_buffer

        severity = "OK"
        if shortage_to_meet_plan > 0:
            severity = "CRITICAL"
        elif projected_remaining <= reorder_level:
            severity = "LOW"

        if severity != "OK":
            alerts.append({
                "item_id": item.id,
                "item_name": item.name,
                "unit": getattr(item, "unit", ""),
                "required_qty": required_qty.quantize(Decimal("0.01")),
                "current_stock": current_stock.quantize(Decimal("0.01")),
                "reorder_level": reorder_level.quantize(Decimal("0.01")),
                "projected_remaining": projected_remaining.quantize(Decimal("0.01")),
                "shortage_to_meet_plan": shortage_to_meet_plan.quantize(Decimal("0.01")),
                "suggested_purchase_qty": suggested_purchase_qty.quantize(Decimal("0.01")),
                "severity": severity,
            })

    alerts.sort(key=lambda x: (x["severity"] != "CRITICAL", -float(x["suggested_purchase_qty"])))
    return {
        "ingredient_alerts": alerts,
        "summary": {
            "total_shortage_items": len(alerts),
            "critical_items": sum(1 for a in alerts if a["severity"] == "CRITICAL"),
            "low_items": sum(1 for a in alerts if a["severity"] == "LOW"),
        },
    }