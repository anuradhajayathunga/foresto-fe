from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ForecastResult, Alert, DataUpload
from .serializers import ForecastResultSerializer, AlertSerializer, DataUploadSerializer
from inventory.models import InventoryItem
from django.db.models import F
from django.utils import timezone


class ForecastViewSet(viewsets.ModelViewSet):
    queryset = ForecastResult.objects.all()
    serializer_class = ForecastResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant_id = (
            self.request.headers.get("X-Restaurant-ID")
            or self.request.META.get("HTTP_X_RESTAURANT_ID")
        )
        if restaurant_id:
            return ForecastResult.objects.filter(
                inventory_item__restaurant_id=restaurant_id
            )
        return ForecastResult.objects.none()

    @action(detail=False, methods=["get"])
    def dashboard_stats(self, request):
        restaurant_id = (
            request.headers.get("X-Restaurant-ID")
            or request.META.get("HTTP_X_RESTAURANT_ID")
        )

        forecasts = ForecastResult.objects.all()
        alerts = Alert.objects.filter(is_read=False)
        items = InventoryItem.objects.all()

        if restaurant_id:
            forecasts = forecasts.filter(inventory_item__restaurant_id=restaurant_id)
            items = items.filter(restaurant_id=restaurant_id)
            alerts = alerts.filter(restaurant_id=restaurant_id)

        total_demand = sum(f.forecasted_value for f in forecasts)
        stockouts = alerts.filter(type="stockout").count()
        inventory_level = sum(i.current_stock for i in items)
        low_stock = items.filter(current_stock__lte=F("reorder_level")).count()

        return Response({
            "total_forecasted_demand": total_demand or 0,
            "predicted_stockouts": stockouts or 0,
            "inventory_level": inventory_level or 0,
            "low_stock_items": low_stock or 0,
        })


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant_id = (
            self.request.headers.get("X-Restaurant-ID")
            or self.request.META.get("HTTP_X_RESTAURANT_ID")
        )
        if restaurant_id:
            return Alert.objects.filter(restaurant_id=restaurant_id)
        return Alert.objects.none()

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        restaurant_id = (
            request.headers.get("X-Restaurant-ID")
            or request.META.get("HTTP_X_RESTAURANT_ID")
        )
        qs = Alert.objects.filter(is_read=False)
        if restaurant_id:
            qs = qs.filter(restaurant_id=restaurant_id)
        updated = qs.update(is_read=True)
        return Response({"status": "ok", "updated": updated})

    @action(detail=True, methods=["post"])
    def dismiss(self, request, pk=None):
        alert = self.get_object()
        alert.delete()
        return Response({"status": "dismissed"})

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        return Response({"status": "resolved"})


class DataUploadViewSet(viewsets.ModelViewSet):
    queryset = DataUpload.objects.all()
    serializer_class = DataUploadSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(status="processing", progress=10)