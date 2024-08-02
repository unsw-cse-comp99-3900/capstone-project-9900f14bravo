from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    question_id = models.IntegerField(null=True, blank=True)
    answer = models.CharField(max_length=255, null=True, blank=True)

class UploadedFile(models.Model):
    FILE_TYPES = [
        ('case', 'Case Sample'),
        ('control', 'Control Sample'),
        ('protein', 'Protein Sequence'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file = models.FileField(upload_to='uploads/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPES)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    

