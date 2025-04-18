
# Django Backend Implementation Guide

This file provides guidance on how to implement the Django backend for the Media Vault application.

## 1. Database Setup with PostgreSQL

```python
# settings.py

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'media_vault_db',
        'USER': 'postgres',
        'PASSWORD': 'your_password',
        'HOST': 'db',
        'PORT': '5432',
    }
}
```

## 2. Models

```python
# models.py

from django.db import models
from django.contrib.auth.models import User

class Folder(models.Model):
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=1024)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    parent_folder = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)

class File(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='files/%Y/%m/%d/')
    size = models.IntegerField()  # Size in bytes
    type = models.CharField(max_length=255)
    path = models.CharField(max_length=1024)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    folder = models.ForeignKey(Folder, null=True, blank=True, on_delete=models.SET_NULL)
    is_favorite = models.BooleanField(default=False)
    thumbnail = models.ImageField(upload_to='thumbnails/%Y/%m/%d/', null=True, blank=True)

    def generate_thumbnail(self):
        # Logic to generate thumbnail based on file type
        pass
```

## 3. API Endpoints

```python
# views.py

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import File, Folder
from .serializers import FileSerializer, FolderSerializer

class FileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FileSerializer

    def get_queryset(self):
        queryset = File.objects.filter(owner=self.request.user)
        
        # Filter by file type
        file_type = self.request.query_params.get('type', None)
        if file_type:
            if file_type == 'image':
                queryset = queryset.filter(type__startswith='image/')
            elif file_type == 'video':
                queryset = queryset.filter(type__startswith='video/')
            elif file_type == 'audio':
                queryset = queryset.filter(type__startswith='audio/')
            elif file_type == 'document':
                queryset = queryset.filter(models.Q(type__startswith='application/') | models.Q(type__startswith='text/'))
        
        # Filter favorites
        favorite = self.request.query_params.get('favorite', None)
        if favorite == 'true':
            queryset = queryset.filter(is_favorite=True)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        file = self.get_object()
        file.is_favorite = not file.is_favorite
        file.save()
        return Response({'status': 'favorite updated'})
    
    def perform_create(self, serializer):
        file_obj = serializer.save(owner=self.request.user)
        file_obj.generate_thumbnail()

class FolderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FolderSerializer
    
    def get_queryset(self):
        return Folder.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
```

## 4. Authentication

```python
# settings.py

INSTALLED_APPS = [
    # ... other apps
    'rest_framework',
    'rest_framework.authtoken',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
}
```

## 5. Media Handling

```python
# settings.py

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# For handling large file uploads
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100 MB
```

## 6. Dockerfile

```dockerfile
FROM python:3.10-slim as base

# Setup env
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONFAULTHANDLER 1
ENV PYTHONUNBUFFERED 1

FROM base AS python-deps

# Install pipenv and compilation dependencies
RUN pip install pipenv
RUN apt-get update && apt-get install -y --no-install-recommends gcc

# Install python dependencies in /.venv
COPY Pipfile .
COPY Pipfile.lock .
RUN PIPENV_VENV_IN_PROJECT=1 pipenv install --deploy

FROM base AS runtime

# Copy virtual env from python-deps stage
COPY --from=python-deps /.venv /.venv
ENV PATH="/.venv/bin:$PATH"

# Create and switch to a new user
RUN useradd --create-home appuser
WORKDIR /home/appuser
USER appuser

# Install application into container
COPY . .

# Run the application
ENTRYPOINT ["gunicorn", "mediavault.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## 7. Kubernetes Configuration

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
        image: mediavault:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: mediavault-secrets
              key: database_url
        volumeMounts:
        - name: mediavault-data
          mountPath: /home/appuser/media
      volumes:
      - name: mediavault-data
        persistentVolumeClaim:
          claimName: mediavault-pvc
```

### Persistent Volume

```yaml
# pv.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mediavault-pv
  labels:
    type: local
spec:
  storageClassName: manual
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/mnt/data"
```

### Persistent Volume Claim

```yaml
# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mediavault-pvc
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

### Service

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: mediavault-service
spec:
  selector:
    app: mediavault
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

## 8. Multi-platform Docker Build

```bash
# Build for multiple platforms
docker buildx create --name mybuilder --use
docker buildx build --platform linux/amd64,linux/arm64 -t username/mediavault:latest --push .
```

## 9. Video and Music Playback

Django would serve the media files, and the frontend would handle the playback with HTML5 video and audio elements. For streaming:

```python
# views.py
from django.http import FileResponse, Http404
from wsgiref.util import FileWrapper
import os, mimetypes

@action(detail=True, methods=['get'])
def stream(self, request, pk=None):
    file_obj = self.get_object()
    file_path = file_obj.file.path
    
    content_type, encoding = mimetypes.guess_type(file_path)
    if content_type is None:
        content_type = 'application/octet-stream'
        
    response = FileResponse(
        FileWrapper(open(file_path, 'rb')),
        content_type=content_type
    )
    
    response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
    return response
```
