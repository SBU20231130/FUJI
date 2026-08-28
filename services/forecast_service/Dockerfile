FROM python:3.12-slim

WORKDIR /app
COPY services/forecast_service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY services /app/services

EXPOSE 8000
CMD ["uvicorn", "services.forecast_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
