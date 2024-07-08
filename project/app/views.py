from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password, check_password
from .models import User
import re
import logging
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.http import JsonResponse
import time

# 设置日志
logger = logging.getLogger(__name__)

# 定义密码格式的正则表达式
password_pattern = re.compile(r'^(?=.*[A-Z])(?=.*[a-z])(?=.*[\W_]).{8,}$')

def error_response(message, code, status_code):
    return Response({'error': {'message': message, 'code': code}}, status=status_code)

@api_view(['POST'])
def register(request):
    username = request.data.get('username')
    password = request.data.get('password')
    confirm_password = request.data.get('confirm_password')
    question_id = request.data.get('question_id')
    answer = request.data.get('answer')

    if not all([username, password, confirm_password, question_id, answer]):
        return error_response('All fields are required.', 'MISSING_FIELDS', status.HTTP_400_BAD_REQUEST)
    
    if not password_pattern.match(password):
        return error_response('Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, and a special character.', 'INVALID_PASSWORD_FORMAT', status.HTTP_400_BAD_REQUEST)

    if password != confirm_password:
        return error_response('Passwords do not match.', 'PASSWORDS_DO_NOT_MATCH', status.HTTP_400_BAD_REQUEST)

    try:
        if User.objects.filter(username=username).exists():
            return error_response('Username already exists.', 'USERNAME_EXISTS', status.HTTP_400_BAD_REQUEST)

        hashed_password = make_password(password)
        user = User.objects.create(username=username, password=hashed_password, question_id=question_id, answer=answer)
        user.save()
        return Response({'message': 'User registered successfully.'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error during registration: {e}")
        return error_response(str(e), 'SERVER_ERROR', status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not all([username, password]):
        return error_response('Username and password are required.', 'MISSING_CREDENTIALS', status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(username=username)
        if check_password(password, user.password):
            return Response({'auth': True, 'message': 'Login successful'}, status=status.HTTP_200_OK)
        else:
            return error_response('Incorrect password.', 'INVALID_PASSWORD', status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return error_response('User not found.', 'USER_NOT_FOUND', status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Unexpected error during login: {e}")
        return error_response(f'Server error: {str(e)}', 'SERVER_ERROR', status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def reset_password(request):
    username = request.data.get('username')
    question_id = request.data.get('question_id')
    answer = request.data.get('answer')
    new_password = request.data.get('new_password')

    if not all([username, question_id, answer, new_password]):
        return error_response('All fields are required.', 'MISSING_FIELDS', status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return error_response('Invalid username.', 'INVALID_USERNAME', status.HTTP_400_BAD_REQUEST)

    if user.question_id != question_id:
        return error_response('Invalid security question.', 'INVALID_QUESTION', status.HTTP_400_BAD_REQUEST)

    if user.answer != answer:
        return error_response('Invalid answer.', 'INVALID_ANSWER', status.HTTP_400_BAD_REQUEST)
    
    if not password_pattern.match(new_password):
        return error_response('Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, and a special character.', 'INVALID_PASSWORD_FORMAT', status.HTTP_400_BAD_REQUEST)

    if check_password(new_password, user.password):
        return error_response('New password cannot be the same as the old password.', 'SAME_OLD_PASSWORD', status.HTTP_400_BAD_REQUEST)
    
    try:
        user.password = make_password(new_password)
        user.save()
        return Response({'message': 'Password reset successfully.'}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error during password reset: {e}")
        return error_response(str(e), 'SERVER_ERROR', status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
def run_pipeline(request):
    if request.method == 'POST':
        algorithm = request.POST.get('algorithm')
        
        # 保存上传的文件
        uploaded_files = {
            'caseSample': [],
            'controlSample': [],
            'proteinSequence': [],
        }

        for file_type in uploaded_files.keys():
            if f'{file_type}_default' in request.POST:
                uploaded_files[file_type].append(request.POST[f'{file_type}_default'])
            else:
                files = request.FILES.getlist(file_type)
                for f in files:
                    file_name = default_storage.save(f.name, ContentFile(f.read()))
                    uploaded_files[file_type].append(file_name)
        
        # 返回接受成功的消息
        result = {
            'status': 'success',
            'algorithm': algorithm,
            'files': uploaded_files,
        }
        return Response(result, status=status.HTTP_200_OK)

    return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def pipeline_result(request):
    # 模拟处理时间
    time.sleep(10)  # 例如：10秒

    # 假设处理后的文件路径
    processed_file_path = default_storage.url('processed_file.txt')
    return Response({'file': processed_file_path}, status=status.HTTP_200_OK)