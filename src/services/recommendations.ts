import { supabase } from '@/lib/supabase';

interface RecommendedShow {
  id: string;
  name: string;
  artist: string;
  date: string;
  venue: string;
  imageUrl: string | null;
  ticketUrl: string | null;
  score: number;
  reason: string;
  averageRating?: number;
  reviewCount?: number;
}

interface ShowWithReviews {
  id: string;
  name: string;
  artist: string;
  date: string;
  venue: string;
  imageUrl: string | null;
  ticketUrl: string | null;
  reviews: Array<{
    userId: string;
    rating: number;
    user: {
      id: string;
      username: string;
    };
  }>;
}

/**
 * Genera recomendaciones personalizadas para un usuario
 * Basado en:
 * 1. Artistas en sus favoritos
 * 2. Shows con buenas reviews de amigos mutuos
 * 3. Shows populares en Córdoba
 */
export async function getRecommendationsForUser(
  userId: string
): Promise<RecommendedShow[]> {
  // Obtener favoritos del usuario para identificar artistas preferidos
  const { data: userFavorites } = await supabase
    .from('UserFavorite')
    .select(`
      *,
      show:Show(id, artist)
    `)
    .eq('userId', userId);

  const favoriteArtists = (userFavorites || []).map((fav: any) => fav.show.artist);

  // Obtener amigos mutuos (ambos se siguen)
  const mutualFriends = await getMutualFriends(userId);
  const friendIds = mutualFriends.map((f: any) => f.id);

  // Obtener shows futuros en Córdoba
  const { data: upcomingShows } = await supabase
    .from('Show')
    .select(`
      id,
      name,
      artist,
      date,
      venue,
      imageUrl,
      ticketUrl,
      reviews:Review(
        userId,
        rating,
        user:User(id, username)
      )
    `)
    .gte('date', new Date().toISOString())
    .eq('city', 'Córdoba');

  // Calcular score para cada show
  const recommendations: RecommendedShow[] = (upcomingShows || [])
    .map((show: any) => {
      let score = 0;
      let reasons: string[] = [];

      // 1. Shows del mismo artista que tienes en favoritos (+50 puntos)
      if (favoriteArtists.includes(show.artist)) {
        score += 50;
        reasons.push(`Te gusta ${show.artist}`);
      }

      // 2. Shows con reviews positivas de amigos (+30 puntos por amigo con 4+ estrellas)
      const friendReviews = show.reviews.filter(
        (review: any) =>
          friendIds.includes(review.userId) && review.rating >= 4.0
      );

      if (friendReviews.length > 0) {
        score += friendReviews.length * 30;
        const friendUsernames = friendReviews
          .map((r: any) => r.user.username)
          .slice(0, 2);
        reasons.push(
          `Le gustó a ${friendUsernames.join(', ')}${
            friendReviews.length > 2 ? ` y ${friendReviews.length - 2} más` : ''
          }`
        );
      }

      // 3. Shows populares en general (+10 puntos por review con 4+)
      const positiveReviews = show.reviews.filter((r: any) => r.rating >= 4.0);
      score += positiveReviews.length * 10;

      if (positiveReviews.length >= 3) {
        reasons.push(`${positiveReviews.length} reviews positivas`);
      }

      // 4. Bonus por shows muy próximos (+20 si es esta semana)
      const daysUntilShow = Math.floor(
        (new Date(show.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilShow <= 7 && daysUntilShow >= 0) {
        score += 20;
        reasons.push('¡Es esta semana!');
      }

      // Calcular rating promedio
      const averageRating =
        show.reviews.length > 0
          ? show.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
            show.reviews.length
          : undefined;

      return {
        id: show.id,
        name: show.name,
        artist: show.artist,
        date: show.date,
        venue: show.venue,
        imageUrl: show.imageUrl,
        ticketUrl: show.ticketUrl,
        score,
        reason: reasons.length > 0 ? reasons.join(' • ') : 'Show en Córdoba',
        averageRating,
        reviewCount: show.reviews.length,
      };
    })
    // Filtrar shows sin score (solo si tenemos suficientes con score)
    .filter((show: RecommendedShow) => show.score > 0)
    // Ordenar por score descendente
    .sort((a: RecommendedShow, b: RecommendedShow) => b.score - a.score)
    // Limitar a top 20
    .slice(0, 20);

  // Si no hay suficientes recomendaciones personalizadas, agregar populares
  if (recommendations.length < 10) {
    const popularShows = (upcomingShows || [])
      .filter((show: any) => !recommendations.find((r: RecommendedShow) => r.id === show.id))
      .map((show: any) => {
        const averageRating =
          show.reviews.length > 0
            ? show.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
              show.reviews.length
            : undefined;

        return {
          id: show.id,
          name: show.name,
          artist: show.artist,
          date: show.date,
          venue: show.venue,
          imageUrl: show.imageUrl,
          ticketUrl: show.ticketUrl,
          score: show.reviews.length * 5,
          reason: 'Popular en Córdoba',
          averageRating,
          reviewCount: show.reviews.length,
        };
      })
      .sort((a: RecommendedShow, b: RecommendedShow) => b.score - a.score)
      .slice(0, 10 - recommendations.length);

    recommendations.push(...popularShows);
  }

  return recommendations;
}

/**
 * Obtiene amigos mutuos de un usuario (ambos se siguen)
 */
async function getMutualFriends(userId: string) {
  // Usuarios que el userId sigue con status 'accepted'
  const { data: following } = await supabase
    .from('Friendship')
    .select('followingId')
    .eq('followerId', userId)
    .eq('status', 'accepted');

  const followingIds = (following || []).map((f: any) => f.followingId);

  if (followingIds.length === 0) {
    return [];
  }

  // De esos, filtrar los que también siguen a userId
  const { data: mutualFriends } = await supabase
    .from('User')
    .select(`
      id,
      username,
      name,
      image
    `)
    .in('id', followingIds);

  if (!mutualFriends) return [];

  // Filter to only include those who also follow the user
  const { data: reverseFollowing } = await supabase
    .from('Friendship')
    .select('followerId')
    .eq('followingId', userId)
    .eq('status', 'accepted')
    .in('followerId', mutualFriends.map(f => f.id));

  const reversFollowerIds = (reverseFollowing || []).map((f: any) => f.followerId);

  return mutualFriends.filter(f => reversFollowerIds.includes(f.id));
}

/**
 * Verifica si dos usuarios son amigos mutuos
 */
export async function areMutualFriends(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const { data: friendship1, error: error1 } = await supabase
    .from('Friendship')
    .select('status')
    .eq('followerId', userId1)
    .eq('followingId', userId2)
    .single();

  const { data: friendship2, error: error2 } = await supabase
    .from('Friendship')
    .select('status')
    .eq('followerId', userId2)
    .eq('followingId', userId1)
    .single();

  return (
    !error1 &&
    !error2 &&
    friendship1?.status === 'accepted' &&
    friendship2?.status === 'accepted'
  );
}
