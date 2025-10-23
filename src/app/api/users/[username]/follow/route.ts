export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sanitizeUsername, checkRateLimit } from '@/lib/security';
import { checkPermission } from '@/lib/authorization';

const followSchema = z.object({
  action: z.enum(['follow', 'unfollow']),
});

// POST - Seguir/dejar de seguir a un usuario
export async function POST(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;

    // Rate limiting: máximo 50 follow/unfollow por hora
    const rateLimitKey = `follow_${currentUserId}`;
    const rateLimit = checkRateLimit(rateLimitKey, 50, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas acciones. Intenta más tarde.' },
        { status: 429 }
      );
    }

    // Sanitizar username
    const sanitizedUsername = sanitizeUsername(username);

    // Obtener usuario a seguir
    const targetUser = await prisma.user.findUnique({
      where: { username: sanitizedUsername },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    const permission = await checkPermission('follow_user', {
      targetUserId: targetUser.id,
    });
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = followSchema.parse(body);

    if (action === 'follow') {
      // Crear o actualizar friendship
      const friendship = await prisma.friendship.upsert({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUser.id,
          },
        },
        update: {
          status: 'accepted',
        },
        create: {
          followerId: currentUserId,
          followingId: targetUser.id,
          status: 'accepted',
        },
      });

      return NextResponse.json({ message: 'Siguiendo', friendship });
    } else {
      // Unfollow
      await prisma.friendship.deleteMany({
        where: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      });

      return NextResponse.json({ message: 'Dejaste de seguir' });
    }
  } catch (error) {
    // Log error on server-side only
    return NextResponse.json(
      { error: 'Error al procesar acción' },
      { status: 500 }
    );
  }
}
