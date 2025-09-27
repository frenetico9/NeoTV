
import { useState, useEffect, useCallback } from 'react';
import type { Channel, VODItem, HistoryItem } from '../types';
import { parseM3U } from '../services/m3uParser';
import { MOCK_M3U_DATA } from '../constants'; // For fallback/demo

// --- Local Storage Service ---
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

// --- Caching and Fetching Configuration ---
const CACHE_EXPIRATION_MS = 4 * 60 * 60 * 1000; // 4 hours

// A list of proxy functions to try in parallel.
const PROXY_URL_BUILDERS = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://cors.sh/${url}`, // This proxy doesn't need encoding
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

// Fix for: Property 'any' does not exist on type 'PromiseConstructor'.
// A simplified Promise.any polyfill to support older TypeScript/JavaScript environments.
const promiseAny = <T>(promises: Promise<T>[]): Promise<T> => {
    return new Promise((resolve, reject) => {
        if (!promises || promises.length === 0) {
            return reject(new Error('No promises were provided.'));
        }

        let pending = promises.length;
        const errors: any[] = new Array(promises.length);

        promises.forEach((promise, i) => {
            Promise.resolve(promise).then(resolve).catch(err => {
                errors[i] = err;
                pending--;
                if (pending === 0) {
                    reject(new Error('All promises were rejected.'));
                }
            });
        });
    });
};

export const useUserData = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => storage.get('isLoggedIn', false));
  const [m3uUrl, setM3uUrlState] = useState<string>(() => storage.get('m3uUrl', ''));
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(storage.get<string[]>('favorites', [])));
  const [history, setHistory] = useState<HistoryItem[]>(() => storage.get<HistoryItem[]>('history', []));

  const [channels, setChannels] = useState<Channel[]>([]);
  const [vodItems, setVODItems] = useState<VODItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndParseM3U = useCallback(async (url: string, isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      setIsLoading(true);
      setError(null);
    }

    const fetchWithTimeout = (fetchUrl: string, timeout = 15000): Promise<Response> => {
      return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error(`Request timed out after ${timeout / 1000}s`));
        }, timeout);

        fetch(fetchUrl, { signal: controller.signal })
          .then(response => {
            clearTimeout(timeoutId);
            resolve(response);
          })
          .catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
      });
    };

    const fetchPromises = PROXY_URL_BUILDERS.map(builder =>
      fetchWithTimeout(builder(url))
        .then(async response => {
          if (!response.ok) {
            throw new Error(`Proxy error: Status ${response.status}`);
          }
          const text = await response.text();
          if (!text || !text.trim().startsWith('#EXTM3U')) {
            throw new Error('Invalid M3U data received from proxy.');
          }
          return text;
        })
    );

    try {
      // Promise.any resolves with the first promise that fulfills.
      // FIX: Replaced Promise.any with a polyfill for compatibility.
      const m3uData = await promiseAny(fetchPromises);
      const { channels: parsedChannels, vodItems: parsedVODs } = parseM3U(m3uData);
      
      if (parsedChannels.length === 0 && parsedVODs.length === 0) {
        throw new Error("The M3U playlist is empty or could not be parsed correctly.");
      }

      setChannels(parsedChannels);
      setVODItems(parsedVODs);
      setError(null); // Clear previous errors on success

      // Save to cache
      const cacheKey = `m3u_cache_${url}`;
      storage.set(cacheKey, {
        timestamp: Date.now(),
        channels: parsedChannels,
        vodItems: parsedVODs,
      });

    } catch (e) {
      console.error("All proxies failed to fetch the M3U playlist.", e);
      // Only show an error if there's no cached data to display.
      // This prevents showing an error during a failed background refresh.
      const cacheKey = `m3u_cache_${url}`;
      const cachedData = storage.get(cacheKey, null);
      if (!cachedData) {
        setError("Failed to load playlist. Please check the URL and your network connection. The playlist provider might be down or blocking access.");
      }
    } finally {
      if (!isBackgroundRefresh) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      if (m3uUrl) {
        const cacheKey = `m3u_cache_${m3uUrl}`;
        const cachedData = storage.get<{ timestamp: number; channels: Channel[]; vodItems: VODItem[]; } | null>(cacheKey, null);

        if (cachedData) {
          setChannels(cachedData.channels);
          setVODItems(cachedData.vodItems);
          setIsLoading(false); // Instantly loaded from cache

          // Refresh in background if cache is stale
          if (Date.now() - cachedData.timestamp > CACHE_EXPIRATION_MS) {
            fetchAndParseM3U(m3uUrl, true);
          }
        } else {
          // No cache, perform initial fetch
          fetchAndParseM3U(m3uUrl, false);
        }
      } else {
        // No URL provided, use mock data for demo
        const { channels: parsedChannels, vodItems: parsedVODs } = parseM3U(MOCK_M3U_DATA);
        setChannels(parsedChannels);
        setVODItems(parsedVODs);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
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
    setChannels([]);
    setVODItems([]);
    // Clear all user data from storage
    Object.keys(localStorage).forEach(key => {
      if (['isLoggedIn', 'm3uUrl', 'favorites', 'history'].includes(key) || key.startsWith('m3u_cache_')) {
        localStorage.removeItem(key);
      }
    });
  };

  const setM3uUrl = (url: string) => {
    const currentUrl = storage.get('m3uUrl', '');
    if (url !== currentUrl) {
      setChannels([]);
      setVODItems([]);
      setIsLoading(true); // Show loader immediately when URL changes
    }
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
        if (progress > newHistory[itemIndex].progress) {
          newHistory[itemIndex] = { ...newHistory[itemIndex], progress, watchedAt: now };
        } else {
          newHistory[itemIndex] = { ...newHistory[itemIndex], watchedAt: now };
        }
      } else {
        newHistory.push({ id, progress, watchedAt: now });
      }
      
      newHistory.sort((a, b) => b.watchedAt - a.watchedAt);
      storage.set('history', newHistory);
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
    isLoading,
    channels,
    vodItems,
    error
  };
};
