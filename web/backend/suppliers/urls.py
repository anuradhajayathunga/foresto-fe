from django.urls import path
from .views import suppliers_summary, supplier_dashboard

urlpatterns = [
    path("summary/", suppliers_summary, name="suppliers-summary"),
    path("<int:supplier_id>/dashboard/", supplier_dashboard, name="supplier-dashboard"),
]
