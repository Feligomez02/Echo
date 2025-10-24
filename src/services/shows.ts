import { supabase } from '@/lib/supabase';

/**
 * Obtiene los próximos shows desde la base de datos
 * FILTERED: Only shows from whitelisted venues (La Estación & La Fábrica)
 * Esta función es segura para usar en API Routes
 */
export async function getUpcomingShows(limit = 100) {
  const { data, error } = await supabase
    .from('Show')
    .select(`
      *,
      reviews:Review(
        *,
        user:User(id, username, name, image),
        likes:ReviewLike(*)
      )
    `)
    .gte('date', new Date().toISOString())
    .in('source', ['laestacion', 'lafabrica'])
    .order('date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Obtiene un show por ID
 */
export async function getShowById(id: string) {
  const { data, error } = await supabase
    .from('Show')
    .select(`
      *,
      reviews:Review(
        *,
        user:User(id, username, name, image),
        likes:ReviewLike(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  return data;
}

/**
 * Busca shows por artista
 * FILTERED: Only shows from whitelisted venues (La Estación & La Fábrica)
 */
export async function searchShowsByArtist(artist: string) {
  const { data, error } = await supabase
    .from('Show')
    .select(`
      *,
      reviews:Review(
        *,
        user:User(id, username, name, image),
        likes:ReviewLike(*)
      )
    `)
    .ilike('artist', `%${artist}%`)
    .gte('date', new Date().toISOString())
    .in('source', ['laestacion', 'lafabrica'])
    .order('date', { ascending: true });

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Busca shows por nombre o artista
 * FILTERED: Only shows from whitelisted venues (La Estación & La Fábrica)
 */
export async function searchShows(query: string) {
  const { data, error } = await supabase
    .from('Show')
    .select(`
      *,
      reviews:Review(
        *,
        user:User(id, username, name, image),
        likes:ReviewLike(*)
      )
    `)
    .or(`name.ilike.%${query}%,artist.ilike.%${query}%,venue.ilike.%${query}%`)
    .gte('date', new Date().toISOString())
    .in('source', ['laestacion', 'lafabrica'])
    .order('date', { ascending: true })
    .limit(50);

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Obtiene estadísticas del scraping
 * FILTERED: Only shows from whitelisted venues (La Estación & La Fábrica)
 */
export async function getScrapingStats() {
  // Count total shows from whitelisted sources
  const { count: total, error: totalError } = await supabase
    .from('Show')
    .select('*', { count: 'exact', head: true })
    .in('source', ['laestacion', 'lafabrica']);

  // Count upcoming shows
  const { count: upcoming, error: upcomingError } = await supabase
    .from('Show')
    .select('*', { count: 'exact', head: true })
    .gte('date', new Date().toISOString())
    .in('source', ['laestacion', 'lafabrica']);

  if (totalError || upcomingError) {
    throw new Error('Error fetching show statistics');
  }

  const past = (total || 0) - (upcoming || 0);

  // Get counts by source
  const { data: laestacion, error: laestacionError } = await supabase
    .from('Show')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'laestacion');

  const { data: lafabrica, error: lafabricaError } = await supabase
    .from('Show')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'lafabrica');

  return {
    total: total || 0,
    upcoming: upcoming || 0,
    past,
    bySources: [
      { source: 'laestacion', count: laestacion?.length || 0 },
      { source: 'lafabrica', count: lafabrica?.length || 0 },
    ],
  };
}
