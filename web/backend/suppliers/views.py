from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count

from purchases.models import Supplier, PurchaseInvoice, PurchaseLine
from inventory.models import InventoryItem

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def suppliers_summary(request):
    restaurant = request.user.restaurant
    suppliers_qs = Supplier.objects.filter(restaurant=restaurant, is_active=True)
    
    data = []
    for s in suppliers_qs:
        # Since InventoryItem doesn't have default_supplier in group models,
        # we infer products count from past purchases
        product_count = PurchaseLine.objects.filter(
            invoice__supplier=s,
            invoice__restaurant=restaurant
        ).values("item").distinct().count()
        
        data.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "phone": s.phone,
            "products_count": product_count,
        })
    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def supplier_dashboard(request, supplier_id):
    restaurant = request.user.restaurant
    supplier = get_object_or_404(Supplier, id=supplier_id, restaurant=restaurant)
    
    # Calculate performance metrics or total spend
    total_spend = PurchaseInvoice.objects.filter(
        supplier=supplier, 
        status=PurchaseInvoice.Status.POSTED
    ).aggregate(total=Sum("total"))["total"] or 0
    
    recent_orders = PurchaseInvoice.objects.filter(
        supplier=supplier
    ).order_by("-invoice_date")[:5]
    
    recent_orders_data = [
        {
            "id": inv.id,
            "invoice_no": inv.invoice_no,
            "date": inv.invoice_date,
            "status": inv.status,
            "total": inv.total
        } for inv in recent_orders
    ]
    
    return Response({
        "supplier_name": supplier.name,
        "total_spend": total_spend,
        "recent_orders": recent_orders_data
    })
