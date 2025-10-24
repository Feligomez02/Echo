export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener detalles de un show específico
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Obtener el show
    const { data: show, error: showError } = await supabase
      .from('Show')
      .select('*')
      .eq('id', id)
      .single();

    if (showError || !show) {
      return NextResponse.json(
        { error: 'Show no encontrado' },
        { status: 404 }
      );
    }

    // Obtener reviews con relaciones
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
        likes:ReviewLike(*),
        comments:Comment(
          id,
          text,
          userId,
          createdAt,
          user:User(id, username, name, image)
        )
      `)
      .eq('showId', id);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json(
        { error: 'Error al obtener reviews' },
        { status: 500 }
      );
    }

    // Obtener favoritos
    const { data: favorites, error: favError } = await supabase
      .from('UserFavorite')
      .select('id')
      .eq('showId', id);

    if (favError) {
      console.error('Error fetching favorites:', favError);
    }

    // Calculate average rating
    const averageRating =
      reviews && reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : null;

    return NextResponse.json({
      ...show,
      reviews: reviews || [],
      favorites: favorites || [],
      _count: {
        reviews: reviews?.length || 0,
      },
      averageRating,
    });
  } catch (error) {
    console.error('Error in /api/shows/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener show' },
      { status: 500 }
    );
  }
}
