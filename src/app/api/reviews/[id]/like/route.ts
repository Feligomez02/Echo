export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const likeSchema = z.object({
  isLike: z.boolean(),
});

// POST - Dar like/dislike a una review
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const reviewId = id;
    const body = await request.json();
    const { isLike } = likeSchema.parse(body);

    // Verificar que la review existe
    const { data: review, error: reviewError } = await supabase
      .from('Review')
      .select('id')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review no encontrada' },
        { status: 404 }
      );
    }

    const userId = (session.user as any).id;

    // Verificar si ya existe un like de este usuario
    const { data: existingLike, error: existingError } = await supabase
      .from('ReviewLike')
      .select('*')
      .eq('reviewId', reviewId)
      .eq('userId', userId)
      .single();

    if (existingLike && !existingError) {
      // Si es el mismo tipo de reacción, eliminar
      if (existingLike.isLike === isLike) {
        await supabase
          .from('ReviewLike')
          .delete()
          .eq('reviewId', reviewId)
          .eq('userId', userId);
        return NextResponse.json({ message: 'Reacción eliminada' });
      }

      // Si es diferente, actualizar
      const { data: updated, error: updateError } = await supabase
        .from('ReviewLike')
        .update({ isLike })
        .eq('reviewId', reviewId)
        .eq('userId', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      return NextResponse.json(updated);
    }

    // Crear nuevo like
    const { data: like, error: createError } = await supabase
      .from('ReviewLike')
      .insert({
        reviewId,
        userId,
        isLike,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    console.error('Error processing like:', error);
    return NextResponse.json(
      { error: 'Error al procesar reacción' },
      { status: 500 }
    );
  }
}
