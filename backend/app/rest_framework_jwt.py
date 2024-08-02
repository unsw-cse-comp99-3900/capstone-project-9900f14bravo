from rest_framework_jwt.views import obtain_jwt_token, refresh_jwt_token, verify_jwt_token
from rest_framework import permissions, generics, authentication
from django.conf.urls import url, include
from django.contrib.auth import views as auth_views
from django.urls import path
from rest_framework.authtoken import views as authtoken_views
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.authentication import SessionAuthentication, BasicAuthentication, TokenAuthentication
from .serializers import UserSerializer, AuthTokenSerializer
# URL patterns for Token authentication
urlpatterns = [
    # Login endpoint - '/api-token-auth/'
    path('api/token-auth/', obtain_jwt_token),
    # Refresh endpoint - '/api/token-refresh/'
    path('api/token-refresh/', refresh_jwt_token),
    # Verify endpoint - '/api/token-verify/'
    path('api/token-verify/', verify_jwt_token),
]