'use client';

import { Card, CardHeader, CardBody, CardFooter, Chip, Button } from '@nextui-org/react';
import Link from 'next/link';
import RatingStars from './rating-stars';
import { FiCalendar, FiMapPin, FiStar } from 'react-icons/fi';

interface ShowCardProps {
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
  recommended?: {
    score: number;
    reason: string;
  };
}

export default function ShowCard({ show, recommended }: ShowCardProps) {
  const date = new Date(show.date);
  const isUpcoming = date > new Date();

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-col items-start gap-2 pb-0">
        <div className="flex justify-between w-full items-start">
          <div className="flex-1">
            <Link href={`/shows/${show.id}`}>
              <h3 className="text-lg font-bold hover:text-primary transition-colors">
                {show.name}
              </h3>
            </Link>
            <p className="text-default-500">{show.artist}</p>
          </div>
          {isUpcoming && (
            <Chip color="success" size="sm" variant="flat">
              Próximo
            </Chip>
          )}
        </div>
        {recommended && (
          <Chip color="warning" size="sm" startContent={<FiStar />} variant="flat">
            {recommended.reason}
          </Chip>
        )}
      </CardHeader>
      <CardBody className="gap-2 py-2">
        <div className="flex items-center gap-2 text-sm text-default-500">
          <FiCalendar />
          <span>
            {date.toLocaleDateString('es-AR', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-default-500">
          <FiMapPin />
          <span>{show.venue}</span>
        </div>
        {show.averageRating && show.averageRating > 0 && (
          <div className="flex items-center gap-2">
            <RatingStars rating={show.averageRating} size="sm" showNumber={false} />
            <span className="text-sm text-default-500">
              ({show.reviewCount || 0} {show.reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}
      </CardBody>
      <CardFooter className="pt-0">
        <Button as={Link} href={`/shows/${show.id}`} color="primary" variant="flat" size="sm">
          Ver Detalles
        </Button>
      </CardFooter>
    </Card>
  );
}
