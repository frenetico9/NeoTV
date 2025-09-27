import React, { useState, useEffect } from 'react';
import type { Channel, Movie, Series, HistoryItem, EPGProgram } from '../types';
import { isMovie, isSeries, isChannel } from '../types';
import { PlayCircle, Heart } from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';
import { SeriesPage } from './SeriesPage'; // To reuse card logic

interface LibraryPageProps {
  db: any;
  favorites: Set<string>;
  history: HistoryItem[];
  onPlay: (id: string, url: string, title: string, epg?: EPGProgram[]) => void;
  toggleFavorite: (id: string) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode, grid?: boolean }> = ({ title, children, grid = true }) => (
  <section className="mb-8">
    <h2 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">{title}</h2>
    {grid ? (
       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {children}
       </div>
    ) : (
      <div>{children}</div>
    )}
  </section>
);


const ChannelCard: React.FC<{ channel: Channel; onPlay: () => void; onToggleFavorite: () => void; }> = ({ channel, onPlay, onToggleFavorite }) => (
  <div className="bg-gray-800 rounded-lg shadow-lg flex items-center p-3 transform hover:scale-105 transition-transform duration-200 group relative">
    <FavoriteButton isFavorite={true} onToggle={onToggleFavorite} />
    <div onClick={onPlay} className="flex items-center w-full cursor-pointer ml-10">
        <img src={channel.logo} alt={channel.name} className="w-16 h-16 object-contain rounded-md bg-white/10" />
        <p className="ml-4 text-md font-semibold line-clamp-2 flex-grow">{channel.name}</p>
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
            <PlayCircle size={48} className="text-white"/>
        </div>
    </div>
  </div>
);

const MovieCard: React.FC<{ item: Movie; onPlay: () => void; isFavorite: boolean; onToggleFavorite: () => void; progress?: number; }> = ({ item, onPlay, isFavorite, onToggleFavorite, progress = 0 }) => (
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
       {progress > 0 && progress < 0.95 && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
            <div className="bg-purple-500 h-1.5" style={{ width: `${progress * 100}%`}}></div>
        </div>
      )}
    </div>
  </div>
);

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


export const LibraryPage: React.FC<LibraryPageProps> = ({ db, favorites, history, onPlay, toggleFavorite }) => {
  const [favoriteItems, setFavoriteItems] = useState<(Channel | Movie | Series)[]>([]);
  const [continueWatchingItems, setContinueWatchingItems] = useState<(Movie & { progress: number })[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

  useEffect(() => {
    const favIds = Array.from(favorites);
    if (favIds.length > 0) {
      db.getItemsByIds(favIds).then(setFavoriteItems);
    } else {
      setFavoriteItems([]);
    }
  }, [favorites, db]);

  useEffect(() => {
    const fetchHistoryItems = async () => {
        const historyToShow = history
            .filter(h => h.progress > 0.02 && h.progress < 0.95)
            .sort((a, b) => b.watchedAt - a.watchedAt);
        
        const watchedIds = historyToShow.map(h => h.id);
        
        if (watchedIds.length > 0) {
            const items = await db.getItemsByIds(watchedIds);
            const itemMap = new Map(items.map(item => [item.id, item]));
            const hydratedHistory = historyToShow
                .map(h => {
                    const dbItem = itemMap.get(h.id);
                    // Continue watching only supports movies for now
                    if (dbItem && isMovie(dbItem)) {
                        return { ...dbItem, progress: h.progress };
                    }
                    return null;
                })
                .filter(Boolean) as (Movie & { progress: number })[];
            setContinueWatchingItems(hydratedHistory);
        } else {
            setContinueWatchingItems([]);
        }
    };
    fetchHistoryItems();
  }, [history, db]);

  const favoriteChannels = favoriteItems.filter(isChannel);
  const favoriteMovies = favoriteItems.filter(isMovie);
  const favoriteSeries = favoriteItems.filter(isSeries);
  const hasContent = favoriteItems.length > 0 || continueWatchingItems.length > 0;

  return (
    <>
    {/* This is a trick to reuse the SeriesPage modal logic */}
    <SeriesPage seriesGroups={[]} db={db} onPlay={onPlay} favorites={favorites} onToggleFavorite={toggleFavorite} preSelectedSeries={selectedSeries} onCloseModal={() => setSelectedSeries(null)}/>
    
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">My Library</h1>
      
      {!hasContent && (
        <div className="text-center py-16 text-gray-400">
            <Heart size={64} className="mx-auto mb-4"/>
            <h2 className="text-2xl font-bold text-white">Your Library is Empty</h2>
            <p>Add channels, movies and series to your favorites to see them here.</p>
        </div>
      )}

      {continueWatchingItems.length > 0 && (
        <Section title="Continue Watching">
          {continueWatchingItems.map(item => (
            <MovieCard 
              key={`hist-${item.id}`}
              item={item}
              onPlay={() => onPlay(item.id, item.url, item.name)}
              isFavorite={favorites.has(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
              progress={item.progress}
            />
          ))}
        </Section>
      )}

      {favoriteMovies.length > 0 && (
         <Section title="Favorite Movies">
            {favoriteMovies.map(item => (
                <MovieCard 
                    key={`fav-mov-${item.id}`}
                    item={item} 
                    onPlay={() => onPlay(item.id, item.url, item.name)}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                />
            ))}
        </Section>
      )}

      {favoriteSeries.length > 0 && (
         <Section title="Favorite Series">
            {favoriteSeries.map(item => (
                <SeriesCard 
                    key={`fav-ser-${item.id}`}
                    item={item} 
                    onClick={() => setSelectedSeries(item)}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                />
            ))}
        </Section>
      )}
      
      {favoriteChannels.length > 0 && (
        <Section title="Favorite Channels" grid={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             {favoriteChannels.map(channel => (
                <ChannelCard 
                    key={`fav-ch-${channel.id}`}
                    channel={channel} 
                    onPlay={() => onPlay(channel.id, channel.url, channel.name)}
                    onToggleFavorite={() => toggleFavorite(channel.id)}
                />
            ))}
          </div>
        </Section>
      )}
    </div>
    </>
  );
};