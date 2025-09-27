
import React from 'react';
import { Clapperboard, LogIn } from 'lucide-react';

interface LoginOverlayProps {
  onLogin: () => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ onLogin }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center p-4 text-white">
        <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center opacity-10 blur-sm scale-110" 
            style={{ backgroundImage: `url('https://picsum.photos/seed/loginbg/1920/1080')` }}
        />
        <div className="relative z-10 flex flex-col items-center text-center bg-black/50 p-10 rounded-2xl shadow-2xl backdrop-blur-md">
            <Clapperboard className="text-purple-500 mb-4" size={64} />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Welcome to UniTV Stream</h1>
            <p className="text-gray-300 mt-4 max-w-lg">
                Your personal streaming hub. To get started, simply "log in" to load your saved playlist and preferences.
            </p>
            <button
                onClick={onLogin}
                className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg flex items-center transition-transform transform hover:scale-105"
            >
                <LogIn className="mr-2" />
                Enter App
            </button>
            <p className="text-xs text-gray-500 mt-8">
                This is a simulated login for this frontend-only demo. Your data is saved in your browser's Local Storage.
            </p>
        </div>
    </div>
  );
};
