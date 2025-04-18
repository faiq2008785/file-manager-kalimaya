# Django Backend Implementation for Kalimaya Storage

## 1. Database Setup with PostgreSQL

```python
# settings.py

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'kalimaya_storage_db',
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

    def get_preview_url(self):
        if self.type.startswith('application/pdf'):
            return f'/api/files/{self.id}/pdf-preview/'
        elif self.type.startswith('application/msword') or \
             self.type.startswith('application/vnd.openxmlformats-officedocument.wordprocessingml.document'):
            return f'/api/files/{self.id}/doc-preview/'
        return None
```

## 3. Document Preview API

```python
# views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
import fitz  # PyMuPDF for PDF handling
from docx2pdf import convert  # for Word documents
import os
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import File, Folder
from .serializers import FileSerializer, FolderSerializer
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import File, Folder
from .serializers import FileSerializer, FolderSerializer
import mimetypes
from wsgiref.util import FileWrapper
from django.http import FileResponse, Http404

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

    @action(detail=True, methods=['get'])
    def pdf_preview(self, request, pk=None):
        file_obj = self.get_object()
        if not file_obj.type.startswith('application/pdf'):
            return Response({'error': 'Not a PDF file'}, status=400)
            
        # Generate preview
        doc = fitz.open(file_obj.file.path)
        first_page = doc[0]
        preview = first_page.get_pixmap()
        
        # Convert to image
        response = HttpResponse(content_type='image/png')
        preview.save(response, 'png')
        return response

    @action(detail=True, methods=['get'])
    def doc_preview(self, request, pk=None):
        file_obj = self.get_object()
        if not (file_obj.type.startswith('application/msword') or 
                file_obj.type.startswith('application/vnd.openxmlformats-officedocument')):
            return Response({'error': 'Not a Word document'}, status=400)
            
        # Convert to PDF first
        pdf_path = f'/tmp/{file_obj.id}.pdf'
        convert(file_obj.file.path, pdf_path)
        
        # Generate preview from PDF
        doc = fitz.open(pdf_path)
        first_page = doc[0]
        preview = first_page.get_pixmap()
        
        # Clean up
        os.remove(pdf_path)
        
        # Return preview
        response = HttpResponse(content_type='image/png')
        preview.save(response, 'png')
        return response
```

## 4. Required Dependencies

```python
# requirements.txt

Django==5.0.0
djangorestframework==3.14.0
psycopg2-binary==2.9.9
PyMuPDF==1.23.7  # for PDF handling
python-docx==1.0.1  # for Word documents
docx2pdf==0.1.8  # for Word to PDF conversion
Pillow==10.1.0  # for image handling
gunicorn==21.2.0
django-cors-headers==4.3.1
python-magic==0.4.27  # for file type detection
```

## 5. CORS Configuration

```python
# settings.py

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True
```

## 6. Media File Handling

```python
# settings.py

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

FILE_UPLOAD_HANDLERS = [
    'django.core.files.uploadhandler.MemoryFileUploadHandler',
    'django.core.files.uploadhandler.TemporaryFileUploadHandler',
]

# For handling large file uploads
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100 MB
```

## 7. Authentication

```python
# settings.py

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# For token authentication
INSTALLED_APPS += ['rest_framework.authtoken']
```

## 8. Document Preview Templates

```python
# templates/preview/document.html

{% extends 'base.html' %}

{% block content %}
<div class="document-viewer">
    {% if file.type == 'application/pdf' %}
        <embed src="{{ file.file.url }}" type="application/pdf" width="100%" height="600px">
    {% else %}
        <img src="{% url 'file-preview' file.id %}" alt="Document Preview">
    {% endif %}
</div>
{% endblock %}
```
