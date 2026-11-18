
# Python runtime
FROM python:3.13-slim

# Python container settings
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Application folder
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application and Alembic files
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Use a non-root user
RUN useradd --create-home appuser \
    && chown -R appuser:appuser /app

USER appuser

# FastAPI port
EXPOSE 8000

# Start FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
