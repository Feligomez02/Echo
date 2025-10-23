export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Obtener perfil de usuario
export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    // Params para el nuevo compilador de nextjs
    const {username} = await context.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        image: true,
        createdAt: true,
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
            show: {
              select: {
                id: true,
                name: true,
                artist: true,
                date: true,
                venue: true,
              },
            },
            likes: true,
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
        favorites: {
          include: {
            show: {
              select: {
                id: true,
                name: true,
                artist: true,
                date: true,
                venue: true,
                imageUrl: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
          take: 5,
        },
        _count: {
          select: {
            reviews: true,
            following: true,
            followers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar estado de amistad si hay sesión
    const session = await getServerSession(authOptions);
    let friendshipStatus = null;

    if (session?.user) {
      const currentUserId = (session.user as any).id;

      if (currentUserId !== user.id) {
        // Check if current user follows this user
        const following = await prisma.friendship.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: user.id,
            },
          },
        });

        // Check if this user follows current user
        const followedBy = await prisma.friendship.findUnique({
          where: {
            followerId_followingId: {
              followerId: user.id,
              followingId: currentUserId,
            },
          },
        });

        friendshipStatus = {
          isFollowing: !!following && following.status === 'accepted',
          isFollowedBy: !!followedBy && followedBy.status === 'accepted',
          isMutual:
            !!following &&
            following.status === 'accepted' &&
            !!followedBy &&
            followedBy.status === 'accepted',
        };
      }
    }

    return NextResponse.json({
      ...user,
      friendshipStatus,
    });
  } catch (error) {
    // Log error on server-side only
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}
