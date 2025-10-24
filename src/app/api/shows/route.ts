export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener shows próximos en Córdoba con filtros opcionales
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const venue = searchParams.get('venue');
    const artist = searchParams.get('artist');
    const source = searchParams.get('source');

    let query = supabase
      .from('Show')
      .select(`
        *,
        reviews:Review(id, rating, text, userId, createdAt, user:User(id, username, name, image))
      `)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(200);

    // Apply source filter
    if (source) {
      query = query.eq('source', source);
    } else {
      query = query.in('source', ['laestacion', 'lafabrica']);
    }

    const { data: shows, error } = await query;

    if (error) throw error;

    // Apply client-side filters for search, venue, and artist
    let filteredShows = shows || [];

    if (search) {
      filteredShows = filteredShows.filter((show: any) =>
        show.name.toLowerCase().includes(search.toLowerCase()) ||
        show.artist.toLowerCase().includes(search.toLowerCase()) ||
        show.venue.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (venue) {
      filteredShows = filteredShows.filter((show: any) =>
        show.venue.toLowerCase().includes(venue.toLowerCase())
      );
    }

    if (artist) {
      filteredShows = filteredShows.filter((show: any) =>
        show.artist.toLowerCase().includes(artist.toLowerCase()) ||
        show.name.toLowerCase().includes(artist.toLowerCase())
      );
    }

    // Calculate average rating for each show
    const showsWithRatings = filteredShows.map((show: any) => {
      const averageRating =
        show.reviews.length > 0
          ? show.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
            show.reviews.length
          : null;

      return {
        ...show,
        averageRating,
        reviewCount: show.reviews.length,
      };
    });

    return NextResponse.json(showsWithRatings);
  } catch (error) {
    console.error('Error in /api/shows:', error);
    return NextResponse.json(
      { error: 'Error al obtener shows' },
      { status: 500 }
    );
  }
}
