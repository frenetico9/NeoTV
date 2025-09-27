
export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url:string;
  isFavorite?: boolean;
}

export interface VODItem {
  id: string;
  name: string;
  poster: string;
  group: string;
  url: string;
  description: string;
  year: number;
  genre: string[];
  isFavorite?: boolean;
}

export interface EPGProgram {
  title: string;
  description: string;
  start: string;
  end: string;
}

export interface HistoryItem {
  id: string;
  progress: number; // 0 to 1
  watchedAt: number; // timestamp
}
