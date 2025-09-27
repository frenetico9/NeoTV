

import React, { useState, useMemo, useCallback } from 'react';
import { Home, Tv, Film, Library, Settings, Clapperboard, Search } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { LiveTVPage } from './pages/LiveTVPage';
import { VODPage } from './pages/VODPage';
import { EPGPage } from './pages/EPGPage';
import { PlayerPage } from './pages/PlayerPage';
import { GeminiSearchPage } from './pages/GeminiSearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { LibraryPage } from './pages/LibraryPage';
import { LoginOverlay } from './components/LoginOverlay';
import { useUserData } from './hooks/useUserData';
import type { EPGProgram } from './types';

type Page = 'home' | 'live' | 'vod' | 'epg' | 'search' | 'library' | 'settings';

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
    isLoading,
    channels,
    vodItems,
    error,
  } = useUserData();

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedStream, setSelectedStream] = useState<{ url: string; id: string; title: string; epg?: EPGProgram[] } | null>(null);

  const handlePlay = useCallback((id: string, url: string, title: string, epg?: EPGProgram[]) => {
    setSelectedStream({ id, url, title, epg });
    if (vodItems.some(v => v.id === id)) {
      updateHistory(id, 0); // Mark as started
    }
  }, [vodItems, updateHistory]);
  
  const handleBack = useCallback(() => {
    setSelectedStream(null);
  }, []);

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home size={24} /> },
    { id: 'live', label: 'Live TV', icon: <Tv size={24} /> },
    { id: 'vod', label: 'VOD', icon: <Film size={24} /> },
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

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><p>Loading your content...</p></div>;
    }
    if (error) {
        return <div className="flex justify-center items-center h-full p-4 text-center"><p className="text-red-400">{error}<br/>Please check the URL in Settings.</p></div>
    }
     if (isLoggedIn && (!m3uUrl || channels.length === 0)) {
        return <SettingsPage m3uUrl={m3uUrl} setM3uUrl={setM3uUrl} onLogout={logout} isInitialSetup={true} />;
    }

    const allProps = { channels, vodItems, onPlay: handlePlay, favorites, toggleFavorite, history };

    switch (currentPage) {
      case 'home':
        return <HomePage {...allProps} />;
      case 'live':
        return <LiveTVPage channels={channels} onPlay={handlePlay} favorites={favorites} onToggleFavorite={toggleFavorite}/>;
      case 'vod':
        return <VODPage vodItems={vodItems} onPlay={handlePlay} favorites={favorites} onToggleFavorite={toggleFavorite}/>;
      case 'epg':
        return <EPGPage channels={channels} onPlay={(url, title, epg) => {
            const channel = channels.find(c => c.url === url && c.name === title);
            if (channel) {
                handlePlay(channel.id, channel.url, channel.name, epg);
            }
        }} />;
      case 'search':
        return <GeminiSearchPage channels={channels} vodItems={vodItems} onPlay={(url, title, epg) => {
            const item = [...channels, ...vodItems].find(i => i.url === url && i.name === title);
            if(item) {
                handlePlay(item.id, item.url, item.name, epg);
            }
        }} />;
      case 'library':
        return <LibraryPage {...allProps} />;
      case 'settings':
        return <SettingsPage m3uUrl={m3uUrl} setM3uUrl={setM3uUrl} onLogout={logout} />;
      default:
        return <HomePage {...allProps} />;
    }
  }, [currentPage, selectedStream, channels, vodItems, isLoading, error, m3uUrl, favorites, history, handleBack, handlePlay, toggleFavorite, updateHistory, setM3uUrl, logout, isLoggedIn]);
  
  if (!isLoggedIn) {
    return <LoginOverlay onLogin={login} />;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-inter flex flex-col">
      <header className="flex items-center p-4 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-800">
        <Clapperboard className="text-purple-500" size={32} />
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