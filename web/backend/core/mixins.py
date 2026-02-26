from django.core.exceptions import FieldError

from core.tenant_utils import resolve_target_restaurant_for_request


class RestaurantScopedQuerysetMixin:
    """
    Scopes queryset to authenticated user's restaurant.
    Set restaurant_lookup for nested lookups (e.g. "menu_item__restaurant", "item__restaurant").
    """
    restaurant_lookup = "restaurant"

    def get_queryset(self):
        qs = super().get_queryset()
        user = getattr(self.request, "user", None)

        if not user or not user.is_authenticated:
            return qs.none()

        # platform superuser can see all (optionally filter by ?restaurant_id=...)
        if user.is_superuser:
            restaurant_id = self.request.query_params.get("restaurant_id")
            if restaurant_id:
                try:
                    return qs.filter(**{f"{self.restaurant_lookup}_id": int(restaurant_id)})
                except (ValueError, FieldError):
                    return qs.none()
            return qs

        restaurant_id = getattr(user, "restaurant_id", None)
        if not restaurant_id:
            return qs.none()

        try:
            return qs.filter(**{f"{self.restaurant_lookup}_id": restaurant_id})
        except FieldError:
            # safety fallback if a model doesn't have the expected relation yet
            return qs.none()

    def perform_create(self, serializer):
        user = getattr(self.request, "user", None)
        model = getattr(getattr(serializer, "Meta", None), "model", None)

        if model and any(f.name == "restaurant" for f in model._meta.fields):
            if user and user.is_authenticated:
                restaurant = resolve_target_restaurant_for_request(self.request, getattr(serializer, "validated_data", {}) or {})
                serializer.save(restaurant=restaurant)
                return

        serializer.save()
