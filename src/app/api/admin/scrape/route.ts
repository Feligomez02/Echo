export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST - Ejecutar scraping manual (requiere autenticación admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar autenticación y autorización
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // TODO: En producción, implementar scraping con rate limiting
    // Para ahora, retornar mensaje informativo
    
    return NextResponse.json({
      message: 'Scraping deshabilitado en build. Configure en variables de entorno.',
      status: 'maintenance',
    }, { status: 503 });

  } catch (error) {
    // Log error on server-side only
    return NextResponse.json(
      { error: 'Error al procesar request' },
      { status: 500 }
    );
  }
}
