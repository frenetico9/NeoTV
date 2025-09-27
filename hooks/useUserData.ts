
import { useState, useEffect, useCallback } from 'react';
import type { Channel, VODItem, HistoryItem } from '../types';
import { parseM3U } from '../services/m3uParser';
import { MOCK_M3U_DATA } from '../constants'; // For fallback/demo

// --- Local Storage Service ---
// In a real app, you would replace these functions with calls to a cloud service like Supabase or Firebase.
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

export const useUserData = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => storage.get('isLoggedIn', false));
  const [m3uUrl, setM3uUrlState] = useState<string>(() => storage.get('m3uUrl', ''));
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(storage.get<string[]>('favorites', [])));
  const [history, setHistory] = useState<HistoryItem[]>(() => storage.get<HistoryItem[]>('history', []));

  const [channels, setChannels] = useState<Channel[]>([]);
  const [vodItems, setVODItems] = useState<VODItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndParseM3U = useCallback(async (url: string) => {
    if (!url) {
      // Use mock data if no URL is provided, to show a demo.
      const { channels: parsedChannels, vodItems: parsedVODs } = parseM3U(MOCK_M3U_DATA);
      setChannels(parsedChannels);
      setVODItems(parsedVODs);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Using a public CORS proxy for development. This is necessary because M3U hosts often don't set CORS headers.
      // Switched from cors-anywhere to allorigins for better reliability.
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        let errorMessage = `Failed to fetch playlist. Status: ${response.status}.`;
        if (response.status === 403) {
           errorMessage = `Access to the playlist was forbidden (Status: 403). The server may be blocking the CORS proxy.`;
        } else if (response.status === 404) {
           errorMessage = `Playlist not found at the provided URL (Status: 404). Please check the URL.`;
        }
        throw new Error(errorMessage);
      }
      const m3uData = await response.text();
      if (!m3uData || !m3uData.trim().startsWith('#EXTM3U')) {
        throw new Error("Invalid M3U data received. The file might be empty, not a valid playlist, or the proxy failed.");
      }

      const { channels: parsedChannels, vodItems: parsedVODs } = parseM3U(m3uData);
      setChannels(parsedChannels);
      setVODItems(parsedVODs);
    } catch (e) {
      console.error("M3U Parsing Error:", e);
      if (e instanceof Error) {
        if (e.message.includes('Failed to fetch')) {
            setError("Failed to fetch the playlist. This could be due to a network issue, an ad-blocker, or the CORS proxy service being temporarily unavailable. Please check your connection and try again.");
        } else {
            setError(e.message);
        }
      } else {
        setError("Could not load your playlist. An unknown error occurred.");
      }
      setChannels([]);
      setVODItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAndParseM3U(m3uUrl);
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
        if (key.startsWith('isLoggedIn') || key.startsWith('m3uUrl') || key.startsWith('favorites') || key.startsWith('history')) {
            localStorage.removeItem(key);
        }
    });
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
        // Update existing item if new progress is greater
        if(progress > newHistory[itemIndex].progress) {
            newHistory[itemIndex] = { ...newHistory[itemIndex], progress, watchedAt: now };
        } else {
            // Also update timestamp even if progress didn't increase, to mark it as recently watched
            newHistory[itemIndex] = { ...newHistory[itemIndex], watchedAt: now };
        }
      } else {
        // Add new item
        newHistory.push({ id, progress, watchedAt: now });
      }
      // Sort by most recently watched
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
