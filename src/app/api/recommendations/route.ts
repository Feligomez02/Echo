export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRecommendationsForUser } from '@/services/recommendations';

// GET - Obtener recomendaciones personalizadas
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const recommendations = await getRecommendationsForUser(userId);

    return NextResponse.json(recommendations);
  } catch (error) {
    // Log error on server-side only
    return NextResponse.json(
      { error: 'Error al obtener recomendaciones' },
      { status: 500 }
    );
  }
}
