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

    const { data: show, error } = await supabase
      .from('Show')
      .select(`
        *,
        reviews:Review(
          *,
          user:User(id, username, name, image),
          likes:ReviewLike(*),
          comments:Comment(
            *,
            user:User(id, username, name, image)
          )
        ),
        favorites:UserFavorite(id)
      `)
      .eq('id', id)
      .single();

    if (error || !show) {
      return NextResponse.json(
        { error: 'Show no encontrado' },
        { status: 404 }
      );
    }

    // Calculate average rating
    const averageRating =
      show.reviews.length > 0
        ? show.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          show.reviews.length
        : null;

    return NextResponse.json({
      ...show,
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
