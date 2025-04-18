
import { File, FileType } from "@/types/files";
import { 
  FileIcon, 
  ImageIcon, 
  VideoIcon, 
  AudioLines, 
  FileText, 
  FileArchive, 
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface FileCardProps {
  file: File;
  compact?: boolean;
}

export function FileCard({ file, compact = false }: FileCardProps) {
  const getFileIcon = () => {
    const iconClass = "h-12 w-12";
    
    if (file.type.startsWith("image/")) {
      return <ImageIcon className={iconClass} />;
    } else if (file.type.startsWith("video/")) {
      return <VideoIcon className={iconClass} />;
    } else if (file.type.startsWith("audio/")) {
      return <AudioLines className={iconClass} />;
    } else if (file.type.startsWith("text/") || file.type.includes("document")) {
      return <FileText className={iconClass} />;
    } else if (file.type.includes("zip") || file.type.includes("archive")) {
      return <FileArchive className={iconClass} />;
    } else {
      return <FileIcon className={iconClass} />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFilePreview = () => {
    if (file.type.startsWith("image/") && file.thumbnail) {
      return (
        <div className="aspect-square w-full rounded-md overflow-hidden bg-muted">
          <img 
            src={file.thumbnail} 
            alt={file.name}
            className="h-full w-full object-cover transition-all hover:scale-105"
          />
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center aspect-square w-full bg-muted rounded-md">
        {getFileIcon()}
      </div>
    );
  };

  return (
    <div className={cn(
      "group rounded-lg border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden",
      compact ? "p-2" : ""
    )}>
      <div className="relative">
        {getFilePreview()}
        
        {file.is_favorite && (
          <div className="absolute top-2 right-2">
            <Star className="h-5 w-5 fill-accent text-accent" />
          </div>
        )}
        
        {file.type.startsWith("video/") && (
          <div className="absolute bottom-2 right-2 bg-background/80 rounded-md px-1.5 py-0.5 text-xs">
            {/* This would show video duration in a real app */}
            03:45
          </div>
        )}
      </div>
      
      <div className="p-3">
        <div className="truncate font-medium" title={file.name}>
          {file.name}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <span>{formatFileSize(file.size)}</span>
          <span>{formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
}
