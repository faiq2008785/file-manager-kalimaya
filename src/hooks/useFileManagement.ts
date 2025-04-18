
import { useState, useEffect } from "react";
import { File } from "@/types/files";
import { getFilesByType, getFavoriteFiles, searchFiles } from "@/utils/fileMock";

export function useFileManagement(typeParam: string, favoriteParam: boolean) {
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<File[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let fetchedFiles: File[];
    
    if (favoriteParam) {
      fetchedFiles = getFavoriteFiles();
      document.title = "Favorites - Kalimaya Storage";
    } else {
      fetchedFiles = getFilesByType(typeParam);
      document.title = `${typeParam.charAt(0).toUpperCase() + typeParam.slice(1)} Files - Kalimaya Storage`;
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

  return {
    files,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    handleSearch,
    handleDeleteFile,
    handleRenameFile,
    handleToggleFavorite
  };
}
