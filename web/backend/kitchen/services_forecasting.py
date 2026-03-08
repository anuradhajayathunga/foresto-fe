from decimal import Decimal

from django.utils import timezone

from forecasting.services import predict_menu_demand
from menu.models import MenuItem


def get_menu_item_suggestions_from_forecasting_app(restaurant_id: int, target_date):
    """
    Uses forecasting.services.predict_menu_demand() and returns:
      {menu_item_id: {"suggested_qty": Decimal, "basis": str}}

    Notes:
    - target_date must be in the future (>= tomorrow)
    - fills missing active menu items with 0 suggestion
    """
    today = timezone.localdate()
    if target_date <= today:
        raise ValueError("target_date must be in the future (tomorrow or later).")

    horizon_days = (target_date - today).days
    # Keep it reasonable / aligned with forecasting module expectations
    horizon_days = max(1, min(horizon_days, 30))

    active_menu_qs = MenuItem.objects.filter(
        restaurant_id=restaurant_id,
        is_available=True,
    ).select_related("category")

    # Ask forecast service for enough rows to cover all active items
    top_n = max(active_menu_qs.count(), 1)

    forecast = predict_menu_demand(
        horizon_days=horizon_days,
        top_n=top_n,
        restaurant_id=restaurant_id,
    )

    target_str = str(target_date)
    predicted_by_item = {}

    for item in forecast.get("items", []):
        mid = int(item["menu_item_id"])
        yhat = None
        for d in item.get("daily", []):
            if d.get("date") == target_str:
                yhat = d.get("yhat", 0)
                break

        if yhat is None:
            # If target date not present (e.g. target > capped horizon)
            yhat = 0

        predicted_by_item[mid] = {
            "suggested_qty": Decimal(str(yhat or 0)).quantize(Decimal("0.01")),
            "basis": "FORECASTING_APP_ML",
        }

    # Fill active items missing from forecast response with zero suggestion
    out = {}
    for mi in active_menu_qs.only("id"):
        out[mi.id] = predicted_by_item.get(
            mi.id,
            {"suggested_qty": Decimal("0.00"), "basis": "FORECASTING_APP_ML"},
        )

    return out