export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review no encontrada' },
        { status: 404 }
      );
    }

    const userId = (session.user as any).id;

    // Verificar si ya existe un like de este usuario
    const existingLike = await prisma.reviewLike.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Si es el mismo tipo de reacción, eliminar
      if (existingLike.isLike === isLike) {
        await prisma.reviewLike.delete({
          where: {
            reviewId_userId: {
              reviewId,
              userId,
            },
          },
        });
        return NextResponse.json({ message: 'Reacción eliminada' });
      }

      // Si es diferente, actualizar
      const updated = await prisma.reviewLike.update({
        where: {
          reviewId_userId: {
            reviewId,
            userId,
          },
        },
        data: {
          isLike,
        },
      });
      return NextResponse.json(updated);
    }

    // Crear nuevo like
    const like = await prisma.reviewLike.create({
      data: {
        reviewId,
        userId,
        isLike,
      },
    });

    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    // Log error on server-side only
    return NextResponse.json(
      { error: 'Error al procesar reacción' },
      { status: 500 }
    );
  }
}
