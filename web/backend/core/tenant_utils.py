from rest_framework.exceptions import ValidationError
from accounts.models import Restaurant


def resolve_target_restaurant_for_request(request, payload=None, field_name="restaurant_id"):
    """
    Non-superuser -> uses request.user.restaurant
    Superuser -> requires restaurant_id in payload/query params
    """
    user = request.user
    if not user.is_authenticated:
        raise ValidationError({"detail": "Authentication required."})

    if not user.is_superuser:
        restaurant = getattr(user, "restaurant", None)
        if not restaurant:
            raise ValidationError({"detail": "User has no restaurant assigned."})
        return restaurant

    payload = payload or {}
    rid = payload.get(field_name) or request.query_params.get(field_name)
    if not rid:
        raise ValidationError({field_name: "restaurant_id is required for superuser."})

    try:
        rid = int(rid)
    except (TypeError, ValueError):
        raise ValidationError({field_name: "restaurant_id must be an integer."})

    restaurant = Restaurant.objects.filter(pk=rid, is_active=True).first()
    if not restaurant:
        raise ValidationError({field_name: "Restaurant not found or inactive."})

    return restaurant