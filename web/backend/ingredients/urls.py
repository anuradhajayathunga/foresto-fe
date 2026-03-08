from django.urls import path
from .views import (
    IngredientListView,
    predict_price,
    get_commodities,
    menu_calc,
    recommend_suppliers,
    add_supplier,
)

urlpatterns = [
    path("", IngredientListView.as_view(), name="ingredient-list"),
    path("predict/", predict_price),
    path("commodities/", get_commodities),
    path("menu-calc/", menu_calc),
    path("suppliers/recommend/", recommend_suppliers),
    path("supplier-data/", add_supplier),
]
