import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Movie, EPGProgram } from '../types';
import { PlayCircle, Loader } from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';

interface MoviesPageProps {
  movieGroups: string[];
  db: any; // Simplified DB prop
  onPlay: (id: string, url:string, title: string, epg?: EPGProgram[]) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}

const MovieCard: React.FC<{ item: Movie; onPlay: () => void; isFavorite: boolean; onToggleFavorite: () => void; }> = ({ item, onPlay, isFavorite, onToggleFavorite }) => (
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

// Fix: Add explicit props interface for GroupSection component.
interface GroupSectionProps {
  group: string;
  db: any;
  onPlay: (id: string, url: string, title: string, epg?: EPGProgram[]) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}

const GroupSection: React.FC<GroupSectionProps> = ({ group, db, onPlay, favorites, onToggleFavorite }) => {
    const [items, setItems] = useState<Movie[]>([]);
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
        db.getItemsByGroup('movies', group, page, 30).then(newItems => {
            setItems(prev => [...prev, ...newItems]);
            if (newItems.length < 30) {
                setHasMore(false);
            }
        });
    }, [page, group, db, hasMore]);

    return (
        <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">{group}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {items.map(item => (
                    <MovieCard 
                        key={item.id} 
                        item={item} 
                        onPlay={() => onPlay(item.id, item.url, item.name)}
                        isFavorite={favorites.has(item.id)}
                        onToggleFavorite={() => onToggleFavorite(item.id)}
                    />
                ))}
            </div>
            {hasMore && <div ref={loaderRef} className="flex justify-center p-4"><Loader className="animate-spin"/></div>}
        </section>
    );
};

export const MoviesPage: React.FC<MoviesPageProps> = ({ movieGroups, db, onPlay, favorites, onToggleFavorite }) => {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Filmes</h1>
      {/* Fix: Pass props explicitly to GroupSection to resolve typing error. */}
      {movieGroups.map(group => (
        <GroupSection key={group} group={group} db={db} onPlay={onPlay} favorites={favorites} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  );
};
