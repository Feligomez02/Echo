'use client';

import { Card, CardHeader, CardBody, CardFooter, Avatar, Button, Chip } from '@nextui-org/react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import RatingStars from './rating-stars';
import { FiThumbsUp, FiThumbsDown, FiMessageCircle, FiCalendar } from 'react-icons/fi';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    text: string;
    createdAt: Date | string;
    user: {
      id: string;
      username: string;
      name?: string | null;
      image?: string | null;
    };
    show?: {
      id: string;
      name: string;
      artist: string;
      date: Date | string;
      venue: string;
    } | null;
    likes: Array<{
      userId: string;
      isLike: boolean;
    }>;
    comments?: Array<any>;
    _count?: {
      comments: number;
    };
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  // Guard against missing user data
  if (!review.user) {
    return null;
  }

  const { data: session } = useSession();
  const [likes, setLikes] = useState(review.likes);
  const [isLiking, setIsLiking] = useState(false);

  const currentUserId = (session?.user as any)?.id;
  const userLike = likes.find((l) => l.userId === currentUserId);
  const likesCount = likes.filter((l) => l.isLike).length;
  const dislikesCount = likes.filter((l) => !l.isLike).length;

  const handleLike = async (isLike: boolean) => {
    if (!session || isLiking) return;

    setIsLiking(true);
    try {
      const response = await fetch(`/api/reviews/${review.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLike }),
      });

      if (response.ok) {
        // Actualizar estado local
        const newLikes = likes.filter((l) => l.userId !== currentUserId);
        
        // Si no era la misma reacción, agregar la nueva
        if (!userLike || userLike.isLike !== isLike) {
          newLikes.push({ userId: currentUserId, isLike });
        }
        
        setLikes(newLikes);
      }
    } catch (error) {
      console.error('Error al dar like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const showDate = review.show && (typeof review.show.date === 'string' 
    ? new Date(review.show.date) 
    : review.show.date);
  const isPastShow = showDate && showDate < new Date();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-3 w-full">
          <Avatar
            src={review.user.image || undefined}
            name={review.user.name || review.user.username}
            size="sm"
          />
          <div className="flex flex-col flex-1">
            <Link href={`/perfil/${review.user.username}`} className="hover:text-primary">
              <p className="text-sm font-semibold">{review.user.name || review.user.username}</p>
            </Link>
            <p className="text-xs text-default-500">@{review.user.username}</p>
          </div>
          <RatingStars rating={review.rating} size="sm" />
        </div>
        {review.show ? (
          <div className="w-full">
            <Link href={`/shows/${review.show.id}`} className="hover:text-primary">
              <p className="font-semibold">{review.show.name}</p>
            </Link>
            <p className="text-sm text-default-500">{review.show.artist} • {review.show.venue}</p>
            <div className="flex items-center gap-2 mt-1">
              <FiCalendar className="text-xs" />
              <span className="text-xs text-default-400">
                {showDate && showDate.toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              {isPastShow && (
                <Chip size="sm" variant="flat" color="default">
                  Finalizado
                </Chip>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full">
            <p className="font-semibold text-default-400">Show eliminado</p>
          </div>
        )}
      </CardHeader>
      <CardBody className="py-2">
        <p className="text-sm">{review.text}</p>
      </CardBody>
      <CardFooter className="gap-3">
        <Button
          size="sm"
          variant={userLike?.isLike ? 'solid' : 'light'}
          color={userLike?.isLike ? 'success' : 'default'}
          startContent={<FiThumbsUp />}
          onClick={() => handleLike(true)}
          isDisabled={!session || isLiking}
        >
          {likesCount}
        </Button>
        <Button
          size="sm"
          variant={userLike && !userLike.isLike ? 'solid' : 'light'}
          color={userLike && !userLike.isLike ? 'danger' : 'default'}
          startContent={<FiThumbsDown />}
          onClick={() => handleLike(false)}
          isDisabled={!session || isLiking}
        >
          {dislikesCount}
        </Button>
        {review.show && (
          <Button
            size="sm"
            variant="light"
            startContent={<FiMessageCircle />}
            as={Link}
            href={`/shows/${review.show.id}#review-${review.id}`}
          >
            {review._count?.comments || review.comments?.length || 0}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
