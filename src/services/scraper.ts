import { supabase } from '@/lib/supabase';
import { cleanShowData, deduplicateShows, normalizeText } from '@/lib/data-cleaning';
import { normalizeVenueName } from '@/lib/venue-dedup';

export interface ScrapedShow {
  name: string;
  artist: string;
  description?: string;
  date: Date;
  venue: string;
  city: string;
  imageUrl?: string;
  ticketUrl?: string;
  source: string;
}

/**
 * Interface para eventos de Passline (estructura real de la API)
 */
interface PasslineEvent {
  id: string;
  nombre: string;
  url: string;
  slug: string;
  artistas: string;
  fecha_inicio: string;
  hora_inicio: string;
  fecha_termino: string;
  hora_termino: string;
  lugar: string;
  comuna: string;
  nombre_communa: string;
  region: string;
  nombre_region: string;
  precio_min: string;
  miniatura: string;
  recorte: string;
  disponibles: string;
  category_id: string;
  category_name: string;
  agotado: string;
  streaming: string;
  promocion: string;
}

/**
 * Normaliza datos de un evento de Passline
 */
function normalizePasslineEvent(event: PasslineEvent): ScrapedShow | null {
  try {
    const rawData = {
      name: event.nombre,
      artist: event.artistas,
      description: `${event.artistas} en ${event.lugar}${event.category_name ? ` - ${event.category_name}` : ''}${event.precio_min && parseFloat(event.precio_min) > 0 ? ` - Desde $${event.precio_min}` : ''}`,
      date: `${event.fecha_inicio}T${event.hora_inicio}`,
      venue: event.lugar,
      city: event.nombre_communa || 'Córdoba',
      imageUrl: event.miniatura || event.recorte,
      ticketUrl: event.url,
      source: 'passline'
    };

    // Use data cleaning function
    const cleanedResult = cleanShowData(rawData);
    
    if (!cleanedResult.valid) {
      console.warn(`⚠️ Invalid show data: ${event.nombre} - ${cleanedResult.errors.join(', ')}`);
      return null;
    }

    let cleaned = cleanedResult.data as ScrapedShow;
    
    // Normalize venue name to avoid duplicates
    cleaned.venue = normalizeVenueName(cleaned.venue);
    
    // Additional validation: ensure date is in future
    if (cleaned.date < new Date()) {
      console.warn(`⚠️ Show date is in the past: ${event.nombre}`);
      return null;
    }

    return cleaned;
  } catch (error) {
    console.error('❌ Error normalizando evento:', error);
    return null;
  }
}

/**
 * Scrapea eventos de Passline API para Córdoba
 */
async function scrapePassline(): Promise<ScrapedShow[]> {
  try {
    console.log('📡 Scraping Passline API for Córdoba...');

    const response = await fetch('https://api.passline.com/v1/event/GetBillboardByFilters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'Origin': 'https://home.passline.com',
        'Referer': 'https://home.passline.com/',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
      body: JSON.stringify({
        country: 'argentina',
        region: '6', // Córdoba region code
        commune: '',
        communeNum: '',
        type: 0, // Todos los tipos de eventos
        start_date: '',
        end_date: '',
        text: '', // Sin filtro de texto
        tag_id: null,
        tag: null,
        limit: '0,300', // Máximo 300 eventos
        offset: '1'
      })
    });

    if (!response.ok) {
      console.error(`❌ Passline API error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text.substring(0, 500));
      return [];
    }

    const data = await response.json();
    
    // La respuesta de Passline es un array directo
    if (!Array.isArray(data)) {
      console.error('❌ Formato de respuesta inesperado de Passline');
      console.log('Response type:', typeof data);
      console.log('Response keys:', Object.keys(data));
      return [];
    }

    if (data.length === 0) {
      console.log('⚠️ No se encontraron eventos en Passline');
      return [];
    }

    console.log(`📦 Procesando ${data.length} eventos de Passline...`);

    // Normalizar y filtrar eventos válidos
    const shows: ScrapedShow[] = data
      .map(normalizePasslineEvent)
      .filter((show): show is ScrapedShow => show !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Eliminar duplicados
    const deduplicatedShows = deduplicateShows(shows) as ScrapedShow[];

    console.log(`✅ Scraped ${deduplicatedShows.length} valid upcoming shows from Passline (${shows.length} initial, ${shows.length - deduplicatedShows.length} duplicates removed)`);
    
    // Mostrar algunos ejemplos
    if (deduplicatedShows.length > 0) {
      console.log('\n📋 Ejemplos de shows encontrados:');
      deduplicatedShows.slice(0, 5).forEach(show => {
        console.log(`- ${show.artist} @ ${show.venue} (${show.date.toLocaleDateString('es-AR')})`);
      });
    }

    return deduplicatedShows;

  } catch (error) {
    console.error('❌ Error scraping Passline:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return [];
  }
}

/**
 * Scraper principal - combina todas las fuentes
 */
export async function scrapeCordobaShows(): Promise<ScrapedShow[]> {
  console.log('🎵 Scraping shows from Córdoba venues...\n');
  
  const passlineShows = await scrapePassline();
  
  // TODO: Agregar otras fuentes
  // const ticketekShows = await scrapeTicketek();
  // const otherShows = await scrapeOtherSource();
  
  const allShows = [...passlineShows];
  
  console.log(`\n📊 Total shows encontrados: ${allShows.length}`);
  
  return allShows;
}

/**
 * Ejemplo de función para scraping de Ticketek (futuro)
 */
async function scrapeTicketek(): Promise<ScrapedShow[]> {
  // TODO: Implementar scraping de Ticketek
  return [];
}

/**
 * Guarda shows scrapeados en la base de datos
 * Evita duplicados comparando por nombre + fecha + venue
 */
export async function saveScrapedShows(shows: ScrapedShow[]) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  console.log('\n💾 Guardando shows en la base de datos...');

  for (const show of shows) {
    try {
      // Buscar show existente por nombre, fecha y venue
      const { data: existing } = await supabase
        .from('Show')
        .select('*')
        .eq('name', show.name)
        .eq('date', show.date)
        .eq('venue', show.venue)
        .single();

      if (existing) {
        // Actualizar si hay cambios en descripción, imagen o URL
        const needsUpdate = 
          existing.description !== show.description ||
          existing.imageUrl !== show.imageUrl ||
          existing.ticketUrl !== show.ticketUrl;

        if (needsUpdate) {
          const { error } = await supabase
            .from('Show')
            .update({
              description: show.description,
              imageUrl: show.imageUrl,
              ticketUrl: show.ticketUrl,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (!error) {
            updated++;
            console.log(`  ↻ Actualizado: ${show.name}`);
          } else {
            console.error(`  ✗ Error updating show ${show.name}:`, error);
            skipped++;
          }
        } else {
          skipped++;
        }
      } else {
        // Crear nuevo show
        const { error } = await supabase
          .from('Show')
          .insert({
            ...show,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        if (!error) {
          created++;
          console.log(`  ✓ Creado: ${show.name}`);
        } else {
          console.error(`  ✗ Error creating show ${show.name}:`, error);
          skipped++;
        }
      }
    } catch (error) {
      console.error(`  ✗ Error saving show ${show.name}:`, error);
      skipped++;
    }
  }

  console.log('\n✅ Proceso completado:');
  console.log(`   - Nuevos: ${created}`);
  console.log(`   - Actualizados: ${updated}`);
  console.log(`   - Omitidos: ${skipped}`);

  return { created, updated, skipped };
}

/**
 * Obtiene shows próximos en Córdoba desde la DB
 */
export async function getUpcomingShows(limit: number = 20) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: shows } = await supabase
    .from('Show')
    .select('*')
    .eq('city', 'Córdoba')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(limit);

  return shows || [];
}

/**
 * Busca shows por artista
 */
export async function searchShowsByArtist(artist: string) {
  const { data: shows } = await supabase
    .from('Show')
    .select('*')
    .eq('city', 'Córdoba')
    .ilike('artist', `%${artist}%`)
    .order('date', { ascending: true });

  return shows || [];
}

/**
 * Obtiene estadísticas de scraping
 */
export async function getScrapingStats() {
  const { count: totalShows } = await supabase
    .from('Show')
    .select('*', { count: 'exact', head: true })
    .eq('city', 'Córdoba');

  const today = new Date().toISOString().split('T')[0];
  
  const { count: upcomingShows } = await supabase
    .from('Show')
    .select('*', { count: 'exact', head: true })
    .eq('city', 'Córdoba')
    .gte('date', today);

  const { count: pastShows } = await supabase
    .from('Show')
    .select('*', { count: 'exact', head: true })
    .eq('city', 'Córdoba')
    .lt('date', today);

  const { data: shows } = await supabase
    .from('Show')
    .select('source')
    .eq('city', 'Córdoba');

  // Agrupar por source manualmente
  const showsBySources = (shows || []).reduce((acc: any[], show: any) => {
    const existing = acc.find(s => s.source === show.source);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ source: show.source, count: 1 });
    }
    return acc;
  }, []);

  return {
    total: totalShows || 0,
    upcoming: upcomingShows || 0,
    past: pastShows || 0,
    bySources: showsBySources
  };
}
