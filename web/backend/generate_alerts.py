import os
import django
from datetime import timedelta
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db.models import Sum
from django.utils import timezone
from inventory.models import InventoryItem
from forecasting.models import ForecastResult, Alert
from accounts.models import Restaurant


def generate_alerts_for_restaurant(restaurant):
    items = InventoryItem.objects.filter(restaurant=restaurant, is_active=True)
    Alert.objects.filter(restaurant=restaurant).delete()

    today = timezone.now().date()
    next_3_days = [today + timedelta(days=i) for i in range(3)]
    past_7_days = [today - timedelta(days=i) for i in range(1, 8)]

    alerts_to_create = []

    for item in items:
        future_demand = (
            ForecastResult.objects.filter(
                inventory_item=item, date__in=next_3_days
            ).aggregate(total=Sum("forecasted_value"))["total"] or 0
        )

        # 1. Stockout (Critical)
        if Decimal(str(item.current_stock)) < Decimal(str(future_demand)):
            alerts_to_create.append(Alert(
                type="stockout",
                restaurant=restaurant,
                message=f"{item.name} inventory expected to run out within 3 days based on forecasted demand.",
                severity="critical",
            ))
            continue

        # 2. Low Stock (Warning)
        if item.current_stock <= item.reorder_level:
            alerts_to_create.append(Alert(
                type="stockout",
                restaurant=restaurant,
                message=f"{item.name} has reached its reorder level ({item.reorder_level} {item.unit or 'units'}).",
                severity="warning",
            ))

        # 3. Overstock (Info)
        if item.reorder_level > 0 and item.current_stock > (item.reorder_level * 10):
            alerts_to_create.append(Alert(
                type="overstock",
                restaurant=restaurant,
                message=f"{item.name} inventory exceeds optimal levels (over 10x reorder level).",
                severity="info",
            ))

        # 4. Demand Spike (Warning)
        avg_hist = ForecastResult.objects.filter(
            inventory_item=item, date__in=past_7_days
        ).aggregate(avg=Sum("historical_value"))["avg"]

        if avg_hist:
            avg_hist /= 7
            today_forecast = ForecastResult.objects.filter(
                inventory_item=item, date=today
            ).first()

            if today_forecast and today_forecast.forecasted_value > (avg_hist * 1.5):
                spike_pct = int(((today_forecast.forecasted_value / avg_hist) - 1) * 100)
                alerts_to_create.append(Alert(
                    type="spike",
                    restaurant=restaurant,
                    message=f"Sudden demand spike predicted for {item.name} (+{spike_pct}%).",
                    severity="warning",
                ))

    Alert.objects.bulk_create(alerts_to_create)
    print(f"[{restaurant.name}] Generated {len(alerts_to_create)} alerts.")


def generate_alerts():
    restaurants = Restaurant.objects.all()
    if not restaurants.exists():
        print("No restaurants found.")
        return
    for restaurant in restaurants:
        generate_alerts_for_restaurant(restaurant)


if __name__ == "__main__":
    generate_alerts()