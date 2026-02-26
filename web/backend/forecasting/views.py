from rest_framework.response import Response
from rest_framework.views import APIView

from inventory.permissions import IsStaff
from core.tenant_utils import resolve_target_restaurant_for_request
from .services import predict_menu_demand
from .services_history import predict_past_days
from .services_ingredients import build_ingredient_plan


class DemandForecastView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        try:
            horizon = int(request.query_params.get("horizon_days", "7"))
            top_n = int(request.query_params.get("top_n", "50"))
        except ValueError:
            return Response({"detail": "horizon_days and top_n must be integers."}, status=400)

        horizon = max(1, min(horizon, 30))
        top_n = max(1, min(top_n, 500))

        if request.user.is_superuser:
            restaurant = resolve_target_restaurant_for_request(request)
            restaurant_id = restaurant.id
        else:
            restaurant_id = getattr(request.user, "restaurant_id", None)
            if not restaurant_id:
                return Response({"detail": "User has no restaurant assigned."}, status=400)

        data = predict_menu_demand(horizon_days=horizon, top_n=top_n, restaurant_id=restaurant_id)
        return Response(data)


class ForecastHistoryView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        try:
            days = int(request.query_params.get("days", "14"))
            top_n = int(request.query_params.get("top_n", "50"))
        except ValueError:
            return Response({"detail": "days and top_n must be integers."}, status=400)

        days = max(1, min(days, 90))
        top_n = max(1, min(top_n, 500))

        if request.user.is_superuser:
            restaurant = resolve_target_restaurant_for_request(request)
            restaurant_id = restaurant.id
        else:
            restaurant_id = getattr(request.user, "restaurant_id", None)
            if not restaurant_id:
                return Response({"detail": "User has no restaurant assigned."}, status=400)

        data = predict_past_days(days=days, top_n=top_n, restaurant_id=restaurant_id)
        return Response(data)


class IngredientPlanView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        try:
            horizon = int(request.query_params.get("horizon_days", "7"))
            top_n = int(request.query_params.get("top_n", "50"))
        except ValueError:
            return Response({"detail": "horizon_days and top_n must be integers."}, status=400)

        horizon = max(1, min(horizon, 30))
        top_n = max(1, min(top_n, 500))

        scope = (request.query_params.get("scope", "next7") or "next7").lower()
        if scope not in ("tomorrow", "next7"):
            scope = "next7"

        if request.user.is_superuser:
            restaurant = resolve_target_restaurant_for_request(request)
            restaurant_id = restaurant.id
        else:
            restaurant_id = getattr(request.user, "restaurant_id", None)
            if not restaurant_id:
                return Response({"detail": "User has no restaurant assigned."}, status=400)

        data = build_ingredient_plan(
            horizon_days=horizon,
            top_n_items=top_n,
            scope=scope,
            restaurant_id=restaurant_id,
        )
        return Response(data)
