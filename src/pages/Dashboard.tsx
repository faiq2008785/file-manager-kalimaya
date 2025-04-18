
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { FileGrid } from "@/components/files/FileGrid";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { UploadDialog } from "@/components/dashboard/UploadDialog";
import { ViewToggle } from "@/components/dashboard/ViewToggle";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useFileManagement } from "@/hooks/useFileManagement";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type') || 'all';
  const favoriteParam = searchParams.get('favorite') === 'true';
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploadOpen, setUploadOpen] = useState(false);
  
  const {
    files,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    handleSearch,
    handleDeleteFile,
    handleRenameFile,
    handleToggleFavorite
  } = useFileManagement(typeParam, favoriteParam);

  const handleUploadComplete = (uploadedFiles: globalThis.File[]) => {
    // In a real app, this would get the saved files from the backend
    // Here we just simulate adding the files to the current list
    const newFiles = uploadedFiles.map((file, index) => ({
      id: files.length + index + 1,
      name: file.name,
      size: file.size,
      type: file.type,
      path: `/uploads/${file.name}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: 1,
      is_favorite: false
    }));

    files.unshift(...newFiles);
    setUploadOpen(false);
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
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSubmit={handleSearch}
            />
            
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>

            <UploadDialog
              open={uploadOpen}
              onOpenChange={setUploadOpen}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          
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
            viewMode={viewMode}
            onDelete={handleDeleteFile}
            onRename={handleRenameFile}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <EmptyState
            isSearching={isSearching}
            searchQuery={searchQuery}
            onUploadClick={() => setUploadOpen(true)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
