'use client';

import { memo } from 'react';
import Link from 'next/link';
import { RiCalendarLine, RiMapPinLine } from 'react-icons/ri';
import { MdMusicNote } from 'react-icons/md';

interface RetroShowCardProps {
  show: {
    id: string;
    name: string;
    artist: string;
    date: Date | string;
    venue: string;
    imageUrl?: string | null;
    averageRating?: number | null;
    reviewCount?: number;
  };
}

function RetroShowCard({ show }: RetroShowCardProps) {
  const date = new Date(show.date);
  const isUpcoming = date > new Date();

  const dateStr = date.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });

  const timeStr = date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link href={`/shows/${show.id}`}>
      <div className="retro-card cursor-pointer group overflow-hidden">
        {/* Image Background */}
        {show.imageUrl && (
          <div className="relative h-32 md:h-40 overflow-hidden bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-900 dark:to-orange-900">
            <img
              src={show.imageUrl}
              alt={show.name}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            {isUpcoming && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            )}
          </div>
        )}

        {/* Ticket Stub Look */}
        <div className="p-4 md:p-6">
          {/* Perforated Line */}
          <div className="border-b-2 border-dashed border-amber-400 dark:border-amber-600 pb-4 mb-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-bold text-amber-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-200 transition-colors line-clamp-2">
                  {show.name}
                </h3>
                <p className="text-sm md:text-base text-amber-800 dark:text-amber-200 font-semibold mt-1 line-clamp-1">
                  {show.artist}
                </p>
              </div>
              {isUpcoming && (
                <div className="bg-red-500 dark:bg-red-600 text-white px-2 py-1 rounded font-bold text-xs md:text-sm transform -rotate-12 whitespace-nowrap flex-shrink-0">
                  PRÓXIMO
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
            <div className="flex items-center gap-2">
              <RiCalendarLine className="w-4 h-4 text-amber-700 dark:text-amber-300 flex-shrink-0" />
              <span className="font-mono text-xs md:text-sm">{dateStr} • {timeStr}</span>
            </div>
            <div className="flex items-center gap-2">
              <RiMapPinLine className="w-4 h-4 text-amber-700 dark:text-amber-300 flex-shrink-0" />
              <span className="font-semibold truncate text-xs md:text-sm">{show.venue}</span>
            </div>
          </div>

          {/* Rating */}
          {show.averageRating && show.averageRating > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-dashed border-amber-400 dark:border-amber-600 flex items-center gap-2">
              <MdMusicNote className="w-5 h-5 text-amber-700 dark:text-amber-300 animate-bounce" />
              <span className="font-bold text-amber-900 dark:text-amber-100">
                {show.averageRating.toFixed(1)} ⭐
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-300">
                ({show.reviewCount || 0} opinión{show.reviewCount !== 1 ? 'es' : ''})
              </span>
            </div>
          )}
        </div>

        {/* Ticket Number */}
        <div className="bg-amber-100 dark:bg-slate-700 px-4 py-2 text-right">
          <span className="text-xs font-mono text-amber-800 dark:text-amber-300">
            #{Math.abs(show.id.charCodeAt(0) * show.id.length).toString().slice(0, 5)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default memo(RetroShowCard);
