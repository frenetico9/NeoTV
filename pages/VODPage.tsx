
import React, { useMemo } from 'react';
import type { VODItem, EPGProgram } from '../types';
import { PlayCircle } from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';

interface VODPageProps {
  vodItems: VODItem[];
  onPlay: (id: string, url: string, title: string, epg?: EPGProgram[]) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}

const VODCard: React.FC<{ item: VODItem; onPlay: () => void; isFavorite: boolean; onToggleFavorite: () => void; }> = ({ item, onPlay, isFavorite, onToggleFavorite }) => (
  <div className="rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 group relative overflow-hidden aspect-[2/3]">
    <FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
    <div onClick={onPlay} className="cursor-pointer w-full h-full">
        <img src={item.poster} alt={item.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex flex-col justify-end">
          <h3 className="font-bold line-clamp-2">{item.name}</h3>
          <p className="text-xs text-gray-300">{item.year}</p>
        </div>
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
          <PlayCircle size={64} className="text-white"/>
        </div>
    </div>
  </div>
);

export const VODPage: React.FC<VODPageProps> = ({ vodItems, onPlay, favorites, onToggleFavorite }) => {
  const groupedVods = useMemo(() => {
    return vodItems.reduce((acc, vod) => {
      const group = vod.group.split('|')[1]?.trim() || 'VOD';
      if (!acc[group]) acc[group] = [];
      acc[group].push(vod);
      return acc;
    }, {} as Record<string, VODItem[]>);
  }, [vodItems]);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Movies & Series (VOD)</h1>
      {Object.entries(groupedVods).map(([group, items]) => (
        <section key={group} className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">{group}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map(item => (
                <VODCard 
                    key={item.id} 
                    item={item} 
                    onPlay={() => onPlay(item.id, item.url, item.name)}
                    isFavorite={favorites.has(item.id)}
                    onToggleFavorite={() => onToggleFavorite(item.id)}
                />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
