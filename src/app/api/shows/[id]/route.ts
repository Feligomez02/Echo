import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener detalles de un show específico
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const show = await prisma.show.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              },
            },
            likes: true,
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
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
          },
        },
      },
    });

    if (!show) {
      return NextResponse.json(
        { error: 'Show no encontrado' },
        { status: 404 }
      );
    }

    // Calcular rating promedio
    const averageRating =
      show.reviews.length > 0
        ? show.reviews.reduce((sum: any, r: any) => sum + r.rating, 0) /
          show.reviews.length
        : null;

    return NextResponse.json({
      ...show,
      averageRating,
    });
  } catch (error) {
    // Log error on server-side only
    return NextResponse.json(
      { error: 'Error al obtener show' },
      { status: 500 }
    );
  }
}
