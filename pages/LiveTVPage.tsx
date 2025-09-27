
import React, { useMemo } from 'react';
import type { Channel, EPGProgram } from '../types';
import { PlayCircle } from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';

interface LiveTVPageProps {
  channels: Channel[];
  onPlay: (id: string, url: string, title: string, epg?: EPGProgram[]) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}

const ChannelCard: React.FC<{ channel: Channel; onPlay: () => void; isFavorite: boolean; onToggleFavorite: () => void; }> = ({ channel, onPlay, isFavorite, onToggleFavorite }) => (
  <div className="bg-gray-800 rounded-lg shadow-lg flex items-center p-3 transform hover:scale-105 transition-transform duration-200 group relative">
    <FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
    <div onClick={onPlay} className="flex items-center w-full cursor-pointer ml-10">
        <img src={channel.logo} alt={channel.name} className="w-16 h-16 object-contain rounded-md bg-white/10" />
        <p className="ml-4 text-md font-semibold line-clamp-2 flex-grow">{channel.name}</p>
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
            <PlayCircle size={48} className="text-white"/>
        </div>
    </div>
  </div>
);

export const LiveTVPage: React.FC<LiveTVPageProps> = ({ channels, onPlay, favorites, onToggleFavorite }) => {
  const groupedChannels = useMemo(() => {
    return channels.reduce((acc, channel) => {
      const group = channel.group || 'General';
      if (!acc[group]) acc[group] = [];
      acc[group].push(channel);
      return acc;
    }, {} as Record<string, Channel[]>);
  }, [channels]);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Live TV</h1>
      {Object.entries(groupedChannels).map(([group, items]) => (
        <section key={group} className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">{group}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map(channel => (
                <ChannelCard 
                    key={channel.id} 
                    channel={channel} 
                    onPlay={() => onPlay(channel.id, channel.url, channel.name)}
                    isFavorite={favorites.has(channel.id)}
                    onToggleFavorite={() => onToggleFavorite(channel.id)}
                />)
            )}
          </div>
        </section>
      ))}
    </div>
  );
};
