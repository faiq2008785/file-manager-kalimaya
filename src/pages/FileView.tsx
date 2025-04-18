
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Star, 
  Share, 
  Trash2,
  ArrowLeft,
  File as FileIcon,
  Image as ImageIcon,
  FileText
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getFileById } from "@/utils/fileMock";
import { File as FileType } from "@/types/files";

const FileView = () => {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<FileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      const fileId = parseInt(id);
      const fetchedFile = getFileById(fileId);
      
      if (fetchedFile) {
        setFile(fetchedFile);
        setIsFavorite(fetchedFile.is_favorite);
        document.title = `${fetchedFile.name} - Media Vault`;
      } else {
        toast({
          title: "File not found",
          description: "The requested file could not be found.",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    }
    setIsLoading(false);
  }, [id, navigate, toast]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: `${file?.name} is being downloaded.`
    });
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: isFavorite 
        ? "The file has been removed from favorites."
        : "The file has been added to favorites."
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`https://example.com/file/${id}`);
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard."
    });
  };

  const handleDelete = () => {
    toast({
      title: "File deleted",
      description: "The file has been successfully deleted."
    });
    navigate("/dashboard");
  };

  const renderFilePreview = () => {
    if (!file) return null;

    if (file.type.startsWith("video/")) {
      return (
        <VideoPlayer 
          src="/sample-video.mp4" // In a real app, would use file.path
          poster={file.thumbnail}
          title={file.name}
        />
      );
    } else if (file.type.startsWith("audio/")) {
      return (
        <AudioPlayer 
          src="/sample-audio.mp3" // In a real app, would use file.path
          title={file.name}
          artist="Unknown Artist"
          coverImage={file.thumbnail}
        />
      );
    } else if (file.type.startsWith("image/")) {
      return (
        <div className="flex justify-center">
          <img 
            src={file.thumbnail || "https://placehold.co/600x400?text=Image+Preview"} 
            alt={file.name}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      );
    } else if (file.type.startsWith("text/") || file.type.includes("document")) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-muted rounded-lg">
          <FileText className="h-24 w-24 text-muted-foreground" />
          <p className="mt-4 text-lg">Document Preview Not Available</p>
          <p className="text-sm text-muted-foreground">Download the file to view its contents</p>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-muted rounded-lg">
          <FileIcon className="h-24 w-24 text-muted-foreground" />
          <p className="mt-4 text-lg">Preview Not Available</p>
          <p className="text-sm text-muted-foreground">This file type cannot be previewed</p>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-pulse-slow">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!file) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">File Not Found</h2>
          <p className="text-muted-foreground mt-2">The requested file could not be found.</p>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="outline" onClick={handleGoBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="outline" 
              onClick={handleToggleFavorite}
            >
              <Star 
                className="h-4 w-4 mr-2" 
                fill={isFavorite ? "currentColor" : "none"} 
              />
              {isFavorite ? "Unfavorite" : "Favorite"}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{file.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
              <span>
                {new Date(file.updated_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span>
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          </div>

          <div className="border rounded-lg p-1">
            {renderFilePreview()}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FileView;
