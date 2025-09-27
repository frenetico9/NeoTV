import { useState, useEffect, useCallback, useRef } from 'react';
import type { Channel, Movie, Series, HistoryItem } from '../types';
import { m3uParserWorkerCode } from '../services/m3uParser';
import { MOCK_M3U_DATA, MOCK_VOD_METADATA } from '../constants';

// --- Local Storage Service (for simple key-value pairs) ---
const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }
};

// --- IndexedDB Service ---
class PlaylistDB {
  private db: IDBDatabase | null = null;
  private dbName: string;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  private async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2); // Version bumped for schema change
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains('channels')) {
          db.createObjectStore('channels', { keyPath: 'id' });
        }
        if (db.objectStoreNames.contains('vod')) { // Migration from old version
             db.deleteObjectStore('vod');
        }
        if (!db.objectStoreNames.contains('movies')) {
          db.createObjectStore('movies', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('series')) {
          db.createObjectStore('series', { keyPath: 'id' });
        }
      };
    });
  }

  async addBatch(channels: Channel[], movies: Movie[], series: Series[]): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction(['channels', 'movies', 'series'], 'readwrite');
    const channelStore = transaction.objectStore('channels');
    const movieStore = transaction.objectStore('movies');
    const seriesStore = transaction.objectStore('series');
    channels.forEach(c => channelStore.put(c));
    movies.forEach(m => movieStore.put(m));
    series.forEach(s => seriesStore.put(s));
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
  
  async getItemsByIds(ids: string[]): Promise<(Channel | Movie | Series)[]> {
    if (ids.length === 0) return [];
    const db = await this.open();
    const transaction = db.transaction(['channels', 'movies', 'series'], 'readonly');
    const channelStore = transaction.objectStore('channels');
    const movieStore = transaction.objectStore('movies');
    const seriesStore = transaction.objectStore('series');
    
    const requests = ids.map(id => {
      // Check all three stores
      return Promise.all([
        new Promise(res => { const req = channelStore.get(id); req.onsuccess = () => res(req.result); req.onerror = () => res(null); }),
        new Promise(res => { const req = movieStore.get(id); req.onsuccess = () => res(req.result); req.onerror = () => res(null); }),
        new Promise(res => { const req = seriesStore.get(id); req.onsuccess = () => res(req.result); req.onerror = () => res(null); })
      ]).then(([channel, movie, series]) => {
         if (channel) return channel;
         if (movie) return movie;
         if (series) return series;
         // Handle episode IDs
         if (id.includes('-s') && id.includes('e')) {
             const seriesId = id.split('-s')[0];
             return new Promise(res => {
                 const req = seriesStore.get(seriesId);
                 req.onsuccess = () => {
                     const s = req.result as Series;
                     if (!s) return res(null);
                     for (const seasonNum in s.seasons) {
                         const episode = s.seasons[seasonNum].find(e => e.id === id);
                         if (episode) return res({ ...episode, poster: s.poster}); // Return episode with series poster
                     }
                     res(null);
                 };
                 req.onerror = () => res(null);
             });
         }
         return null;
      });
    });

    const results = await Promise.all(requests);
    return results.filter(Boolean) as (Channel | Movie | Series)[];
  }
  
  async getSample(type: 'channels' | 'movies' | 'series', count: number): Promise<(Channel | Movie | Series)[]> {
    const db = await this.open();
    return new Promise((resolve) => {
        const transaction = db.transaction([type], 'readonly');
        const store = transaction.objectStore(type);
        const items: (Channel | Movie | Series)[] = [];
        const request = store.openCursor();
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor && items.length < count) {
                items.push(cursor.value);
                cursor.continue();
            } else {
                resolve(items);
            }
        };
        request.onerror = () => resolve([]);
    });
  }


  async getGroups(type: 'channels' | 'movies' | 'series'): Promise<string[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([type], 'readonly');
      const store = transaction.objectStore(type);
      const request = store.openCursor();
      const groups = new Set<string>();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          groups.add(cursor.value.group);
          cursor.continue();
        } else {
          resolve(Array.from(groups).sort());
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getItemsByGroup(type: 'channels' | 'movies' | 'series', group: string, page: number, pageSize: number): Promise<(Channel | Movie | Series)[]> {
      const db = await this.open();
      return new Promise((resolve, reject) => {
          const transaction = db.transaction([type], 'readonly');
          const store = transaction.objectStore(type);
          const items: (Channel | Movie | Series)[] = [];
          const toSkip = (page - 1) * pageSize;
          let skipped = 0;
          
          const request = store.openCursor();

          request.onerror = () => reject(request.error);

          request.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
              if (!cursor) {
                  resolve(items); // Reached the end
                  return;
              }

              if (cursor.value.group === group) {
                  if (skipped < toSkip) {
                      skipped++;
                  } else if (items.length < pageSize) {
                      items.push(cursor.value);
                  }
              }

              if (items.length < pageSize) {
                  cursor.continue();
              } else {
                  resolve(items); // Page is full
              }
          };
      });
  }

  async clear(): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction(['channels', 'movies', 'series'], 'readwrite');
    transaction.objectStore('channels').clear();
    transaction.objectStore('movies').clear();
    transaction.objectStore('series').clear();
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Keep a single instance of the DB
const db = new PlaylistDB('UniTVDB');

export const useUserData = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => storage.get('isLoggedIn', false));
  const [m3uUrl, setM3uUrlState] = useState<string>(() => storage.get('m3uUrl', 'http://cdntvz.lat/get.php?username=864748520662&password=870135116545&type=m3u_plus&output=hls'));
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(storage.get<string[]>('favorites', [])));
  const [history, setHistory] = useState<HistoryItem[]>(() => storage.get<HistoryItem[]>('history', []));

  const [loadingState, setLoadingState] = useState({ status: 'idle', message: ''});
  const [channelGroups, setChannelGroups] = useState<string[]>([]);
  const [movieGroups, setMovieGroups] = useState<string[]>([]);
  const [seriesGroups, setSeriesGroups] = useState<string[]>([]);
  
  const workerRef = useRef<Worker | null>(null);

  const fetchAndParseM3U = useCallback(async (url: string) => {
    setLoadingState({ status: 'parsing', message: 'Clearing old data...' });
    await db.clear();
    setChannelGroups([]);
    setMovieGroups([]);
    setSeriesGroups([]);

    if (workerRef.current) {
        workerRef.current.terminate();
    }

    const blob = new Blob([m3uParserWorkerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    worker.onmessage = async (e: MessageEvent) => {
        const { type, ...data } = e.data;
        switch(type) {
            case 'progress':
                setLoadingState(s => ({ ...s, message: `Parsed ${data.parsedCount} items...` }));
                break;
            case 'data':
                await db.addBatch(data.channels || [], data.movies || [], []);
                break;
            case 'series_data':
                 await db.addBatch([], [], data.series || []);
                 break;
            case 'done':
                setLoadingState({ status: 'done', message: `Successfully loaded ${data.finalCount} items.` });
                const [cGroups, mGroups, sGroups] = await Promise.all([
                    db.getGroups('channels'), 
                    db.getGroups('movies'),
                    db.getGroups('series')
                ]);
                setChannelGroups(cGroups);
                setMovieGroups(mGroups);
                setSeriesGroups(sGroups);
                worker.terminate();
                workerRef.current = null;
                break;
            case 'error':
                setLoadingState({ status: 'error', message: data.error });
                worker.terminate();
                workerRef.current = null;
                break;
        }
    };
    
    worker.onerror = (e) => {
        console.error("Worker error:", e);
        setLoadingState({ status: 'error', message: 'A critical worker error occurred.' });
    };

    worker.postMessage({ url });
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      if (m3uUrl) {
          fetchAndParseM3U(m3uUrl);
      } else {
         // No URL, you might want to show an initial setup screen or load mock data
         setLoadingState({ status: 'idle', message: 'Please set an M3U URL in settings.'});
      }
    } else {
      setLoadingState({ status: 'idle', message: '' });
    }
    
    return () => {
        if(workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
    }
  }, [isLoggedIn, m3uUrl, fetchAndParseM3U]);

  const login = () => {
    setIsLoggedIn(true);
    storage.set('isLoggedIn', true);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setM3uUrlState('');
    setFavorites(new Set());
    setHistory([]);
    setChannelGroups([]);
    setMovieGroups([]);
    setSeriesGroups([]);
    db.clear();
    Object.keys(localStorage).forEach(key => {
      if (['isLoggedIn', 'm3uUrl', 'favorites', 'history'].includes(key)) {
        localStorage.removeItem(key);
      }
    });
    // A small delay and reload can help ensure all state is cleared cleanly
    setTimeout(() => window.location.reload(), 100);
  };

  const setM3uUrl = (url: string) => {
    setM3uUrlState(url);
    storage.set('m3uUrl', url);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      storage.set('favorites', Array.from(newFavorites));
      return newFavorites;
    });
  };

  const updateHistory = (id: string, progress: number) => {
    setHistory(prev => {
      const now = Date.now();
      const itemIndex = prev.findIndex(item => item.id === id);
      let newHistory = [...prev];

      if (itemIndex > -1) {
        newHistory[itemIndex] = { ...newHistory[itemIndex], progress: Math.max(progress, newHistory[itemIndex].progress), watchedAt: now };
      } else {
        newHistory.push({ id, progress, watchedAt: now });
      }
      
      newHistory.sort((a, b) => b.watchedAt - a.watchedAt);
      storage.set('history', newHistory.slice(0, 100)); // Limit history size
      return newHistory;
    });
  };

  return {
    isLoggedIn,
    login,
    logout,
    m3uUrl,
    setM3uUrl,
    favorites,
    toggleFavorite,
    history,
    updateHistory,
    loadingState,
    channelGroups,
    movieGroups,
    seriesGroups,
    db,
  };
};