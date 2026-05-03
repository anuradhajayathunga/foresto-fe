from django.urls import path
from .views import record_waste

urlpatterns = [
    path("", record_waste, name="record_waste"),
]
