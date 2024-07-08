from django.urls import path
from .views import register, login, reset_password, run_pipeline, pipeline_result

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('reset-password/', reset_password, name='reset_password'),
    path('pipeline/', run_pipeline, name='run_pipeline'),
    path('pipeline/result', pipeline_result, name='pipeline_result'),
]