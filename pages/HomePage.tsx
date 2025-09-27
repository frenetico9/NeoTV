import React, { useState, useEffect } from 'react';
import type { Channel, Movie, Series, EPGProgram, HistoryItem } from '../types';
import { isMovie, isSeries, isChannel } from '../types';
import { PlayCircle } from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';

interface HomePageProps {
  channelGroups: string[];
  movieGroups: string[];
  seriesGroups: string[];
  db: any; 
  onPlay: (id: string, url: string, title: string, epg?: EPGProgram[]) => void;
  favorites: Set<string>;
  toggleFavorite: (id:string) => void;
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

const MovieCard: React.FC<{ item: Movie; onPlay: () => void; isFavorite: boolean; onToggleFavorite: () => void; progress?: number; }> = ({ item, onPlay, isFavorite, onToggleFavorite, progress = 0 }) => (
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

const SeriesCard: React.FC<{ item: Series; isFavorite: boolean; onToggleFavorite: () => void; }> = ({ item, isFavorite, onToggleFavorite }) => (
  <div className="flex-shrink-0 w-40 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 group relative overflow-hidden">
    <FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
    <div className="cursor-pointer">
      <img src={item.poster} alt={item.name} className="w-full h-60 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex flex-col justify-end">
        <h3 className="font-bold line-clamp-2">{item.name}</h3>
        <p className="text-xs text-gray-300">{item.year}</p>
      </div>
       <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-md">SÉRIE</div>
    </div>
  </div>
);


const HeroCarousel: React.FC<{ items: (Movie | Series)[]; onPlay: (id: string, url: string, title: string) => void }> = ({ items, onPlay }) => {
    if (items.length === 0) return null;
    const featuredItem = items[0];
    if (!isMovie(featuredItem)) return null; // Only feature movies in hero

    return (
        <div className="relative h-96 w-full mb-8">
            <img src={featuredItem.poster} alt={featuredItem.name} className="w-full h-full object-cover object-center absolute inset-0"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/50"></div>
            <div className="relative z-10 h-full flex items-end p-8">
                <div className="w-1/4 flex-shrink-0 max-w-xs">
                   <img src={featuredItem.poster} alt={featuredItem.name} className="rounded-xl shadow-2xl w-full h-auto object-contain"/>
                </div>
                <div className="ml-8 text-white flex-grow">
                    <h1 className="text-5xl font-extrabold mb-2 text-shadow-lg" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>{featuredItem.name}</h1>
                    <p className="text-lg text-gray-200 mb-4 line-clamp-3 max-w-2xl">{featuredItem.description}</p>
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

// Fix: Add explicit props interface for DataSection component.
interface DataSectionProps {
  db: any;
  type: 'channels' | 'movies' | 'series';
  group: string;
  onPlay: (id: string, url: string, title: string, epg?: EPGProgram[]) => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
}

const DataSection: React.FC<DataSectionProps> = ({ db, type, group, onPlay, favorites, toggleFavorite }) => {
    const [items, setItems] = useState<(Channel[] | Movie[] | Series[])>([]);

    useEffect(() => {
        db.getItemsByGroup(type, group, 1, 20).then(setItems); // Fetch first 20 items for home page
    }, [db, type, group]);

    if (items.length === 0) return null;

    return (
        <Section title={group}>
            {items.map(item => {
                 if (type === 'channels') return (
                    <ChannelCard 
                        key={item.id} 
                        channel={item as Channel} 
                        onPlay={() => onPlay(item.id, item.url, item.name)} 
                        isFavorite={favorites.has(item.id)}
                        onToggleFavorite={() => toggleFavorite(item.id)}
                    />
                );
                if (type === 'movies') return (
                    <MovieCard 
                        key={item.id} 
                        item={item as Movie} 
                        onPlay={() => onPlay(item.id, item.url, item.name)}
                        isFavorite={favorites.has(item.id)}
                        onToggleFavorite={() => toggleFavorite(item.id)}
                     />
                );
                if (type === 'series') return (
                     <SeriesCard
                        key={item.id} 
                        item={item as Series} 
                        isFavorite={favorites.has(item.id)}
                        onToggleFavorite={() => toggleFavorite(item.id)}
                     />
                )
                return null;
            })}
        </Section>
    )
}

export const HomePage: React.FC<HomePageProps> = ({ db, channelGroups, movieGroups, seriesGroups, onPlay, favorites, toggleFavorite, history }) => {
    const [heroItems, setHeroItems] = useState<Movie[]>([]);
    const [continueWatchingItems, setContinueWatchingItems] = useState<(Movie & { progress: number })[]>([]);

    useEffect(() => {
        db.getSample('movies', 5).then(setHeroItems);
    }, [db]);
    
    useEffect(() => {
        const fetchHistoryItems = async () => {
            const watchedIds = history
                .filter(h => h.progress < 0.95)
                .sort((a, b) => b.watchedAt - a.watchedAt)
                .map(h => h.id);
            
            if (watchedIds.length > 0) {
                const items = await db.getItemsByIds(watchedIds);
                const itemMap = new Map(items.map(item => [item.id, item]));
                const hydratedHistory = history
                    .map(h => {
                        const dbItem = itemMap.get(h.id);
                        if(dbItem && isMovie(dbItem)) {
                           return { ...dbItem, progress: h.progress };
                        }
                        return null;
                    })
                    .filter(Boolean) as (Movie & { progress: number })[];
                setContinueWatchingItems(hydratedHistory);
            }
        };
        fetchHistoryItems();
    }, [history, db]);

  return (
    <div className="pt-4">
      <HeroCarousel items={heroItems} onPlay={onPlay} />

      {continueWatchingItems.length > 0 && (
          <Section title="Continue Watching">
              {continueWatchingItems.map(item => (
                  <MovieCard 
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
      {/* Fix: Pass props explicitly to DataSection to resolve typing error. */}
      {channelGroups.map(group => (
          <DataSection key={`ch-${group}`} db={db} type="channels" group={group} onPlay={onPlay} favorites={favorites} toggleFavorite={toggleFavorite} />
      ))}

      {movieGroups.map(group => (
          <DataSection key={`mov-${group}`} db={db} type="movies" group={group} onPlay={onPlay} favorites={favorites} toggleFavorite={toggleFavorite} />
      ))}

      {seriesGroups.map(group => (
          <DataSection key={`ser-${group}`} db={db} type="series" group={group} onPlay={onPlay} favorites={favorites} toggleFavorite={toggleFavorite} />
      ))}

    </div>
  );
};
