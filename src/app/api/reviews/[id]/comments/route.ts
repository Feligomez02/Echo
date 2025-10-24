export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { generateUUID } from '@/lib/uuid';
import { sanitizeHtml, checkRateLimit, isValidCuid } from '@/lib/security';
import { checkPermission } from '@/lib/authorization';

const commentSchema = z.object({
  text: z.string().min(1).max(500),
});

// POST - Agregar comentario a una review (solo amigos mutuos)
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

    const userId = (session.user as any).id;
    const reviewId = id;

    // Validar formato de reviewId
    if (!isValidCuid(reviewId)) {
      return NextResponse.json(
        { error: 'Review ID inválido' },
        { status: 400 }
      );
    }

    // Rate limiting: máximo 30 comentarios por hora
    const rateLimitKey = `comment_create_${userId}`;
    const rateLimit = checkRateLimit(rateLimitKey, 30, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados comentarios. Intenta más tarde.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { text } = commentSchema.parse(body);

    // Verificar permisos usando authorization
    const permission = await checkPermission('comment_review', { reviewId });
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: 403 }
      );
    }

    // Sanitizar contenido HTML para prevenir XSS
    const sanitizedText = sanitizeHtml(text);

    // Crear comentario
    const commentId = generateUUID();
    const { data: comment, error } = await supabase
      .from('Comment')
      .insert({
        id: commentId,
        reviewId,
        userId,
        text: sanitizedText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select(`
        *,
        user:User(id, username, name, image)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Error al crear comentario' },
      { status: 500 }
    );
  }
}
