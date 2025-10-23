export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim().toLowerCase() || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Si no hay query, retornar error
    if (!query || query.length < 1) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Buscar usuarios por username o nombre
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { name: { contains: query } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            reviews: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: [
        { followers: { _count: 'desc' } }, // Primero los más seguidos
        { createdAt: 'desc' }, // Luego los más recientes
      ],
    });

    // Contar total de resultados
    const total = await prisma.user.count({
      where: {
        OR: [
          { username: { contains: query } },
          { name: { contains: query } },
        ],
      },
    });

    return NextResponse.json({
      users,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
