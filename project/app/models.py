from django.db import models
from django.contrib.auth.hashers import make_password

class User(models.Model):
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=128)
    question_id = models.IntegerField()  
    answer = models.CharField(max_length=255)

    

