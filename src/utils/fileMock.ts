
import { File, Folder, FileType } from "@/types/files";

// Helper function to generate random dates within the last month
const getRandomDate = () => {
  const now = new Date();
  const pastMonth = new Date();
  pastMonth.setMonth(now.getMonth() - 1);
  
  return new Date(pastMonth.getTime() + Math.random() * (now.getTime() - pastMonth.getTime())).toISOString();
};

// Helper function to generate random file size between 100KB and 2GB
const getRandomSize = () => {
  return Math.floor(Math.random() * (2 * 1024 * 1024 * 1024 - 100 * 1024) + 100 * 1024);
};

export const mockFiles: File[] = [
  {
    id: 1,
    name: "beach-vacation.jpg",
    size: getRandomSize(),
    type: "image/jpeg",
    path: "/images/beach-vacation.jpg",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1,
    is_favorite: true,
    thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300"
  },
  {
    id: 2,
    name: "mountains.jpg",
    size: getRandomSize(),
    type: "image/jpeg",
    path: "/images/mountains.jpg",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1,
    is_favorite: false,
    thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=300"
  },
  {
    id: 3,
    name: "project_presentation.pdf",
    size: getRandomSize(),
    type: "application/pdf",
    path: "/documents/project_presentation.pdf",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1,
    is_favorite: true
  },
  {
    id: 4,
    name: "summer_mix.mp3",
    size: getRandomSize(),
    type: "audio/mpeg",
    path: "/audio/summer_mix.mp3",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1,
    is_favorite: false
  },
  {
    id: 5,
    name: "vacation_video.mp4",
    size: getRandomSize(),
    type: "video/mp4",
    path: "/videos/vacation_video.mp4",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1,
    is_favorite: true,
    thumbnail: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?q=80&w=300"
  },
  {
    id: 6,
    name: "notes.txt",
    size: getRandomSize(),
    type: "text/plain",
    path: "/documents/notes.txt",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1,
    is_favorite: false
  },
  {
    id: 7,
    name: "project_backup.zip",
    size: getRandomSize(),
    type: "application/zip",
    path: "/archives/project_backup.zip",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1,
    is_favorite: false
  },
  {
    id: 8,
    name: "cityscape.jpg",
    size: getRandomSize(),
    type: "image/jpeg",
    path: "/images/cityscape.jpg",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1,
    is_favorite: false,
    thumbnail: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=300"
  },
  {
    id: 9,
    name: "quarterly_report.xlsx",
    size: getRandomSize(),
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    path: "/documents/quarterly_report.xlsx",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1,
    is_favorite: true
  },
  {
    id: 10,
    name: "acoustic_guitar.mp3",
    size: getRandomSize(),
    type: "audio/mpeg",
    path: "/audio/acoustic_guitar.mp3",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1,
    is_favorite: true
  },
];

export const mockFolders: Folder[] = [
  {
    id: 1,
    name: "Images",
    path: "/images",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1
  },
  {
    id: 2,
    name: "Documents",
    path: "/documents",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1
  },
  {
    id: 3,
    name: "Audio",
    path: "/audio",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1
  },
  {
    id: 4,
    name: "Videos",
    path: "/videos",
    created_at: getRandomDate(),
    updated_at: getRandomDate(),
    owner: 1
  }
];

export function getFilesByType(type?: string) {
  if (!type || type === 'all') return mockFiles;
  
  return mockFiles.filter(file => {
    if (type === 'image') return file.type.startsWith('image/');
    if (type === 'video') return file.type.startsWith('video/');
    if (type === 'audio') return file.type.startsWith('audio/');
    if (type === 'document') return file.type.startsWith('application/') || file.type.startsWith('text/');
    return false;
  });
}

export function getFavoriteFiles() {
  return mockFiles.filter(file => file.is_favorite);
}

export function getFileById(id: number) {
  return mockFiles.find(file => file.id === id);
}

export function searchFiles(query: string) {
  if (!query) return [];
  
  const normalizedQuery = query.toLowerCase();
  return mockFiles.filter(file => 
    file.name.toLowerCase().includes(normalizedQuery)
  );
}
