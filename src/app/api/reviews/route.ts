import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
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

    const where: any = {};
    if (showId) where.showId = showId;
    if (userId) where.userId = userId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        show: {
          select: {
            id: true,
            name: true,
            artist: true,
            date: true,
            venue: true,
          },
        },
        likes: {
          select: {
            userId: true,
            isLike: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json(reviews);
  } catch (error) {
    // Log error on server-side only
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

    // Debug: Log the userId
    console.log('📝 Creating review - session:', JSON.stringify(session.user, null, 2));
    console.log('📝 Creating review - userId:', userId);

    // Validar que userId existe
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

    // ⚠️ PROTECCIÓN CONTRA PROXY TAMPERING
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
    const show = await prisma.show.findUnique({
      where: { id: showId },
    });

    console.log('📝 Review data - userId:', userId, ', showId:', showId);
    console.log('📝 Show found:', show?.name);

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error('❌ User not found in database:', userId);
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (!show) {
      return NextResponse.json(
        { error: 'Show no encontrado' },
        { status: 404 }
      );
    }

    // Sanitizar contenido HTML para prevenir XSS
    const sanitizedText = sanitizeHtml(text);

    console.log('📝 About to create review with:', { userId, showId, rating, text: text.substring(0, 50) });

    const review = await prisma.review.create({
      data: {
        userId,
        showId,
        rating,
        text: sanitizedText,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        show: true,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    // Log error on server-side only
    console.error('❌ Error creating review:', error);
    return NextResponse.json(
      { error: 'Error al crear review', details: String(error) },
      { status: 500 }
    );
  }
}
