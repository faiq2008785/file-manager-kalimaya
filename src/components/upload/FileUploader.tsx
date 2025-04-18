
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onUploadComplete?: (files: globalThis.File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export function FileUploader({ onUploadComplete, accept, multiple = true }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<{ file: File; progress: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).map(file => ({ file, progress: 0 }));
    setFiles(prevFiles => [...prevFiles, ...newFiles]);

    // Simulate upload progress for each file
    newFiles.forEach(({ file }, index) => {
      simulateUpload(file, files.length + index);
    });
  };

  const simulateUpload = (file: File, index: number) => {
    const interval = setInterval(() => {
      setFiles(prevFiles => {
        const updatedFiles = [...prevFiles];
        if (updatedFiles[index]) {
          const newProgress = updatedFiles[index].progress + 10;
          updatedFiles[index] = { ...updatedFiles[index], progress: newProgress };

          if (newProgress >= 100) {
            clearInterval(interval);
            toast({
              title: "Upload complete",
              description: `${file.name} has been uploaded successfully.`,
            });
            
            // If all files are uploaded, notify parent
            const allDone = updatedFiles.every(f => f.progress >= 100);
            if (allDone && onUploadComplete) {
              // In a real app, would return ids/urls from server
              onUploadComplete(updatedFiles.map(f => f.file));
            }
          }
        }
        return updatedFiles;
      });
    }, 300);
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileInputChange}
          accept={accept}
          multiple={multiple}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Drag files here or click to upload</h3>
          <p className="text-sm text-muted-foreground">
            {multiple ? "Upload multiple files" : "Upload a file"}
          </p>
          {accept && (
            <p className="text-xs text-muted-foreground">
              Accepted formats: {accept}
            </p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Uploading {files.length} files</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center border rounded-md p-2">
                <div className="p-2 rounded-md bg-muted mr-3">
                  <File className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file.name}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={file.progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {file.progress}%
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-2" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
