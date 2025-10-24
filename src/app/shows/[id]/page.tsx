'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import {
  Spinner,
  Button,
  Textarea,
  useDisclosure,
} from '@nextui-org/react';
import NavBar from '@/components/navbar';
import RatingStars from '@/components/rating-stars';
import RetroReviewCard from '@/components/retro-review-card';
import ReviewDetailModal from '@/components/review-detail-modal';
import { FiCalendar, FiMapPin, FiExternalLink } from 'react-icons/fi';

export default function ShowDetailPage() {
  const params = useParams();
  const showId = params.id as string;
  const { data: session } = useSession();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [show, setShow] = useState<any>(null);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    text: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!showId) return;

    fetch(`/api/shows/${showId}`)
      .then((res) => res.json())
      .then((data) => {
        setShow(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading show:', error);
        setLoading(false);
      });
  }, [showId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || submitting || reviewForm.rating === 0) return;

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId,
          rating: reviewForm.rating,
          text: reviewForm.text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al crear review');
        return;
      }

      // Recargar show
      const updatedShow = await fetch(`/api/shows/${showId}`).then((r) =>
        r.json()
      );
      setShow(updatedShow);

      // Reset form
      setReviewForm({ rating: 0, text: '' });
    } catch (error) {
      setError('Error al crear review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Show no encontrado</h1>
          <Button as="a" href="/shows" color="primary">
            Ver todos los shows
          </Button>
        </div>
      </div>
    );
  }

  const showDate = new Date(show.date);
  const isPastShow = showDate < new Date();
  const reviews = show.reviews || [];
  const userReview = session
    ? reviews.find((r: any) => r.user.id === (session.user as any).id)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-purple-50 
      dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <NavBar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Detalles del show */}
        <div className="retro-card mb-6 p-6 md:p-8">
          <div className="flex justify-between items-start gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl md:text-5xl font-black mb-2 text-blue-900 dark:text-blue-100 font-sans">
                {show.name}
              </h1>
              <h2 className="text-2xl md:text-3xl text-blue-800 dark:text-blue-200 font-bold mb-3">
                {show.artist}
              </h2>
            </div>
            {isPastShow && (
              <div className="bg-gray-400 text-white px-3 py-1 rounded font-bold whitespace-nowrap">
                Finalizado
              </div>
            )}
          </div>

          <div className="border-t-2 border-dashed border-blue-400 dark:border-blue-600 pt-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <FiCalendar className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">
                {showDate.toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                • {showDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <FiMapPin className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">{show.venue} - Córdoba</span>
            </div>
          </div>

          {show.averageRating && (
            <div className="flex items-center gap-3 mt-6 pt-4 border-t-2 border-dashed border-blue-400 dark:border-blue-600">
              <RatingStars rating={show.averageRating} size="lg" />
              <span className="text-blue-900 dark:text-blue-100 font-semibold">
                {show.averageRating.toFixed(1)} • ({show._count.reviews}{' '}
                {show._count.reviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}

          {show.ticketUrl && (
            <Button
              as="a"
              href={show.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3"
              endContent={<FiExternalLink />}
            >
              🎫 Comprar Entradas
            </Button>
          )}
        </div>

        <div className="my-8 border-t-4 border-blue-800 dark:border-blue-600"></div>

        {/* Formulario de review */}
        {session && !userReview && (
          <div className="retro-card mb-8 p-6 md:p-8">
            <h3 className="text-3xl font-black mb-6 text-blue-900 dark:text-blue-100 font-sans">
              ✍️ Escribe tu review
            </h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Tu calificación
                  </label>
                  <RatingStars
                    rating={reviewForm.rating}
                    interactive
                    onChange={(rating) =>
                      setReviewForm({ ...reviewForm, rating })
                    }
                    size="lg"
                    showNumber={false}
                  />
                </div>
                <Textarea
                  label="Tu opinión"
                  placeholder="Cuéntanos tu experiencia en este show..."
                  value={reviewForm.text}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, text: e.target.value })
                  }
                  minLength={10}
                  maxLength={1000}
                  required
                />
                {error && <p className="text-danger text-sm">{error}</p>}
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  isLoading={submitting}
                  isDisabled={reviewForm.rating === 0 || reviewForm.text.length < 10}
                >
                  📝 Publicar Review
                </Button>
              </form>
            </div>
          )}

          {userReview && (
            <div className="bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-lg p-4 mb-8">
              <p className="text-green-900 dark:text-green-100 font-semibold">
                ✅ Ya has revieweado este show
              </p>
            </div>
          )}

          {!session && (
            <div className="retro-card mb-8 p-6 md:p-8 text-center">
              <p className="text-blue-900 dark:text-blue-100 mb-4 font-sans text-lg">
                Inicia sesión para dejar tu review
              </p>
              <Button
                as="a"
                href="/auth/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Iniciar Sesión
              </Button>
            </div>
          )}

          {/* Lista de reviews */}
          <div>
            <h3 className="text-3xl md:text-4xl font-black mb-6 text-blue-900 dark:text-blue-100 font-sans">
              💬 REVIEWS ({reviews.length})
            </h3>
            {reviews.length === 0 ? (
              <div className="retro-card p-8 text-center">
                <p className="text-blue-900 dark:text-blue-100 font-sans text-lg">
                  Todavía no hay reviews para este show
                </p>
                {session && (
                  <p className="mt-3 text-amber-800 dark:text-amber-200 font-semibold">
                    ¡Sé el primero en compartir tu opinión!
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {reviews.map((review: any) => (
                  <RetroReviewCard 
                    key={review.id} 
                    review={review}
                    onReviewClick={(review) => {
                      setSelectedReview(review);
                      onOpen();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {selectedReview && (
          <ReviewDetailModal
            review={selectedReview}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
          />
        )}
      </div>
    );
}