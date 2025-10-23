'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { BiHeart } from 'react-icons/bi';
import { BsHeartFill } from 'react-icons/bs';

interface RetroReviewCardProps {
  review: {
    id: string;
    rating: number;
    text: string;
    createdAt: string | Date;
    user?: {
      id: string;
      username: string;
      name?: string;
      image?: string | null;
    } | null;
    show?: {
      id: string;
      name: string;
      artist: string;
    } | null;
    likes?: Array<{ userId: string; isLike: boolean }>;
    comments?: Array<any>;
    _count?: {
      likes: number;
      comments: number;
    };
  };
  isLiked?: boolean;
  onLike?: () => void;
  onReviewClick?: (review: any) => void;
}

function RetroReviewCard({
  review,
  isLiked = false,
  onLike,
  onReviewClick,
}: RetroReviewCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const date = new Date(review.createdAt);
  const dateStr = date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  });

  const displayName = review.user?.name || review.user?.username || 'Anónimo';
  const likeCount = review._count?.likes || 0;
  const commentCount = review._count?.comments || 0;

  // Rotación pseudo-aleatoria basada en el ID
  const rotation = ((review.id.charCodeAt(0) + review.id.charCodeAt(1)) % 6) - 3;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on like button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onReviewClick?.(review);
  };

  return (
    <div className="group cursor-pointer">
      <div
        className="sticky-note bg-gradient-to-br from-yellow-300 to-amber-200 dark:from-amber-700 dark:to-yellow-800 
          rounded-sm p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300
          border-2 border-amber-400 dark:border-amber-500"
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Header con usuario */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {review.user?.image && (
              <img
                src={review.user.image}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-900 dark:text-amber-100 text-sm md:text-base truncate flex items-center gap-1">
                {displayName}
                {review.user?.username && (
                  <span className="text-xs text-amber-700 dark:text-amber-300">@{review.user.username}</span>
                )}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-mono">
                {dateStr}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="text-2xl flex-shrink-0">
            {'⭐'.repeat(Math.round(review.rating))}
          </div>
        </div>

        {/* Show Info */}
        {review.show && (
          <Link href={`/shows/${review.show.id}`} className="block mb-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs md:text-sm font-semibold text-amber-900 dark:text-amber-100 
              hover:underline line-clamp-2 transition-colors">
              🎸 {review.show.artist} - {review.show.name}
            </p>
          </Link>
        )}

        {/* Comment */}
        <p className="text-sm md:text-base text-amber-900 dark:text-amber-100 leading-relaxed 
          font-sans italic line-clamp-3 mb-3 whitespace-pre-wrap">
          "{review.text}"
        </p>

        {/* Footer con like y badge */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-dashed border-amber-400 dark:border-amber-500">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike?.();
              }}
              className="flex items-center gap-2 text-amber-700 dark:text-amber-300 
                hover:text-red-500 dark:hover:text-red-400 transition-colors group/btn"
            >
              {isLiked ? (
                <BsHeartFill className="w-5 h-5 text-red-500" />
              ) : (
                <BiHeart className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
              )}
              <span className="text-xs md:text-sm font-semibold">{likeCount}</span>
            </button>

            {commentCount > 0 && (
              <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300 text-xs md:text-sm font-semibold">
                💬 {commentCount}
              </div>
            )}
          </div>

          {/* Efecto de papeleta */}
          {isHovered && (
            <div className="text-xs text-amber-600 dark:text-amber-400 font-mono animate-pulse">
              ✌️ Ver más
            </div>
          )}
        </div>
      </div>

      {/* Tape lines decoration */}
      <div className="hidden group-hover:flex gap-2 justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-1 bg-amber-400 dark:bg-amber-600 rounded-full"></div>
        <div className="w-8 h-1 bg-amber-400 dark:bg-amber-600 rounded-full"></div>
      </div>
    </div>
  );
}

export default memo(RetroReviewCard);
