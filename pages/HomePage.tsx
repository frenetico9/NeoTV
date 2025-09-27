
import React, { useMemo } from 'react';
import type { Channel, VODItem, EPGProgram, HistoryItem } from '../types';
import { PlayCircle } from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';

interface HomePageProps {
  channels: Channel[];
  vodItems: VODItem[];
  onPlay: (id: string, url: string, title: string, epg?: EPGProgram[]) => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  history: HistoryItem[];
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-2xl font-bold px-4 mb-4">{title}</h2>
    <div className="flex overflow-x-auto space-x-4 px-4 pb-4 scrollbar-hide">
      {children}
    </div>
  </section>
);

const ChannelCard: React.FC<{ channel: Channel; onPlay: () => void; isFavorite: boolean; onToggleFavorite: () => void; }> = ({ channel, onPlay, isFavorite, onToggleFavorite }) => (
  <div className="flex-shrink-0 w-36 h-36 bg-gray-800 rounded-lg shadow-lg flex flex-col items-center justify-center text-center p-2 transform hover:scale-105 transition-transform duration-200 group relative">
    <FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
    <div onClick={onPlay} className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
        <img src={channel.logo} alt={channel.name} className="w-20 h-20 object-contain rounded-md" />
        <p className="mt-2 text-sm font-semibold line-clamp-2">{channel.name}</p>
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
            <PlayCircle size={48} className="text-white"/>
        </div>
    </div>
  </div>
);

const VODCard: React.FC<{ item: VODItem; onPlay: () => void; isFavorite: boolean; onToggleFavorite: () => void; progress?: number; }> = ({ item, onPlay, isFavorite, onToggleFavorite, progress = 0 }) => (
  <div className="flex-shrink-0 w-40 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 group relative overflow-hidden">
    <FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
    <div onClick={onPlay} className="cursor-pointer">
      <img src={item.poster} alt={item.name} className="w-full h-60 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex flex-col justify-end">
        <h3 className="font-bold line-clamp-2">{item.name}</h3>
        <p className="text-xs text-gray-300">{item.year}</p>
      </div>
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
          <PlayCircle size={48} className="text-white"/>
      </div>
      {progress > 0 && progress < 0.95 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="bg-purple-500 h-1" style={{ width: `${progress * 100}%`}}></div>
        </div>
      )}
    </div>
  </div>
);

const HeroCarousel: React.FC<{ items: VODItem[]; onPlay: (id: string, url: string, title: string) => void }> = ({ items, onPlay }) => {
    if (items.length === 0) return null;
    const featuredItem = items[0];

    return (
        <div className="relative h-96 w-full mb-8">
            <img src={featuredItem.poster} alt={featuredItem.name} className="w-full h-full object-cover object-center absolute inset-0"/>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xl"></div>
            <div className="relative z-10 h-full flex items-center p-8">
                <div className="w-1/3 flex-shrink-0">
                   <img src={featuredItem.poster} alt={featuredItem.name} className="rounded-xl shadow-2xl w-full h-auto object-contain max-h-[320px]"/>
                </div>
                <div className="ml-8 text-white">
                    <h1 className="text-5xl font-extrabold mb-2 text-shadow-lg">{featuredItem.name}</h1>
                    <p className="text-lg text-gray-200 mb-4 line-clamp-3">{featuredItem.description}</p>
                    <div className="flex space-x-2 mb-4">
                        {featuredItem.genre.map(g => <span key={g} className="bg-white/20 text-xs font-semibold px-2 py-1 rounded-full">{g}</span>)}
                    </div>
                    <button onClick={() => onPlay(featuredItem.id, featuredItem.url, featuredItem.name)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg flex items-center transition-transform transform hover:scale-105">
                        <PlayCircle className="mr-2"/>
                        Play Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export const HomePage: React.FC<HomePageProps> = ({ channels, vodItems, onPlay, favorites, toggleFavorite, history }) => {
  const groupedChannels = useMemo(() => {
    return channels.reduce((acc, channel) => {
      const group = channel.group || 'General';
      if (!acc[group]) acc[group] = [];
      acc[group].push(channel);
      return acc;
    }, {} as Record<string, Channel[]>);
  }, [channels]);
  
  const groupedVods = useMemo(() => {
    return vodItems.reduce((acc, vod) => {
      const group = vod.group.split('|')[1]?.trim() || 'VOD';
      if (!acc[group]) acc[group] = [];
      acc[group].push(vod);
      return acc;
    }, {} as Record<string, VODItem[]>);
  }, [vodItems]);

  const continueWatchingItems = useMemo(() => {
      return history
        .filter(h => h.progress < 0.95) // Filter out finished items
        .sort((a, b) => b.watchedAt - a.watchedAt)
        .map(h => {
            const vodItem = vodItems.find(v => v.id === h.id);
            return vodItem ? { ...vodItem, progress: h.progress } : null;
        })
        .filter(Boolean) as (VODItem & { progress: number })[];
  }, [history, vodItems]);

  return (
    <div className="pt-4">
      <HeroCarousel items={vodItems.slice(0, 5)} onPlay={onPlay} />

      {continueWatchingItems.length > 0 && (
          <Section title="Continue Watching">
              {continueWatchingItems.map(item => (
                  <VODCard 
                    key={item.id} 
                    item={item} 
                    onPlay={() => onPlay(item.id, item.url, item.name)}
                    isFavorite={favorites.has(item.id)}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    progress={item.progress}
                  />
              ))}
          </Section>
      )}

      {Object.entries(groupedChannels).map(([group, items]) => (
        <Section key={group} title={group}>
          {items.map(channel => (
            <ChannelCard 
                key={channel.id} 
                channel={channel} 
                onPlay={() => onPlay(channel.id, channel.url, channel.name)} 
                isFavorite={favorites.has(channel.id)}
                onToggleFavorite={() => toggleFavorite(channel.id)}
            />
          ))}
        </Section>
      ))}

      {Object.entries(groupedVods).map(([group, items]) => (
        <Section key={group} title={group}>
          {items.map(vod => (
            <VODCard 
                key={vod.id} 
                item={vod} 
                onPlay={() => onPlay(vod.id, vod.url, vod.name)}
                isFavorite={favorites.has(vod.id)}
                onToggleFavorite={() => toggleFavorite(vod.id)}
             />
          ))}
        </Section>
      ))}
    </div>
  );
};
