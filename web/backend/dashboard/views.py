from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Sum, F

from sales.models import Sale, SaleItem
from inventory.models import InventoryItem
from purchases.models import PurchaseInvoice

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    restaurant = request.user.restaurant

    # Total Sales quantity
    total_sales = SaleItem.objects.filter(sale__restaurant=restaurant).aggregate(
        total=Sum("qty")
    )["total"] or 0

    # Low stock count
    low_stock_count = InventoryItem.objects.filter(
        restaurant=restaurant,
        is_active=True,
        current_stock__lte=F("reorder_level")
    ).count()

    # Pending purchase orders (Draft Invoices)
    pending_pos = PurchaseInvoice.objects.filter(
        restaurant=restaurant,
        status=PurchaseInvoice.Status.DRAFT
    ).count()

    # Total inventory units
    inventory_units = InventoryItem.objects.filter(
        restaurant=restaurant,
        is_active=True
    ).aggregate(
        total=Sum("current_stock")
    )["total"] or 0

    # Sales items for chart
    sales_items = (
        SaleItem.objects.filter(sale__restaurant=restaurant)
        .values("name")
        .annotate(quantity=Sum("qty"))
        .order_by("-quantity")[:10]
    )

    sales_items_data = [
        {
            "ingredient_name": item["name"],
            "quantity": item["quantity"]
        }
        for item in sales_items
    ]

    # Inventory items for chart
    inventory_items = (
        InventoryItem.objects.filter(restaurant=restaurant, is_active=True)
        .values("name", "current_stock")
    )

    inventory_items_data = [
        {
            "ingredient_name": item["name"],
            "quantity_on_hand": item["current_stock"]
        }
        for item in inventory_items
    ]

    return Response({
        "total_sales": total_sales,
        "low_stock_items": low_stock_count,
        "pending_purchase_orders": pending_pos,
        "total_inventory_units": inventory_units,
        "sales_items": sales_items_data,
        "inventory_items": inventory_items_data
    })
