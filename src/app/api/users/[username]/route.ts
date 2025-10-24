export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// GET - Obtener perfil de usuario
export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;

    // Get user
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Get user's reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('Review')
      .select(`
        id,
        rating,
        text,
        userId,
        showId,
        createdAt,
        updatedAt,
        user:User(id, username, name, image),
        show:Show(id, name, artist, date, venue),
        likes:ReviewLike(*),
        comments:Comment(
          id,
          text,
          userId,
          createdAt,
          user:User(id, username, name, image)
        )
      `)
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    // Get user's favorites
    const { data: favorites, error: favError } = await supabase
      .from('UserFavorite')
      .select(`
        *,
        show:Show(id, name, artist, date, venue, imageUrl)
      `)
      .eq('userId', user.id)
      .limit(5);

    if (favError) {
      console.error('Error fetching favorites:', favError);
    }

    // Get followers/following counts
    const { data: followers } = await supabase
      .from('Friendship')
      .select('id')
      .eq('followingId', user.id);

    const { data: following } = await supabase
      .from('Friendship')
      .select('id')
      .eq('followerId', user.id);

    // Format the response
    const formattedUser = {
      ...user,
      reviews: reviews || [],
      favorites: favorites || [],
      _count: {
        reviews: reviews?.length || 0,
        following: following?.length || 0,
        followers: followers?.length || 0,
      },
    };

    // Verificar estado de amistad si hay sesión
    const session = await getServerSession(authOptions);
    let friendshipStatus = null;

    if (session?.user) {
      const currentUserId = (session.user as any).id;

      if (currentUserId !== user.id) {
        // Check if current user follows this user
        const { data: isFollowing } = await supabase
          .from('Friendship')
          .select('status')
          .eq('followerId', currentUserId)
          .eq('followingId', user.id)
          .single();

        // Check if this user follows current user
        const { data: isFollowedBy } = await supabase
          .from('Friendship')
          .select('status')
          .eq('followerId', user.id)
          .eq('followingId', currentUserId)
          .single();

        friendshipStatus = {
          isFollowing: !!isFollowing && isFollowing.status === 'accepted',
          isFollowedBy: !!isFollowedBy && isFollowedBy.status === 'accepted',
          isMutual:
            !!isFollowing &&
            isFollowing.status === 'accepted' &&
            !!isFollowedBy &&
            isFollowedBy.status === 'accepted',
        };
      }
    }

    return NextResponse.json({
      ...formattedUser,
      friendshipStatus,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}
