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

    const { data: user, error } = await supabase
      .from('User')
      .select(`
        id,
        username,
        name,
        bio,
        image,
        createdAt,
        reviews:Review(
          *,
          user:User(id, username, name, image),
          show:Show(id, name, artist, date, venue),
          likes:ReviewLike(*),
          comments:Comment(*)
        ),
        favorites:UserFavorite(
          *,
          show:Show(id, name, artist, date, venue, imageUrl)
        ),
        followers:Friendship(id),
        following:Friendship(id)
      `)
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedUser = {
      ...user,
      reviews: (user.reviews || []).sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      favorites: (user.favorites || []).slice(0, 5),
      _count: {
        reviews: user.reviews?.length || 0,
        following: user.following?.length || 0,
        followers: user.followers?.length || 0,
      },
    };

    // Verificar estado de amistad si hay sesión
    const session = await getServerSession(authOptions);
    let friendshipStatus = null;

    if (session?.user) {
      const currentUserId = (session.user as any).id;

      if (currentUserId !== user.id) {
        // Check if current user follows this user
        const { data: following } = await supabase
          .from('Friendship')
          .select('status')
          .eq('followerId', currentUserId)
          .eq('followingId', user.id)
          .single();

        // Check if this user follows current user
        const { data: followedBy } = await supabase
          .from('Friendship')
          .select('status')
          .eq('followerId', user.id)
          .eq('followingId', currentUserId)
          .single();

        friendshipStatus = {
          isFollowing: !!following && following.status === 'accepted',
          isFollowedBy: !!followedBy && followedBy.status === 'accepted',
          isMutual:
            !!following &&
            following.status === 'accepted' &&
            !!followedBy &&
            followedBy.status === 'accepted',
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
