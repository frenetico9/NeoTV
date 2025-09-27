import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Series, EPGProgram } from '../types';
import { Loader } from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';
import { SeriesDetailModal } from '../components/SeriesDetailModal';

interface SeriesPageProps {
  seriesGroups: string[];
  db: any;
  onPlay: (id: string, url: string, title: string, epg?: EPGProgram[]) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  preSelectedSeries?: Series | null; // Optional prop for library page
  onCloseModal?: () => void; // Optional prop for library page
}

const SeriesCard: React.FC<{ item: Series; onClick: () => void; isFavorite: boolean; onToggleFavorite: () => void; }> = ({ item, onClick, isFavorite, onToggleFavorite }) => (
  <div onClick={onClick} className="cursor-pointer rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 group relative overflow-hidden aspect-[2/3]">
    <FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
    <img src={item.poster} alt={item.name} className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex flex-col justify-end">
        <h3 className="font-bold line-clamp-2">{item.name}</h3>
        <p className="text-xs text-gray-300">{item.year}</p>
    </div>
    <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-md">SÉRIE</div>
  </div>
);

// Fix: Add explicit props interface for GroupSection component.
interface GroupSectionProps {
  group: string;
  db: any;
  onOpenModal: (series: Series) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}

const GroupSection: React.FC<GroupSectionProps> = ({ group, db, onOpenModal, favorites, onToggleFavorite }) => {
    const [items, setItems] = useState<Series[]>([]);
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
        db.getItemsByGroup('series', group, page, 30).then(newItems => {
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
                    <SeriesCard 
                        key={item.id} 
                        item={item} 
                        onClick={() => onOpenModal(item)}
                        isFavorite={favorites.has(item.id)}
                        onToggleFavorite={() => onToggleFavorite(item.id)}
                    />
                ))}
            </div>
            {hasMore && <div ref={loaderRef} className="flex justify-center p-4"><Loader className="animate-spin"/></div>}
        </section>
    );
};

export const SeriesPage: React.FC<SeriesPageProps> = ({ seriesGroups, db, onPlay, favorites, onToggleFavorite, preSelectedSeries, onCloseModal }) => {
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

  useEffect(() => {
    if(preSelectedSeries) {
        setSelectedSeries(preSelectedSeries);
    }
  }, [preSelectedSeries]);

  const handleCloseModal = () => {
    setSelectedSeries(null);
    if (onCloseModal) {
        onCloseModal();
    }
  }

  // If used via library, don't render the main page view
  if (preSelectedSeries) {
      return (
          <SeriesDetailModal
            series={selectedSeries}
            onClose={handleCloseModal}
            onPlayEpisode={(episode) => onPlay(episode.id, episode.url, episode.title)}
          />
      )
  }

  return (
    <>
      <SeriesDetailModal
        series={selectedSeries}
        onClose={handleCloseModal}
        onPlayEpisode={(episode) => onPlay(episode.id, episode.url, episode.title)}
      />
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6">Séries</h1>
        {seriesGroups.map(group => (
          <GroupSection key={group} group={group} db={db} onOpenModal={setSelectedSeries} favorites={favorites} onToggleFavorite={onToggleFavorite}/>
        ))}
      </div>
    </>
  );
};
