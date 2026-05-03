from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/menu/", include("menu.urls")),
    path("api/sales/", include("sales.urls")),
    path("api/inventory/", include("inventory.urls")),
    path("api/purchases/", include("purchases.urls")),
    path("api/import/", include("imports.urls")),
    path("api/forecasting/", include("forecasting.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/waste/", include("waste.urls")),
    path("api/suppliers/", include("suppliers.urls")),

]
