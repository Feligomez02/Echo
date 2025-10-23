export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getUpcomingShows, searchShows } from '@/services/shows';

// GET - Obtener shows próximos en Córdoba con filtros opcionales
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const venue = searchParams.get('venue');
    const artist = searchParams.get('artist');
    const source = searchParams.get('source');

    let shows;

    // Si hay búsqueda general, usar searchShows
    if (search) {
      shows = await searchShows(search);
    } else {
      // Obtener todos los shows y aplicar filtros
      shows = await getUpcomingShows(200);

      // Aplicar filtros
      if (venue) {
        shows = shows.filter((show: any) => 
          show.venue.toLowerCase().includes(venue.toLowerCase())
        );
      }

      if (artist) {
        shows = shows.filter((show: any) => 
          show.artist.toLowerCase().includes(artist.toLowerCase()) ||
          show.name.toLowerCase().includes(artist.toLowerCase())
        );
      }

      if (source) {
        shows = shows.filter((show: any) => show.source === source);
      }
    }

    // Calcular rating promedio para cada show
    const showsWithRatings = shows.map((show: any) => {
      const averageRating =
        show.reviews.length > 0
          ? show.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
            show.reviews.length
          : null;

      return {
        ...show,
        averageRating,
        reviewCount: show._count.reviews,
      };
    });

    return NextResponse.json(showsWithRatings);
  } catch (error) {
    // Log error on server-side only (not exposed to client)
    console.error('Error in /api/shows:', error);
    return NextResponse.json(
      { error: 'Error al obtener shows' },
      { status: 500 }
    );
  }
}
