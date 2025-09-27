
import React from 'react';
import { Player } from '../components/Player';
import { ChevronLeft, Heart } from 'lucide-react';
import type { EPGProgram } from '../types';

interface PlayerPageProps {
  id: string;
  url: string;
  title: string;
  onBack: () => void;
  epg?: EPGProgram[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onProgress: (progress: number) => void;
}

export const PlayerPage: React.FC<PlayerPageProps> = ({ id, url, title, onBack, epg, isFavorite, onToggleFavorite, onProgress }) => {
  // A simple placeholder background. In a real app, this might be the VOD poster.
  const backgroundImageUrl = `https://picsum.photos/seed/${title}/1280/720`;
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30 blur-lg scale-110" 
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
      />
      <div className="relative z-10 p-4 flex items-center bg-black/30">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/20 transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold ml-4 flex-grow line-clamp-1">{title}</h1>
        <button onClick={onToggleFavorite} className="p-2 rounded-full hover:bg-white/20 transition-colors ml-4">
          <Heart size={28} className={`${isFavorite ? 'fill-pink-500 text-pink-500' : 'text-white'}`}/>
        </button>
      </div>
      <div className="relative z-10 flex-grow">
        <Player url={url} title={title} epg={epg} onProgress={onProgress} />
      </div>
    </div>
  );
};
