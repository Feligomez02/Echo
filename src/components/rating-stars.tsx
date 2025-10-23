'use client';

import { FiStar } from 'react-icons/fi';

interface RatingStarsProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function RatingStars({
  rating,
  size = 'md',
  showNumber = true,
  interactive = false,
  onChange,
}: RatingStarsProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const stars = [1, 2, 3, 4, 5];

  const handleStarClick = (value: number) => {
    if (!interactive || !onChange) return;
    
    // Si clickea la misma estrella, alterna entre .0 y .5
    if (Math.floor(rating) === value) {
      const newRating = rating === value ? value - 0.5 : value;
      onChange(newRating >= 0.5 ? newRating : 0.5);
    } else {
      onChange(value);
    }
  };

  const getStarFill = (starValue: number) => {
    if (rating >= starValue) return 'full';
    if (rating >= starValue - 0.5) return 'half';
    return 'empty';
  };

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => {
        const fill = getStarFill(star);
        return (
          <button
            key={star}
            onClick={() => handleStarClick(star)}
            disabled={!interactive}
            className={`${sizeClasses[size]} ${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } transition-transform relative`}
          >
            {fill === 'full' && <FiStar className="fill-yellow-400 text-yellow-400" />}
            {fill === 'half' && (
              <div className="relative">
                <FiStar className="text-gray-300" />
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <FiStar className="fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            )}
            {fill === 'empty' && <FiStar className="text-gray-300" />}
          </button>
        );
      })}
      {showNumber && (
        <span className={`${sizeClasses[size]} font-semibold ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
