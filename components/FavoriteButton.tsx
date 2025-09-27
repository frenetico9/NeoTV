
import React from 'react';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
    isFavorite: boolean;
    onToggle: () => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ isFavorite, onToggle }) => {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card's onClick from firing
        onToggle();
    };

    return (
        <button 
            onClick={handleClick}
            className="absolute top-2 right-2 z-10 p-2 bg-black/50 rounded-full transition-transform transform hover:scale-110"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Heart 
                size={20} 
                className={`transition-colors ${isFavorite ? 'fill-pink-500 text-pink-500' : 'text-white'}`}
            />
        </button>
    );
};
