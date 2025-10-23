import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Agregar el plugin stealth para evitar detección
puppeteer.use(StealthPlugin());

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
    // Nombre del evento
    const name = event.nombre;
    
    // Artistas - si está vacío, intenta extraer del nombre
    let artist = event.artistas;
    if (!artist || artist.trim() === '') {
      // Intenta extraer artista del nombre (muchos eventos tienen formato "Artista - Título")
      const parts = name.split('-');
      artist = parts[0].trim();
    }

    // Fecha y hora
    const dateStr = event.fecha_inicio; // formato: "YYYY-MM-DD"
    const timeStr = event.hora_inicio;  // formato: "HH:MM:SS"
    const dateTime = new Date(`${dateStr}T${timeStr}`);
    
    // Validar que la fecha sea válida
    if (isNaN(dateTime.getTime())) {
      console.warn(`Invalid date for event: ${name}`);
      return null;
    }

    // Venue y ciudad
    const venue = event.lugar;
    const city = event.nombre_communa || 'Córdoba';

    // Imagen
    const imageUrl = event.miniatura || event.recorte || undefined;

    // URL del evento  
    const ticketUrl = event.url || undefined;

    // Descripción básica
    const description = `${event.category_name || 'Evento'}${event.precio_min ? ` - Desde $${event.precio_min}` : ''}`;

    return {
      name,
      artist,
      description,
      date: dateTime,
      venue,
      city,
      imageUrl,
      ticketUrl,
      source: 'passline'
    };
  } catch (error) {
    console.error(`Error normalizing event:`, error);
    return null;
  }
}

/**
 * Scrapea eventos de Passline usando Puppeteer para manejar Cloudflare
 */
export async function scrapePassline(): Promise<ScrapedShow[]> {
  console.log('🚀 Launching browser to bypass Cloudflare...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ]
  });

  try {
    const page = await browser.newPage();

    // Configurar viewport y user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36');

    console.log('📡 Making API request through browser...');

    // Navegar a la página de Passline primero (para obtener cookies)
    await page.goto('https://home.passline.com/', { waitUntil: 'networkidle2' });
    
    // Esperar un poco para que Cloudflare valide
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Ahora hacer la llamada a la API
    const response = await page.evaluate(async () => {
      const payload = {
        country: "argentina",
        region: "6", // Córdoba
        commune: "",
        communeNum: "",
        type: 0,
        start_date: "",
        end_date: "",
        text: "",
        tag_id: null,
        tag: null,
        limit: "0,300",
        offset: "1"
      };

      const res = await fetch('https://api.passline.com/v1/event/GetBillboardByFilters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://home.passline.com',
          'Referer': 'https://home.passline.com/',
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    });

    console.log(`✅ Got response! Found ${response.length} events`);

    // Filtrar solo eventos futuros
    const now = new Date();
    const shows: ScrapedShow[] = [];

    for (const event of response) {
      const show = normalizePasslineEvent(event);
      if (show && show.date >= now) {
        shows.push(show);
      }
    }

    console.log(`📅 Filtered to ${shows.length} upcoming events`);
    return shows;

  } catch (error) {
    console.error('❌ Error scraping Passline:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Scrapea todos los shows de Córdoba
 */
export async function scrapeCordobaShows(): Promise<ScrapedShow[]> {
  console.log('🎭 Starting Córdoba shows scraping...');
  
  try {
    const passlineShows = await scrapePassline();
    console.log(`✅ Passline: ${passlineShows.length} shows`);
    
    // Aquí puedes agregar más fuentes en el futuro
    // const ticketekShows = await scrapeTicketek();
    
    return passlineShows;
  } catch (error) {
    console.error('❌ Error scraping shows:', error);
    return [];
  }
}

/**
 * Guarda los shows scrapeados en la base de datos
 * Previene duplicados comparando: nombre + fecha + venue
 */
export async function saveScrapedShows(shows: ScrapedShow[]): Promise<{
  created: number;
  updated: number;
  skipped: number;
}> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  console.log('\n💾 Guardando shows en la base de datos...');
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
  console.log('📊 Resumen de guardado:');
  console.log(`   ✨ Creados: ${created}`);
  console.log(`   ✏️  Actualizados: ${updated}`);
  console.log(`   ⏭️  Omitidos (duplicados sin cambios): ${skipped}`);
  console.log('─'.repeat(50));

  return { created, updated, skipped };
}

/**
 * Obtiene los próximos shows desde la base de datos
 */
export async function getUpcomingShows(limit = 100) {
  return prisma.show.findMany({
    where: {
      date: {
        gte: new Date(),
      },
    },
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
    take: limit,
  });
}

/**
 * Busca shows por artista
 */
export async function searchShowsByArtist(artist: string) {
  return prisma.show.findMany({
    where: {
      artist: {
        contains: artist,
        // Note: mode: 'insensitive' not supported in SQLite
        // Convert to lowercase for case-insensitive search
      },
      date: {
        gte: new Date(),
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
}

/**
 * Obtiene estadísticas del scraping
 */
export async function getScrapingStats() {
  const total = await prisma.show.count();
  const upcoming = await prisma.show.count({
    where: {
      date: {
        gte: new Date(),
      },
    },
  });
  const past = total - upcoming;

  const sources = await prisma.show.groupBy({
    by: ['source'],
    _count: true,
  });

  return {
    total,
    upcoming,
    past,
    bySources: sources.map((s: { source: string; _count: number }) => ({
      source: s.source,
      count: s._count,
    })),
  };
}
