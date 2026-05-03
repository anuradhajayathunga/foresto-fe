from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ForecastViewSet, AlertViewSet, DataUploadViewSet

router = DefaultRouter()
router.register(r'forecasts', ForecastViewSet)
router.register(r'alerts', AlertViewSet)
router.register(r'uploads', DataUploadViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
