
FROM python:3.12

WORKDIR /app


COPY requirements.txt ./ 
RUN pip install --no-cache-dir -r requirements.txt


COPY . .


RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup
USER appuser


EXPOSE 8000

ENV PYTHONUNBUFFERED=1


CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]

