export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { generateUUID } from '@/lib/uuid';
import { sanitizeHtml, checkRateLimit, isValidCuid } from '@/lib/security';
import { checkPermission } from '@/lib/authorization';
import { validateReviewParams, logSuspiciousActivity } from '@/lib/request-validation';

const reviewSchema = z.object({
  showId: z.string(),
  rating: z.number().min(1).max(5).multipleOf(0.5),
  text: z.string().min(10).max(1000),
});

// GET - Obtener todas las reviews (feed)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showId = searchParams.get('showId');
    const userId = searchParams.get('userId');

    let query = supabase
      .from('Review')
      .select(`
        *,
        user:User(id, username, name, image),
        show:Show(id, name, artist, date, venue),
        likes:ReviewLike(userId, isLike),
        comments:Comment(
          *,
          user:User(id, username, name, image)
        )
      `)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (showId) {
      query = query.eq('showId', showId);
    }

    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data: reviews, error } = await query;

    if (error) throw error;

    return NextResponse.json(reviews || []);
  } catch (error) {
    console.error('Error in /api/reviews GET:', error);
    return NextResponse.json(
      { error: 'Error al obtener reviews' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva review
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    console.log('📝 Creating review - session:', JSON.stringify(session.user, null, 2));
    console.log('📝 Creating review - userId:', userId);

    if (!userId) {
      console.error('❌ userId is missing from session');
      return NextResponse.json(
        { error: 'Usuario no tiene ID en sesión' },
        { status: 401 }
      );
    }

    // Rate limiting: máximo 20 reviews por hora
    const rateLimitKey = `review_create_${userId}`;
    const rateLimit = checkRateLimit(rateLimitKey, 20, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas reviews. Intenta más tarde.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { showId, rating, text } = reviewSchema.parse(body);

    // Validar todos los parámetros antes de procesar
    const paramValidation = validateReviewParams({ rating, text, showId });
    if (!paramValidation.valid) {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      logSuspiciousActivity('tampering', {
        ip,
        userAgent,
        endpoint: '/api/reviews',
        params: { rating, text: text.substring(0, 50), showId },
        error: paramValidation.errors.join(', '),
      });

      return NextResponse.json(
        { error: 'Parámetros inválidos detectados', details: paramValidation.errors },
        { status: 400 }
      );
    }

    // Validar formato de showId
    if (!isValidCuid(showId)) {
      return NextResponse.json({ error: 'Show ID inválido' }, { status: 400 });
    }

    // Verificar permisos usando authorization
    const permission = await checkPermission('create_review', { showId });
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: 400 }
      );
    }

    // Verificar que el show existe
    const { data: show, error: showError } = await supabase
      .from('Show')
      .select('id, name')
      .eq('id', showId)
      .single();

    if (showError || !show) {
      return NextResponse.json(
        { error: 'Show no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ User not found in database:', userId);
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Sanitizar contenido HTML para prevenir XSS
    const sanitizedText = sanitizeHtml(text);

    console.log('📝 About to create review with:', { userId, showId, rating, text: text.substring(0, 50) });

    const reviewId = generateUUID();
    const { data: review, error: createError } = await supabase
      .from('Review')
      .insert({
        id: reviewId,
        userId,
        showId,
        rating,
        text: sanitizedText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select(`
        *,
        user:User(id, username, name, image),
        show:Show(id, name, artist, date, venue)
      `)
      .single();

    if (createError) throw createError;

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Error creating review:', error);
    return NextResponse.json(
      { error: 'Error al crear review', details: String(error) },
      { status: 500 }
    );
  }
}
