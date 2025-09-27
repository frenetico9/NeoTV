
import React, { useState, useCallback } from 'react';
import type { Channel, VODItem, EPGProgram } from '../types';
import { getAIRecommendations } from '../services/geminiService';
import { Search, Loader, Wand2, Tv, Film } from 'lucide-react';

interface GeminiSearchPageProps {
  channels: Channel[];
  vodItems: VODItem[];
  onPlay: (url: string, title: string, epg?: EPGProgram[]) => void;
}

export const GeminiSearchPage: React.FC<GeminiSearchPageProps> = ({ channels, vodItems, onPlay }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResults(null);
    const aiResults = await getAIRecommendations(query, channels, vodItems);
    setResults(aiResults);
    setIsLoading(false);
  }, [query, channels, vodItems]);

  const handleRecommendationClick = (rec: { type: string; name: string }) => {
    const item = rec.type === 'channel' 
      ? channels.find(c => c.name === rec.name)
      : vodItems.find(v => v.name === rec.name);
    
    if (item) {
      onPlay(item.url, item.name);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center">
        <Wand2 className="mr-3 text-purple-400"/> AI Content Search
      </h1>
      <p className="text-gray-400 mb-6">Ask for recommendations like "show me some action movies" or "what sports are on?".</p>

      <div className="flex gap-2 mb-8">
        <div className="relative flex-grow">
            <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="What do you want to watch?"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors disabled:bg-purple-800 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader className="animate-spin" /> : 'Search'}
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-10">
          <Loader className="animate-spin inline-block w-12 h-12 text-purple-400" />
          <p className="mt-4 text-gray-300">AI is thinking...</p>
        </div>
      )}

      {results && (
        <div className="bg-gray-800/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">AI Recommendations</h2>
          <p className="text-gray-400 italic mb-6">"{results.reasoning}"</p>

          {results.recommendations && results.recommendations.length > 0 ? (
            <div className="space-y-4">
              {results.recommendations.map((rec: any, index: number) => (
                <div 
                  key={index}
                  onClick={() => handleRecommendationClick(rec)}
                  className="bg-gray-700 p-4 rounded-lg flex items-start gap-4 hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  <div className="flex-shrink-0 bg-purple-500/20 p-3 rounded-full">
                    {rec.type === 'channel' ? <Tv className="text-purple-400" /> : <Film className="text-purple-400" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{rec.name}</h3>
                    <p className="text-gray-300">{rec.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-center text-gray-400 py-6">No recommendations found for your query.</p>
          )}
        </div>
      )}
    </div>
  );
};
