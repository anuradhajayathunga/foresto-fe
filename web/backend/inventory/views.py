from django.db.models import F
from decimal import Decimal
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.mixins import RestaurantScopedQuerysetMixin
from core.tenant_utils import resolve_target_restaurant_for_request
from inventory.services_buffer import update_buffer_sizes_from_waste_rates
from .models import InventoryItem, StockMovement
from .permissions import IsStaff
from .serializers import (
    InventoryItemSerializer,
    StockMovementCreateSerializer,
    StockMovementSerializer,
)


class InventoryItemViewSet(RestaurantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsStaff]
    filterset_fields = ["is_active", "unit"]
    search_fields = ["name", "sku"]
    ordering_fields = ["name", "current_stock", "reorder_level", "updated_at"]

    @action(detail=False, methods=["get"])
    def low_stock(self, request):
        qs = self.get_queryset().filter(
            is_active=True,
            current_stock__lte=F("reorder_level"),
        ).order_by("name")
        data = InventoryItemSerializer(qs, many=True).data
        return Response(data)

    @action(detail=False, methods=["get"], url_path="buffer-preview")
    def buffer_preview(self, request):
        try:
            lookback_days = int(request.query_params.get("lookback_days", "14"))
            buffer_days = int(request.query_params.get("buffer_days", "3"))
            alpha = Decimal(str(request.query_params.get("alpha", "0.6")))
        except Exception:
            return Response(
                {"detail": "lookback_days, buffer_days and alpha must be numeric."},
                status=400,
            )

        lookback_days = max(1, min(lookback_days, 90))
        buffer_days = max(1, min(buffer_days, 30))

        restaurant = resolve_target_restaurant_for_request(request)
        result = update_buffer_sizes_from_waste_rates(
            restaurant_id=restaurant.id,
            lookback_days=lookback_days,
            buffer_days=buffer_days,
            alpha=alpha,
            dry_run=True,
        )
        return Response(result)


class StockMovementViewSet(
    RestaurantScopedQuerysetMixin,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = StockMovement.objects.select_related("item", "created_by").all()
    permission_classes = [IsStaff]
    filterset_fields = ["movement_type", "item"]
    search_fields = ["item__name", "item__sku", "reason", "note"]
    ordering_fields = ["created_at", "quantity"]
    restaurant_lookup = "item__restaurant"

    def get_serializer_class(self):
        if self.action == "create":
            return StockMovementCreateSerializer
        return StockMovementSerializer

    def create(self, request, *args, **kwargs):
        serializer = StockMovementCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        movement = serializer.save()

        out = StockMovementSerializer(movement, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)
