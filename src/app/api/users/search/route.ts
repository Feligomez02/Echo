export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim().toLowerCase() || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Si no hay query, retornar error
    if (!query || query.length < 1) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Buscar usuarios por username o nombre (con case-insensitive)
    const { data: users, error } = await supabase
      .from('User')
      .select(`
        id,
        username,
        name,
        image,
        bio,
        createdAt,
        reviews:Review(id)
      `)
      .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get followers/following counts separately for each user
    let usersWithCounts = users || [];
    
    for (let user of usersWithCounts) {
      const { count: followersCount } = await supabase
        .from('Friendship')
        .select('*', { count: 'exact', head: true })
        .eq('followingId', user.id);

      const { count: followingCount } = await supabase
        .from('Friendship')
        .select('*', { count: 'exact', head: true })
        .eq('followerId', user.id);

      user._count = {
        followers: followersCount || 0,
        following: followingCount || 0,
        reviews: 0,
      };
    }

    // Contar total de resultados
    const { count: total, error: countError } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })
      .or(`username.ilike.%${query}%,name.ilike.%${query}%`);

    if (countError) throw countError;

    // Format response
    const formattedUsers = usersWithCounts.map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
      bio: user.bio,
      createdAt: user.createdAt,
      _count: (user as any)._count || {
        followers: 0,
        following: 0,
        reviews: user.reviews?.length || 0,
      },
    }));

    return NextResponse.json({
      users: formattedUsers,
      total: total || 0,
      limit,
      offset,
      hasMore: offset + limit < (total || 0),
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
