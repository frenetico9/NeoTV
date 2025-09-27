import React, { useState, useMemo, useCallback } from 'react';
import { Home, Tv, Film, Library, Settings, Search, Loader, Tv2 } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { LiveTVPage } from './pages/LiveTVPage';
import { MoviesPage } from './pages/VODPage';
import { SeriesPage } from './pages/SeriesPage';
import { PlayerPage } from './pages/PlayerPage';
import { GeminiSearchPage } from './pages/GeminiSearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { LibraryPage } from './pages/LibraryPage';
import { LoginOverlay } from './components/LoginOverlay';
import { useUserData } from './hooks/useUserData';
import type { EPGProgram } from './types';

type Page = 'home' | 'live' | 'movies' | 'series' | 'search' | 'library' | 'settings';

export default function App() {
  const {
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
    db
  } = useUserData();

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedStream, setSelectedStream] = useState<{ url: string; id: string; title: string; epg?: EPGProgram[] } | null>(null);

  const handlePlay = useCallback(async (id: string, url: string, title: string, epg?: EPGProgram[]) => {
    setSelectedStream({ id, url, title, epg });
    // Check if it's a Movie or Series Episode by trying to fetch it from the DB
    const item = (await db.getItemsByIds([id]))[0];
     // It's a Movie if it has a poster, or a Series Episode (we don't track progress for live channels)
    if (item && ('poster' in item || 'season' in item)) { 
      updateHistory(id, 0); // Mark as started
    }
  }, [db, updateHistory]);
  
  const handleBack = useCallback(() => {
    setSelectedStream(null);
  }, []);

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home size={24} /> },
    { id: 'live', label: 'Live TV', icon: <Tv size={24} /> },
    { id: 'movies', label: 'Filmes', icon: <Film size={24} /> },
    { id: 'series', label: 'Séries', icon: <Tv2 size={24} /> },
    { id: 'library', label: 'Library', icon: <Library size={24} /> },
    { id: 'search', label: 'AI Search', icon: <Search size={24} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={24} /> },
  ];
  
  const content = useMemo(() => {
    if (selectedStream) {
      return (
        <PlayerPage
          id={selectedStream.id}
          url={selectedStream.url}
          title={selectedStream.title}
          onBack={handleBack}
          epg={selectedStream.epg}
          isFavorite={favorites.has(selectedStream.id)}
          onToggleFavorite={() => toggleFavorite(selectedStream.id)}
          onProgress={(progress) => updateHistory(selectedStream.id, progress)}
        />
      );
    }

    if (loadingState.status === 'parsing') {
        return (
            <div className="flex flex-col justify-center items-center h-full text-center p-4">
                <Loader className="animate-spin w-12 h-12 text-purple-400 mb-4"/>
                <p className="text-lg font-semibold">Loading your content...</p>
                <p className="text-gray-400">{loadingState.message}</p>
            </div>
        );
    }
    if (loadingState.status === 'error') {
        return <div className="flex justify-center items-center h-full p-4 text-center"><p className="text-red-400">{loadingState.message}<br/>Please check the URL in Settings.</p></div>
    }
     if (isLoggedIn && (!m3uUrl || (channelGroups.length === 0 && movieGroups.length === 0 && seriesGroups.length === 0 && loadingState.status !== 'parsing'))) {
        return <SettingsPage m3uUrl={m3uUrl} setM3uUrl={setM3uUrl} onLogout={logout} isInitialSetup={true} />;
    }

    const allProps = { db, onPlay: handlePlay, favorites, toggleFavorite, history };

    switch (currentPage) {
      case 'home':
        return <HomePage {...allProps} channelGroups={channelGroups} movieGroups={movieGroups} seriesGroups={seriesGroups} />;
      case 'live':
        return <LiveTVPage channelGroups={channelGroups} onPlay={handlePlay} favorites={favorites} onToggleFavorite={toggleFavorite} db={db} />;
      case 'movies':
        return <MoviesPage movieGroups={movieGroups} onPlay={handlePlay} favorites={favorites} onToggleFavorite={toggleFavorite} db={db}/>;
      case 'series':
        return <SeriesPage seriesGroups={seriesGroups} onPlay={handlePlay} favorites={favorites} onToggleFavorite={toggleFavorite} db={db}/>;
      case 'search':
        return <GeminiSearchPage db={db} onPlay={(url, title, epg) => {
            // This logic might need adjustment since we don't have all items in memory
            handlePlay("search-item", url, title, epg);
        }} />;
      case 'library':
        return <LibraryPage {...allProps} />;
      case 'settings':
        return <SettingsPage m3uUrl={m3uUrl} setM3uUrl={setM3uUrl} onLogout={logout} />;
      default:
        return <HomePage {...allProps} channelGroups={channelGroups} movieGroups={movieGroups} seriesGroups={seriesGroups} />;
    }
  }, [currentPage, selectedStream, loadingState, m3uUrl, channelGroups, movieGroups, seriesGroups, favorites, history, handleBack, handlePlay, toggleFavorite, updateHistory, setM3uUrl, logout, isLoggedIn, db]);
  
  if (!isLoggedIn) {
    return <LoginOverlay onLogin={login} />;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-inter flex flex-col">
      <header className="flex items-center p-4 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-800">
        <Tv className="text-purple-500" size={32} />
        <h1 className="text-2xl font-bold ml-3 tracking-tight">UniTV Stream</h1>
      </header>

      <main className="flex-grow overflow-y-auto pb-24">
        {content}
      </main>

      {!selectedStream && (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-lg border-t border-gray-800 z-50">
          <div className="flex justify-around max-w-2xl mx-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center justify-center w-full pt-3 pb-2 transition-colors duration-200 ${
                  currentPage === item.id ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}