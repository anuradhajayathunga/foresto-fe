from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import MyRestaurantsView, RegisterView, MeView, TeamUserViewSet, CustomTokenView
from .jwt import EmailTokenObtainPairView

router = DefaultRouter()
router.register("team-users", TeamUserViewSet, basename="team-users")

urlpatterns = [
    path("register/", RegisterView.as_view()),     # owner register + restaurant create
    path('token/', CustomTokenView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),path("me/", MeView.as_view()),
    path("", include(router.urls)),
    path("my-restaurants/", MyRestaurantsView.as_view(), name="my-restaurants"),
]
