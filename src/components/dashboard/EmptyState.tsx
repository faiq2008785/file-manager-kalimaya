
import { Button } from "@/components/ui/button";
import { Folder, Upload } from "lucide-react";

interface EmptyStateProps {
  isSearching: boolean;
  searchQuery: string;
  onUploadClick: () => void;
}

export function EmptyState({ isSearching, searchQuery, onUploadClick }: EmptyStateProps) {
  return (
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
          onClick={onUploadClick}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
      )}
    </div>
  );
}
