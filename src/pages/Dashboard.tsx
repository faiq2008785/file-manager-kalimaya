
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { FileGrid } from "@/components/files/FileGrid";
import { FileUploader } from "@/components/upload/FileUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Search, Folder, Grid, List } from "lucide-react";
import { File } from "@/types/files";
import { getFilesByType, getFavoriteFiles, searchFiles } from "@/utils/fileMock";

const Dashboard = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type') || 'all';
  const favoriteParam = searchParams.get('favorite') === 'true';
  
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<File[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploadOpen, setUploadOpen] = useState(false);
  
  useEffect(() => {
    let fetchedFiles: File[];
    
    if (favoriteParam) {
      fetchedFiles = getFavoriteFiles();
      document.title = "Favorites - Media Vault";
    } else {
      fetchedFiles = getFilesByType(typeParam);
      document.title = `${typeParam.charAt(0).toUpperCase() + typeParam.slice(1)} Files - Media Vault`;
    }
    
    setFiles(fetchedFiles);
  }, [typeParam, favoriteParam]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      const results = searchFiles(searchQuery);
      setSearchResults(results);
    } else {
      setIsSearching(false);
    }
  };

  const handleUploadComplete = (uploadedFiles: globalThis.File[]) => {
    // In a real app, this would get the saved files from the backend
    // Here we just simulate adding the files to the current list
    setFiles(prevFiles => [
      ...uploadedFiles.map((file, index) => ({
        id: prevFiles.length + index + 1,
        name: file.name,
        size: file.size,
        type: file.type,
        path: `/uploads/${file.name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner: 1,
        is_favorite: false
      })),
      ...prevFiles
    ]);
    setUploadOpen(false);
  };

  const handleDeleteFile = (id: number) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
    if (isSearching) {
      setSearchResults(prevResults => prevResults.filter(file => file.id !== id));
    }
  };

  const handleRenameFile = (id: number, newName: string) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === id ? { ...file, name: newName } : file
      )
    );
    if (isSearching) {
      setSearchResults(prevResults => 
        prevResults.map(file => 
          file.id === id ? { ...file, name: newName } : file
        )
      );
    }
  };

  const handleToggleFavorite = (id: number) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === id ? { ...file, is_favorite: !file.is_favorite } : file
      )
    );
    if (isSearching) {
      setSearchResults(prevResults => 
        prevResults.map(file => 
          file.id === id ? { ...file, is_favorite: !file.is_favorite } : file
        )
      );
    }
  };

  const getSectionTitle = () => {
    if (favoriteParam) return "Favorites";
    
    switch(typeParam) {
      case 'all': return "All Files";
      case 'image': return "Images";
      case 'video': return "Videos";
      case 'audio': return "Audio";
      case 'document': return "Documents";
      default: return "Files";
    }
  };

  const displayedFiles = isSearching ? searchResults : files;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{getSectionTitle()}</h1>
            <p className="text-muted-foreground">
              {isSearching 
                ? `${searchResults.length} results found for "${searchQuery}"`
                : `${files.length} files`}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-auto md:min-w-[200px]"
              />
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
            
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Files</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <FileUploader onUploadComplete={handleUploadComplete} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* File type filters for mobile */}
          <div className="md:hidden">
            <Tabs defaultValue={typeParam} className="w-full">
              <TabsList className="grid grid-cols-3 w-[300px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="image">Images</TabsTrigger>
                <TabsTrigger value="video">Videos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {displayedFiles.length > 0 ? (
          <FileGrid 
            files={displayedFiles} 
            onDelete={handleDeleteFile}
            onRename={handleRenameFile}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <div className="text-center py-12">
            <div className="flex justify-center">
              <Folder className="h-16 w-16 text-muted-foreground opacity-50" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No files found</h3>
            <p className="text-muted-foreground">
              {isSearching 
                ? `No results found for "${searchQuery}". Try a different search.`
                : "Upload some files to get started."}
            </p>
            {!isSearching && (
              <Button 
                className="mt-4" 
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
