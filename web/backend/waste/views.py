from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from decimal import Decimal

from inventory.models import InventoryItem, StockMovement

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def record_waste(request):
    restaurant = request.user.restaurant
    item_id = request.data.get("ingredient_id") or request.data.get("item_id")
    
    try:
        quantity = Decimal(str(request.data.get("quantity", 0)))
    except (ValueError, TypeError):
        return Response({"error": "Invalid quantity"}, status=400)

    notes = request.data.get("notes", "")

    item = get_object_or_404(InventoryItem, id=item_id, restaurant=restaurant)

    if item.current_stock < quantity:
        return Response({"error": "Not enough stock to record waste"}, status=400)

    with transaction.atomic():
        item.current_stock -= quantity
        item.save()

        StockMovement.objects.create(
            item=item,
            restaurant=restaurant,
            movement_type=StockMovement.Type.OUT,
            quantity=quantity,
            reason="Waste",
            note=notes,
            created_by=request.user
        )

    return Response({
        "message": "Waste recorded successfully",
        "remaining_stock": item.current_stock
    })
