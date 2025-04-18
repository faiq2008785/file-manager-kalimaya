
# Multi-Platform Dockerfile for Media Vault

This file provides a comprehensive guide to building a multi-platform Docker image for the Media Vault application, with support for both amd64 and arm64 architectures.

## Basic Dockerfile

```dockerfile
# syntax=docker/dockerfile:1

# Base Python image - supports both AMD64 and ARM64
FROM --platform=$BUILDPLATFORM python:3.10-slim AS builder

# Setup environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=mediavault.settings

# Set work directory
WORKDIR /app

# Install build dependencies and tools needed for both architectures
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install pip and upgrade
RUN pip install --upgrade pip wheel setuptools

# Copy requirements first for better cache
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Use separate final images for each architecture
FROM --platform=$TARGETPLATFORM python:3.10-slim AS final

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=mediavault.settings

# Create a non-root user
RUN useradd -m appuser

# Set work directory
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder
COPY --from=builder /app/wheels /wheels
# Install the Python packages
RUN pip install --no-cache /wheels/*

# Copy project files
COPY --chown=appuser:appuser . .

# Create media and static directories
RUN mkdir -p /app/media /app/static && chown -R appuser:appuser /app/media /app/static

# Switch to non-root user
USER appuser

# Run database migrations on container startup
RUN chmod +x /app/docker-entrypoint.sh

# Expose the Django application port
EXPOSE 8000

# Set the entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command
CMD ["gunicorn", "mediavault.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## Docker Entrypoint Script

```bash
#!/bin/bash
# docker-entrypoint.sh

set -e

# Wait for PostgreSQL to be ready
until PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c '\q'; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

>&2 echo "PostgreSQL is up - executing command"

# Apply database migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Create superuser if needed (environment variables should be set)
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
  python manage.py createsuperuser --noinput
fi

# Execute the CMD from Dockerfile
exec "$@"
```

## Building Multi-Architecture Images with Docker Buildx

To build for multiple platforms, you need to use Docker Buildx, which is Docker's multi-architecture build system:

```bash
# Create and use a builder instance that supports multi-architecture builds
docker buildx create --name multiarch-builder --use

# Build and push multi-platform image
docker buildx build --platform linux/amd64,linux/arm64 \
  -t yourdockerhub/mediavault:latest \
  --push .
```

## Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:14
    platform: ${TARGETPLATFORM:-linux/amd64}
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    environment:
      - POSTGRES_DB=mediavault
      - POSTGRES_USER=mediavault_user
      - POSTGRES_PASSWORD=mediavault_password
    ports:
      - "5432:5432"

  web:
    build: 
      context: .
      dockerfile: Dockerfile
    platform: ${TARGETPLATFORM:-linux/amd64}
    volumes:
      - ./:/app/
      - media_data:/app/media
      - static_data:/app/static
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - POSTGRES_DB=mediavault
      - POSTGRES_USER=mediavault_user
      - POSTGRES_PASSWORD=mediavault_password
      - POSTGRES_HOST=db
      - DJANGO_SUPERUSER_USERNAME=admin
      - DJANGO_SUPERUSER_PASSWORD=admin_password
      - DJANGO_SUPERUSER_EMAIL=admin@example.com

volumes:
  postgres_data:
  media_data:
  static_data:
```

## Kubernetes Deployment Files

### Persistent Volume and Claim

```yaml
# pv-pvc.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mediavault-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  hostPath:
    path: "/mnt/data"
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mediavault-pvc
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
  storageClassName: manual
```

### Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mediavault
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mediavault
  template:
    metadata:
      labels:
        app: mediavault
    spec:
      containers:
      - name: mediavault
        image: yourdockerhub/mediavault:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8000
        env:
        - name: POSTGRES_DB
          valueFrom:
            secretKeyRef:
              name: mediavault-secrets
              key: postgres_db
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: mediavault-secrets
              key: postgres_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mediavault-secrets
              key: postgres_password
        - name: POSTGRES_HOST
          valueFrom:
            configMapKeyRef:
              name: mediavault-config
              key: postgres_host
        volumeMounts:
        - name: mediavault-data
          mountPath: /app/media
      volumes:
      - name: mediavault-data
        persistentVolumeClaim:
          claimName: mediavault-pvc
```

### Service

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: mediavault
spec:
  selector:
    app: mediavault
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

### Secrets and ConfigMap

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: mediavault-secrets
type: Opaque
data:
  postgres_db: bWVkaWF2YXVsdA==        # Base64 encoded "mediavault"
  postgres_user: bWVkaWF2YXVsdF91c2Vy  # Base64 encoded "mediavault_user"
  postgres_password: cGFzc3dvcmQ=       # Base64 encoded "password"
---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mediavault-config
data:
  postgres_host: "postgres-service"
```

### PostgreSQL Deployment

```yaml
# postgres-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          valueFrom:
            secretKeyRef:
              name: mediavault-secrets
              key: postgres_db
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: mediavault-secrets
              key: postgres_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mediavault-secrets
              key: postgres_password
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-data
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  clusterIP: None
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: manual
```
