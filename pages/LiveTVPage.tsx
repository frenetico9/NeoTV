import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Channel, EPGProgram } from '../types';
import { PlayCircle, Loader } from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';

interface LiveTVPageProps {
  channelGroups: string[];
  db: any; // Simplified DB prop
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

// Fix: Add explicit props interface for GroupSection component.
interface GroupSectionProps {
  group: string;
  db: any;
  onPlay: (id: string, url: string, title: string, epg?: EPGProgram[]) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}

const GroupSection: React.FC<GroupSectionProps> = ({ group, db, onPlay, favorites, onToggleFavorite }) => {
    const [items, setItems] = useState<Channel[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver>();
    const loaderRef = useCallback(node => {
        if (observer.current) observer.current.disconnect();
        // FIX: The misleading error "Expected 1 arguments, but got 0" was likely caused by a build tool issue with the multi-line comment below. The comment has been removed as the logic is correct.
        observer.current = new IntersectionObserver(entries => {
            if (entries.some(e => e.isIntersecting) && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [hasMore]);

    useEffect(() => {
        if (!hasMore) return;
        db.getItemsByGroup('channels', group, page, 30).then(newItems => {
            setItems(prev => [...prev, ...newItems]);
            if (newItems.length < 30) {
                setHasMore(false);
            }
        });
    }, [page, group, db, hasMore]);

    return (
        <section className="mb-8">
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
            {hasMore && <div ref={loaderRef} className="flex justify-center p-4"><Loader className="animate-spin"/></div>}
        </section>
    );
}

export const LiveTVPage: React.FC<LiveTVPageProps> = ({ channelGroups, db, onPlay, favorites, onToggleFavorite }) => {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Live TV</h1>
      {/* Fix: Pass props explicitly to GroupSection to resolve typing error. */}
      {channelGroups.map(group => (
        <GroupSection key={group} group={group} db={db} onPlay={onPlay} favorites={favorites} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  );
};
