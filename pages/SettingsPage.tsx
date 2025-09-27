
import React, { useState } from 'react';
import { Save, LogOut, Film } from 'lucide-react';

interface SettingsPageProps {
  m3uUrl: string;
  setM3uUrl: (url: string) => void;
  onLogout: () => void;
  isInitialSetup?: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ m3uUrl, setM3uUrl, onLogout, isInitialSetup = false }) => {
  const [localUrl, setLocalUrl] = useState(m3uUrl);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setM3uUrl(localUrl);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {isInitialSetup && (
        <div className="bg-purple-900/50 border border-purple-700 text-purple-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Welcome!</strong>
            <span className="block sm:inline ml-2">To get started, please add your M3U playlist URL below.</span>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">{isInitialSetup ? 'Initial Setup' : 'Settings'}</h1>

      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">M3U Playlist</h2>
        <p className="text-gray-400 mb-4">Enter the URL for your .m3u or .m3u8 playlist. Your channels and VOD content will be loaded from here.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              placeholder="https://example.com/my_playlist.m3u8"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Film className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
          </div>
          <button
            onClick={handleSave}
            className={`font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors ${isSaved ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            <Save className="mr-2" />
            {isSaved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>
      
       <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Account</h2>
         <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors"
          >
            <LogOut className="mr-2" />
            Log Out
          </button>
           <p className="text-xs text-gray-500 mt-4">
               Logging out will clear all your data (playlist URL, favorites, history) from this browser.
            </p>
      </div>

    </div>
  );
};
