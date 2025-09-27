export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url:string;
}

export interface Movie {
  id: string;
  name: string;
  poster: string;
  group: string;
  url: string;
  description: string;
  year: number;
  genre: string[];
}

export interface Episode {
    id: string;
    title: string;
    url: string;
    season: number;
    episode: number;
}

export interface Series {
    id: string; // Generated from series name
    name: string;
    poster: string;
    group: string;
    description: string;
    year: number;
    genre: string[];
    seasons: {
        [seasonNumber: number]: Episode[];
    };
}


export interface EPGProgram {
  title: string;
  description: string;
  start: string;
  end: string;
}

export interface HistoryItem {
  id: string; // Can be a Movie id or an Episode id
  progress: number; // 0 to 1
  watchedAt: number; // timestamp
}

// Type guard to check if an item is a Movie
export const isMovie = (item: any): item is Movie => {
    return item && typeof item === 'object' && 'poster' in item && !('seasons' in item);
}

// Type guard to check if an item is a Series
export const isSeries = (item: any): item is Series => {
    return item && typeof item === 'object' && 'seasons' in item;
}

// Type guard to check if an item is a Channel
export const isChannel = (item: any): item is Channel => {
    return item && typeof item === 'object' && 'logo' in item && !('poster' in item);
}
