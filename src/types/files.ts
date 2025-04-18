
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface File {
  id: number;
  name: string;
  size: number;
  type: string;
  path: string;
  created_at: string;
  updated_at: string;
  owner: number;
  is_favorite: boolean;
  thumbnail?: string;
}

export interface Folder {
  id: number;
  name: string;
  path: string;
  created_at: string;
  updated_at: string;
  owner: number;
  parent_folder?: number;
}

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  ARCHIVE = 'archive',
  OTHER = 'other',
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}
