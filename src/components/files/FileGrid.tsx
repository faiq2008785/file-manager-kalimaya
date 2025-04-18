
import { useState } from "react";
import { Link } from "react-router-dom";
import { File, FileType } from "@/types/files";
import { FileCard } from "./FileCard";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Download,
  Pencil, 
  Star, 
  Trash2, 
  Share, 
  MoreVertical,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FileGridProps {
  files: File[];
  onDelete?: (id: number) => void;
  onRename?: (id: number, newName: string) => void;
  onToggleFavorite?: (id: number) => void;
}

export function FileGrid({ files, onDelete, onRename, onToggleFavorite }: FileGridProps) {
  const { toast } = useToast();
  const [contextMenuFile, setContextMenuFile] = useState<File | null>(null);

  const handleDelete = (id: number) => {
    if (onDelete) {
      onDelete(id);
      toast({
        title: "File deleted",
        description: "The file has been successfully deleted."
      });
    }
  };

  const handleRename = (id: number) => {
    if (onRename) {
      const file = files.find(f => f.id === id);
      if (file) {
        // In a real app, show a modal with input
        const newName = prompt("Enter new filename:", file.name);
        if (newName && newName !== file.name) {
          onRename(id, newName);
          toast({
            title: "File renamed",
            description: `File renamed to ${newName}`
          });
        }
      }
    }
  };

  const handleToggleFavorite = (id: number) => {
    if (onToggleFavorite) {
      onToggleFavorite(id);
      const file = files.find(f => f.id === id);
      toast({
        title: file?.is_favorite ? "Removed from favorites" : "Added to favorites",
        description: file?.is_favorite 
          ? "The file has been removed from favorites."
          : "The file has been added to favorites."
      });
    }
  };

  const handleDownload = (file: File) => {
    // In a real app, this would trigger a download
    toast({
      title: "Download started",
      description: `${file.name} is being downloaded.`
    });
  };

  const handleShare = (file: File) => {
    // In a real app, this would show a share modal
    navigator.clipboard.writeText(`https://example.com/file/${file.id}`);
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard."
    });
  };

  return (
    <div className="file-grid">
      {files.map((file) => (
        <div key={file.id} className="relative group">
          <Link to={`/file/${file.id}`} className="block">
            <FileCard file={file} />
          </Link>
          
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownload(file)}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Download</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRename(file.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToggleFavorite(file.id)}>
                  <Star className="mr-2 h-4 w-4" fill={file.is_favorite ? "currentColor" : "none"} />
                  <span>{file.is_favorite ? "Remove from favorites" : "Add to favorites"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare(file)}>
                  <Share className="mr-2 h-4 w-4" />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive" 
                  onClick={() => handleDelete(file.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
