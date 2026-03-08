from rest_framework.routers import DefaultRouter
from kitchen.views import MenuItemProductionViewSet, MenuItemWasteViewSet, KitchenPurchaseRequestViewSet

router = DefaultRouter()
router.register(r"productions", MenuItemProductionViewSet, basename="kitchen-productions")
router.register(r"wastes", MenuItemWasteViewSet, basename="kitchen-wastes")
router.register(r"purchase-requests", KitchenPurchaseRequestViewSet, basename="kitchen-purchase-requests")

urlpatterns = router.urls