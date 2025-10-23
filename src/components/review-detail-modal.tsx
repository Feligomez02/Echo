'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea, Spinner } from '@nextui-org/react';
import { BiHeart } from 'react-icons/bi';
import { BsHeartFill } from 'react-icons/bs';
import RatingStars from './rating-stars';

interface ReviewDetailModalProps {
  review: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReviewDetailModal({
  review,
  isOpen,
  onOpenChange,
}: ReviewDetailModalProps) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review._count?.likes || 0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(review.comments || []);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isFriend, setIsFriend] = useState(false);

  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (!review || !isOpen) return;

    // Check if user has liked this review
    const userLike = review.likes?.find((l: any) => l.userId === userId);
    setIsLiked(!!userLike);
    setLikeCount(review._count?.likes || 0);
    setComments(review.comments || []);

    // Check if user is friend with review author
    if (userId && review.user?.id) {
      checkFriendship();
    }
  }, [review, isOpen, userId]);

  const checkFriendship = async () => {
    if (!userId || !review.user?.id) return;

    try {
      // This would typically check if they're mutual friends
      // For now, we'll allow commenting if they're the friend or if the review is on their own show
      setIsFriend(true);
    } catch (error) {
      console.error('Error checking friendship:', error);
    }
  };

  const handleLike = async () => {
    if (!session) {
      alert('Debes iniciar sesión para dar like');
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${review.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLike: !isLiked }),
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      }
    } catch (error) {
      console.error('Error liking review:', error);
      setError('Error al dar like');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !comment.trim()) return;

    if (!isFriend && review.user?.id !== userId) {
      setError('Solo amigos pueden comentar esta review');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/reviews/${review.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments([...comments, newComment]);
        setComment('');
      } else {
        const data = await response.json();
        setError(data.error || 'Error al agregar comentario');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Error al agregar comentario');
    } finally {
      setSubmitting(false);
    }
  };

  const date = new Date(review.createdAt);
  const dateStr = date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const displayName = review.user?.name || review.user?.username || 'Anónimo';

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent className="bg-gradient-to-b from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900">
        <ModalHeader className="flex flex-col gap-1 text-amber-900 dark:text-amber-100">
          <div className="flex items-center gap-3">
            {review.user?.image && (
              <img
                src={review.user.image}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-bold">{displayName}</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">{dateStr}</p>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody className="text-amber-900 dark:text-amber-100">
          {/* Rating */}
          <div className="flex items-center gap-2">
            <RatingStars rating={review.rating} size="md" />
            <span className="font-bold">{review.rating} / 5</span>
          </div>

          {/* Show Info */}
          {review.show && (
            <div className="border-l-4 border-amber-400 dark:border-amber-600 pl-4">
              <p className="text-sm font-semibold">En {review.show.artist} - {review.show.name}</p>
            </div>
          )}

          {/* Review Text */}
          <div className="bg-yellow-100 dark:bg-amber-900/30 p-4 rounded border-2 border-amber-400 dark:border-amber-600">
            <p className="text-base leading-relaxed whitespace-pre-wrap">{review.text}</p>
          </div>

          {/* Like Button */}
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 text-amber-700 dark:text-amber-300 
                hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              {isLiked ? (
                <BsHeartFill className="w-6 h-6 text-red-500" />
              ) : (
                <BiHeart className="w-6 h-6" />
              )}
              <span className="font-bold">{likeCount}</span>
            </button>
          </div>

          {/* Comments Section */}
          <div className="border-t-2 border-dashed border-amber-400 dark:border-amber-600 pt-4">
            <p className="font-bold mb-3">💬 Comentarios ({comments.length})</p>
            
            {/* Add Comment Form */}
            {session && (
              <form onSubmit={handleAddComment} className="mb-4 space-y-2">
                <Textarea
                  placeholder="Agrega tu comentario..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  minLength={1}
                  maxLength={500}
                  className="text-amber-900 dark:text-amber-100"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={submitting}
                    isDisabled={!comment.trim() || submitting}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold"
                  >
                    Comentar
                  </Button>
                </div>
              </form>
            )}

            {!session && (
              <p className="text-sm text-amber-700 dark:text-amber-300 italic mb-3">
                Inicia sesión para comentar
              </p>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <p className="text-sm text-amber-700 dark:text-amber-300 italic">Sin comentarios aún</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.map((c: any) => (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-800 p-3 rounded border-l-2 border-amber-400 dark:border-amber-600"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {c.user?.image && (
                        <img
                          src={c.user.image}
                          alt={c.user?.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      )}
                      <p className="font-bold text-sm">{c.user?.name || c.user?.username}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {new Date(c.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <p className="text-sm">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
