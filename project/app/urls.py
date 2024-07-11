from django.urls import path
from .views import register, login, reset_password,upload_case_files, upload_control_files, upload_protein_file,upload_piwas_results, run_piwas_algorithm, run_pie_algorithm, run_piwas_pie_algorithm
urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('reset-password/', reset_password, name='reset_password'),
    path('upload-case-files/', upload_case_files, name='upload_case_files'),
    path('upload-control-files/', upload_control_files, name='upload_control_files'),
    path('upload-protein-file/', upload_protein_file, name='upload_protein_file'),
    path('upload-piwas-results/', upload_piwas_results, name='upload_piwas_results'),
    path('run-piwas-algorithm/', run_piwas_algorithm, name='run_piwas_algorithm'),
    path('run-pie-algorithm/', run_pie_algorithm, name='run_pie_algorithm'),
    path('run-piwas+pie-algorithm/', run_piwas_pie_algorithm, name='run_piwas_algorithm'),
]