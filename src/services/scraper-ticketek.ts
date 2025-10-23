import { prisma } from '@/lib/prisma';
import { ScrapedShow } from './scraper-puppeteer';

/**
 * Interface para eventos de Ticketek (estructura real de la API)
 */
interface TicketekShow {
  estado: string; // 'buy', 'sold_out', etc.
  id: number;
  showcode: string;
  mobile: boolean;
  lugar: string; // venue
  fecha?: string; // fecha del show (puede no estar)
  hora?: string; // hora del show (puede no estar)
  precio_desde?: string;
  performances?: Array<{
    fecha: string;
    hora: string;
  }>;
}

interface TicketekArtist {
  id: string;
  titulo: string; // nombre del artista/evento
  url: string;
  imagen?: string;
  imagenHorizontal?: string;
  imagenURI?: string;
  date?: string;
  shows: TicketekShow[];
}

interface TicketekResponse {
  resultados: TicketekArtist[];
  resultados_total: number;
  resultados_por_pagina: number;
  pagina_actual: number;
  error: number;
  error_message: string | null;
}

/**
 * Normaliza datos de un show de Ticketek
 */
function normalizeTicketekShow(
  artist: TicketekArtist,
  show: TicketekShow,
  performance?: { fecha: string; hora: string }
): ScrapedShow | null {
  try {
    // Obtener fecha - puede estar en el show o en la performance individual
    const fecha = performance?.fecha || show.fecha;
    const hora = performance?.hora || show.hora;

    // Si no hay fecha, usar una fecha futura estimada (shows sin fecha específica)
    if (!fecha) {
      // Crear un evento para dentro de 30 días como placeholder
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      futureDate.setHours(20, 0, 0, 0);
      
      console.warn(`Show without specific date, using placeholder: ${artist.titulo}`);
      
      const name = artist.titulo;
      const artistName = artist.titulo;
      const venue = show.lugar || 'Quality Espacio';
      const city = 'Córdoba';
      
      let imageUrl = artist.imagenHorizontal || artist.imagen;
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `https:${imageUrl}`;
      }
      
      const ticketUrl = artist.url
        ? `https://www.ticketek.com.ar/${artist.url}`
        : undefined;
      
      const description = show.precio_desde
        ? `Desde $${show.precio_desde} (Fecha a confirmar)`
        : 'Fecha a confirmar';

      return {
        name,
        artist: artistName,
        description,
        date: futureDate,
        venue,
        city,
        imageUrl,
        ticketUrl,
        source: 'ticketek',
      };
    }

    // Parsear fecha y hora
    // Formato esperado: "DD/MM/YYYY" y hora "HH:MM"
    const [day, month, year] = fecha.split('/');
    const [hours, minutes] = hora ? hora.split(':') : ['20', '00'];
    const dateTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );

    // Validar que la fecha sea válida
    if (isNaN(dateTime.getTime())) {
      console.warn(`Invalid date for show: ${artist.titulo} - ${fecha}`);
      return null;
    }

    // Nombre y artista
    const name = artist.titulo;
    const artistName = artist.titulo; // En Ticketek el artista es el título

    // Venue
    const venue = show.lugar || 'Quality Espacio';
    const city = 'Córdoba';

    // Imagen - preferir la horizontal, sino la normal
    let imageUrl = artist.imagenHorizontal || artist.imagen;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https:${imageUrl}`;
    }

    // URL del evento
    const ticketUrl = artist.url
      ? `https://www.ticketek.com.ar/${artist.url}`
      : undefined;

    // Descripción
    const description = show.precio_desde
      ? `Desde $${show.precio_desde}`
      : undefined;

    return {
      name,
      artist: artistName,
      description,
      date: dateTime,
      venue,
      city,
      imageUrl,
      ticketUrl,
      source: 'ticketek',
    };
  } catch (error) {
    console.error(`Error normalizing Ticketek show:`, error);
    return null;
  }
}

/**
 * Scrapea eventos de Ticketek para Córdoba
 */
export async function scrapeTicketek(): Promise<ScrapedShow[]> {
  console.log('🎫 Scraping Ticketek...');

  try {
    const url =
      'https://prod-cms-search.ticketek.com.ar/api/1.1/search/quality?f%5B0%5D=field_artist_node_eb%253Afield_show_venue%253Afield_city:Córdoba';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        Origin: 'https://www.ticketek.com.ar',
        Referer: 'https://www.ticketek.com.ar/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'sec-ch-ua':
          '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: TicketekResponse = await response.json();

    console.log(
      `✅ Ticketek API responded with ${data.resultados_total} artists`
    );

    // Procesar todos los shows
    const shows: ScrapedShow[] = [];
    const now = new Date();

    for (const artist of data.resultados) {
      if (!artist.shows || artist.shows.length === 0) continue;

      for (const show of artist.shows) {
        // Solo shows disponibles para compra
        if (show.estado !== 'buy') continue;

        // Si el show tiene múltiples performances, crear un show para cada una
        if (show.performances && show.performances.length > 0) {
          for (const performance of show.performances) {
            const normalized = normalizeTicketekShow(artist, show, performance);
            if (normalized && normalized.date >= now) {
              shows.push(normalized);
            }
          }
        } else {
          // Show sin performances específicas
          const normalized = normalizeTicketekShow(artist, show);
          if (normalized && normalized.date >= now) {
            shows.push(normalized);
          }
        }
      }
    }

    console.log(`📅 Found ${shows.length} upcoming Ticketek shows`);
    return shows;
  } catch (error) {
    console.error('❌ Error scraping Ticketek:', error);
    throw error;
  }
}

/**
 * Scrapea todos los shows de Córdoba (Ticketek)
 */
export async function scrapeCordobaShowsTicketek(): Promise<ScrapedShow[]> {
  console.log('🎭 Starting Ticketek scraping for Córdoba...');

  try {
    const ticketekShows = await scrapeTicketek();
    console.log(`✅ Ticketek: ${ticketekShows.length} shows`);

    return ticketekShows;
  } catch (error) {
    console.error('❌ Error scraping Ticketek shows:', error);
    return [];
  }
}

/**
 * Guarda los shows de Ticketek en la base de datos
 * Reutiliza la función de scraper-puppeteer
 */
export async function saveTicketekShows(shows: ScrapedShow[]): Promise<{
  created: number;
  updated: number;
  skipped: number;
}> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  console.log('\n💾 Guardando shows de Ticketek en la base de datos...');
  console.log(`📝 Verificando duplicados para ${shows.length} shows...\n`);

  for (const show of shows) {
    try {
      // Buscar si ya existe (por nombre, fecha y venue para evitar duplicados)
      const existing = await prisma.show.findFirst({
        where: {
          name: show.name,
          date: show.date,
          venue: show.venue,
        },
      });

      if (existing) {
        // Verificar si cambió algo importante antes de actualizar
        const hasChanges =
          existing.artist !== show.artist ||
          existing.description !== show.description ||
          existing.imageUrl !== show.imageUrl ||
          existing.ticketUrl !== show.ticketUrl;

        if (hasChanges) {
          await prisma.show.update({
            where: { id: existing.id },
            data: {
              artist: show.artist,
              description: show.description,
              city: show.city,
              imageUrl: show.imageUrl,
              ticketUrl: show.ticketUrl,
              source: show.source,
            },
          });
          updated++;
          console.log(`   ✏️  Actualizado: ${show.name} (${show.venue})`);
        } else {
          skipped++;
          if (skipped <= 3) {
            console.log(`   ⏭️  Ya existe: ${show.name} (${show.venue})`);
          }
        }
      } else {
        // Crear nuevo show
        await prisma.show.create({
          data: show,
        });
        created++;
        console.log(`   ✨ Nuevo: ${show.name} (${show.venue})`);
      }
    } catch (error) {
      console.error(`   ❌ Error guardando "${show.name}":`, error);
      skipped++;
    }
  }

  // Mostrar resumen
  console.log('\n' + '─'.repeat(50));
  console.log('📊 Resumen de guardado (Ticketek):');
  console.log(`   ✨ Creados: ${created}`);
  console.log(`   ✏️  Actualizados: ${updated}`);
  console.log(`   ⏭️  Omitidos (duplicados sin cambios): ${skipped}`);
  console.log('─'.repeat(50));

  return { created, updated, skipped };
}
