import React, { useState, useMemo, useEffect } from 'react';
import type { Series, Episode } from '../types';
import { X, PlayCircle } from 'lucide-react';

interface SeriesDetailModalProps {
  series: Series | null;
  onClose: () => void;
  onPlayEpisode: (episode: Episode) => void;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({ series, onClose, onPlayEpisode }) => {
  const sortedSeasons = useMemo(() => {
    if (!series) return [];
    return Object.keys(series.seasons).map(Number).sort((a, b) => a - b);
  }, [series]);

  const [activeSeason, setActiveSeason] = useState<number>(sortedSeasons[0] || 1);

  // FIX: Imported useEffect to handle side effects.
  useEffect(() => {
     if(sortedSeasons.length > 0) {
        setActiveSeason(sortedSeasons[0]);
     }
  }, [sortedSeasons]);

  if (!series) return null;

  const episodes = series.seasons[activeSeason] || [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-64 md:h-80 w-full flex-shrink-0">
           <img src={series.poster} alt={series.name} className="w-full h-full object-cover object-top absolute inset-0"/>
           <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/80 transition-colors">
             <X size={24} className="text-white" />
           </button>
           <div className="absolute bottom-0 left-0 p-6 text-white">
             <h1 className="text-4xl font-extrabold" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>{series.name}</h1>
             <p className="text-sm text-gray-300 mt-1">{series.year} &middot; {series.genre.join(', ')}</p>
           </div>
        </div>
        
        <div className="flex-grow flex flex-col p-6 overflow-y-hidden">
            <p className="text-gray-400 mb-4 text-sm max-h-24 overflow-y-auto pr-2">{series.description}</p>
            
            <div className="border-b border-gray-700 mb-4 flex-shrink-0">
                <nav className="-mb-px flex space-x-6 overflow-x-auto pb-2">
                    {sortedSeasons.map(seasonNum => (
                        <button
                            key={seasonNum}
                            onClick={() => setActiveSeason(seasonNum)}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeSeason === seasonNum
                                ? 'border-purple-500 text-purple-400'
                                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                            }`}
                        >
                           Temporada {seasonNum}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-grow overflow-y-auto scrollbar-hide">
                <div className="space-y-2 pr-2">
                    {episodes.map(episode => (
                        <div key={episode.id} className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group">
                            <div className="flex items-center">
                                <span className="text-gray-400 font-semibold w-8">{episode.episode}</span>
                                <p className="ml-4 text-white line-clamp-1">{episode.title}</p>
                            </div>
                            <button onClick={() => onPlayEpisode(episode)} className="p-2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlayCircle size={28}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
