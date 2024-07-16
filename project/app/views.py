from django.shortcuts import render, get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password, check_password
from django.conf import settings
from .models import User, UploadedFile
from .forms import UploadFilesForm
import re
import logging
import os
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny
from .algorithms.PIWAS import run_piwas
from .algorithms.PIE import run_pie
from .algorithms.PIWAS_plot import process_piwas_scores
from .algorithms.PIE_plot import plot_protein_data
from django.http import FileResponse
import mimetypes
# 设置日志
logger = logging.getLogger(__name__)

# 定义密码格式的正则表达式
password_pattern = re.compile(r'^(?=.*[A-Z])(?=.*[a-z])(?=.*[\W_]).{8,}$')

def error_response(message, code, status_code):
    return Response({'error': {'message': message, 'code': code}}, status=status_code)


def save_uploaded_file(file, file_type, user):
    try:
        upload_dir = os.path.join(settings.MEDIA_ROOT, file_type)
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.name)
        logger.info(f"Saving file to {file_path}")
        
        with open(file_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        
        # Save file information in the database
        UploadedFile.objects.create(user=user, file=file_path, file_type=file_type)
        logger.info(f"File {file.name} saved successfully.")
        return file_path
    except Exception as e:
        logger.error(f"Error saving file {file.name}: {e}")
        raise

@api_view(['POST'])
@permission_classes([AllowAny])
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
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not all([username, password]):
        return error_response('Username and password are required.', 'MISSING_CREDENTIALS', status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(username=username)
        if check_password(password, user.password):
            # 用户验证成功，生成Token
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'auth': True,
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)
        else:
            return error_response('Incorrect password.', 'INVALID_PASSWORD', status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return error_response('User not found.', 'USER_NOT_FOUND', status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Unexpected error during login: {e}")
        return error_response(f'Server error: {str(e)}', 'SERVER_ERROR', status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
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
@parser_classes([MultiPartParser, FormParser])
def upload_case_files(request):
    logger.info("Received upload request for case files")
    user = request.user
    case_files = request.FILES.getlist('case_files')
    logger.info(f"Received case files: {case_files}")

    if not case_files:
        return Response({'error': {'case_files': 'No case files were submitted.'}}, status=status.HTTP_400_BAD_REQUEST)

    try:
        file_paths = []
        for file in case_files:
            logger.info(f"Saving case file: {file.name}")
            file_path = save_uploaded_file(file, 'case', user)
            file_paths.append(file_path)
        return Response({'message': 'Case files uploaded successfully!', 'file_paths': file_paths}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error during case file upload: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_control_files(request):
    logger.info("Received upload request for control files")
    user = request.user
    control_files = request.FILES.getlist('control_files')
    logger.info(f"Received control files: {control_files}")

    if not control_files:
        return Response({'error': {'control_files': 'No control files were submitted.'}}, status=status.HTTP_400_BAD_REQUEST)

    try:
        file_paths = []
        for file in control_files:
            logger.info(f"Saving control file: {file.name}")
            file_path = save_uploaded_file(file, 'control', user)
            file_paths.append(file_path)
        return Response({'message': 'Control files uploaded successfully!', 'file_paths': file_paths}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error during control file upload: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_protein_file(request):
    logger.info("Received upload request for protein file")
    user = request.user
    protein_file = request.FILES.get('protein_file')
    logger.info(f"Received protein file: {protein_file}")

    if not protein_file:
        return Response({'error': {'protein_file': 'No protein file was submitted.'}}, status=status.HTTP_400_BAD_REQUEST)

    try:
        logger.info(f"Saving protein file: {protein_file.name}")
        file_path = save_uploaded_file(protein_file, 'protein', user)
        return Response({'message': 'Protein file uploaded successfully!', 'file_path': file_path}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error during protein file upload: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_piwas_results(request):
    logger.info("Received upload request for PIWAS result files")
    user = request.user
    piwas_result_files = request.FILES.getlist('piwas_result_files')
    logger.info(f"Received PIWAS result files: {piwas_result_files}")

    if not piwas_result_files:
        return Response({'error': {'piwas_result_files': 'No PIWAS result files were submitted.'}}, status=status.HTTP_400_BAD_REQUEST)

    try:
        file_paths = []
        for file in piwas_result_files:
            logger.info(f"Saving PIWAS result file: {file.name}")
            file_path = save_uploaded_file(file, 'uploaded-PIWAS-result', user)
            file_paths.append(file_path)
        return Response({'message': 'PIWAS result files uploaded successfully!', 'file_paths': file_paths}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error during PIWAS result file upload: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def run_piwas_algorithm(request):
    try:
        case_file_paths = request.data.get('case_file_paths')
        control_file_paths = request.data.get('control_file_paths')
        protein_file_path = request.data.get('protein_file_path')
        user = request.user

        if not case_file_paths or not control_file_paths or not protein_file_path:
            return Response({'error': 'Required files are missing'}, status=status.HTTP_400_BAD_REQUEST)

        result_dir = os.path.join(settings.MEDIA_ROOT, 'PIWAS-result')
        os.makedirs(result_dir, exist_ok=True)

        case_file_name, control_file_name = run_piwas(case_file_paths, control_file_paths, protein_file_path, result_dir)
        
        plot_file_path = process_piwas_scores(
            os.path.join(result_dir, case_file_name),
            os.path.join(result_dir, control_file_name),
            result_dir
        )
    

        result_file_paths = {
            'piwas_case_result': os.path.join(result_dir, case_file_name),
            'piwas_control_result': os.path.join(result_dir, control_file_name),
            'plot_file': plot_file_path
        }

        logger.info(f"PIWAS result file paths: {result_file_paths}")

        return Response({'status': 'success', 'file_paths': result_file_paths}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error running PIWAS algorithm: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
def run_pie_algorithm(request):
    try:
        piwas_case_file_path = request.data.get('piwas_case_file_path')
        piwas_control_file_path = request.data.get('piwas_control_file_path')
        protein_file_path = request.data.get('protein_file_path')
        user = request.user

        if not piwas_case_file_path or not piwas_control_file_path or not protein_file_path:
            return Response({'error': 'Required files are missing'}, status=status.HTTP_400_BAD_REQUEST)

        result_dir = os.path.join(settings.MEDIA_ROOT, 'PIE-result')
        os.makedirs(result_dir, exist_ok=True)

        total_result_path,top_5_result_path=run_pie(piwas_case_file_path, piwas_control_file_path, protein_file_path, result_dir)
        plot_file_path=plot_protein_data(total_result_path,top_5_result_path,result_dir)
        result_file_paths = {
            'total_results': total_result_path,
            'top_5_percent': top_5_result_path,
            'plot_file': plot_file_path
        }

        return Response({'status': 'success', 'file_paths': result_file_paths}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error running PIE algorithm: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
def run_piwas_pie_algorithm(request):
    try:
        case_file_paths = request.data.get('case_file_paths')
        control_file_paths = request.data.get('control_file_paths')
        protein_file_path = request.data.get('protein_file_path')
        user = request.user

        if not case_file_paths or not control_file_paths or not protein_file_path:
            return Response({'error': 'Required files are missing'}, status=status.HTTP_400_BAD_REQUEST)

        result_dir = os.path.join(settings.MEDIA_ROOT, 'PIWAS&PIE-result')
        os.makedirs(result_dir, exist_ok=True)

        case_file_name, control_file_name = run_piwas(case_file_paths, control_file_paths, protein_file_path, result_dir)
        total_result_path,top_5_result_path = run_pie(
            piwas_case_file_path=os.path.join(result_dir, case_file_name),
            piwas_control_file_path=os.path.join(result_dir, control_file_name),
            protein_file_path=protein_file_path,
            result_dir=result_dir
        )

        plot_piwas_path = process_piwas_scores(
            file_path1=os.path.join(result_dir, case_file_name),
            file_path2=os.path.join(result_dir, control_file_name),
            result_dir=result_dir
        )

        plot_pie_path=plot_protein_data(total_result_path,top_5_result_path,result_dir)

        result_file_paths = {
            'piwas_case_result': os.path.join(result_dir, case_file_name),
            'piwas_control_result': os.path.join(result_dir, control_file_name),
            'total_results': total_result_path,
            'top_5_percent': top_5_result_path,
            'plot_file1': plot_piwas_path,
            'plot_file2': plot_pie_path,
        }

        return Response({'status': 'success', 'file_paths': result_file_paths}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error running PIWAS+PIE algorithm: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
def download_result_file(request):
    file_path = request.query_params.get('file_path')
    if not file_path:
        return Response({'error': 'file_path parameter is missing'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if not os.path.exists(file_path):
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)

        file_name = os.path.basename(file_path)
        mime_type, _ = mimetypes.guess_type(file_path)
        response = FileResponse(open(file_path, 'rb'), content_type=mime_type)
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response
    except Exception as e:
        logger.error(f"Error fetching file: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
